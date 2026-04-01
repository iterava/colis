# Colis Email Pressure Review

## Outcome

The current `@iterava/colis` phase-1 contracts are sufficient for `@iterava/colis-email` as implemented today.

- `DeliveryRequest` cleanly carries email-owned `target`, `content`, `metadata`, and `idempotencyKey` without pulling email fields into core.
- `PreparedDelivery` is materially useful because preparation normalizes address lists, trims content, deduplicates recipients and tags, and produces a stable `deliveryId`.
- `DeliveryAttempt`, `DeliveryReceipt`, and `DeliveryEvent` remain distinct in practice during provider dispatch normalization.
- Provider diagnostics stay intentionally local to `@iterava/colis-email` through `ProviderDispatchOutcome` instead of leaking into core lifecycle outputs.

## Evidence From The Current Package

### Request and preparation pressure

`src/email/request.ts` maps email inputs into `DeliveryRequest<EmailContent, EmailTarget, EmailMetadata>` with no core-side email abstraction required.

`src/prepare/prepare-email-delivery.ts` shows why `PreparedDelivery` is not redundant:

- `target.to`, `cc`, `bcc`, `from`, and `replyTo` are normalized into a dispatch-ready target shape
- email addresses are trimmed, lowercased, deduplicated, and validated
- content is trimmed and validated
- tags are deduplicated
- `deliveryId` and `preparedAt` are created once and then reused by dispatch

That is exactly the kind of post-request, pre-dispatch state that core says `PreparedDelivery` should represent.

### Dispatch and lifecycle pressure

`src/dispatch/dispatch-email-delivery.ts` consumes `PreparedEmailDelivery` and produces:

- one `DeliveryAttempt`
- one `DeliveryReceipt`
- one `DeliveryEvent`
- one local `ProviderDispatchOutcome`

The split is clean:

- `DeliveryAttempt` carries per-try status, timestamps, error, and external reference
- `DeliveryReceipt` carries the current snapshot
- `DeliveryEvent` carries the point-in-time transition
- `ProviderDispatchOutcome` carries provider-only diagnostics that should not become core contract fields

This package did not need a core sender interface, registry seam, or provider-aware result model to make dispatch work.

## Most Concrete Remaining Awkwardness

Provider diagnostics are useful during adapter work, but core lifecycle outputs intentionally have nowhere to store them.

That is not a defect in the current design. In this package, the right move was to return diagnostics as part of the local `ProviderDispatchOutcome` while keeping `DeliveryAttempt`, `DeliveryReceipt`, and `DeliveryEvent` provider-neutral.

## Decision

- Core sufficient as-is: yes
- Narrow core type refinement justified: no
- Small new seam justified: no

## Recommended Next Move

Keep the current core unchanged and treat any future request for new core surface as needing pressure from a second downstream package or a concrete runtime that cannot be expressed with the existing lifecycle contracts.
