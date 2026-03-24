# Package Structure for `@iterava/colis`

## Intent

This document is a companion to the phased implementation plan. Its job is to keep the initial package layout small, executable, and aligned with the phase-1 scope.

## Day-1 Structure

### Minimum starting point

```text
src/
  index.ts
  delivery/
    request.ts
    prepared-delivery.ts
    attempt.ts
    receipt.ts
    event.ts
    status.ts
    error.ts
```

### Optional thin seam if implementation pressure justifies it

```text
src/
  interfaces/
    preparer.ts
    sender.ts
```

Why this is the recommended starting point:

- It keeps phase 1 centered on lifecycle/domain contracts.
- It uses one consistent `Delivery*` vocabulary.
- It avoids creating framework seams before a first consumer package exists.
- It leaves room to expand later without forcing that expansion now.

## Day-1 Ownership

### `delivery/`

Owns the public channel-agnostic domain model:

- `DeliveryRequest`
- `PreparedDelivery`
- `DeliveryAttempt`
- `DeliveryReceipt`
- `DeliveryEvent`
- `DeliveryStatus`
- `DeliveryPhase`
- normalized errors

Rules:

- keep payloads opaque to core
- keep targets opaque to core
- keep statuses and events generic
- do not introduce email field names
- do not create separate top-level `message.ts` and `request.ts` concepts
- make `DeliveryReceipt` a snapshot model, not an event model
- make `DeliveryEvent` a transition model, not a snapshot model

### `interfaces/`

Owns only the thinnest justified orchestration seams:

- `DeliveryPreparer`
- `DeliverySender`

Rules:

- keep these interfaces optional for phase 1 if contracts alone are sufficient
- do not add dispatch/enqueue/observe abstractions until downstream pressure requires them
- do not add framework mechanics such as middleware, plugin hooks, or registries here
- do not create this directory at all unless implementation pressure justifies it

### `index.ts`

Owns a deliberate root export surface.

Rules:

- export only stable identifiers
- avoid wildcard re-exports of entire folders
- keep the root API small enough to review line by line

## Not Part of the Day-1 Layout

The following should be treated as deferred, not implied:

- `routing/`
- `reliability/`
- `middleware/`
- `plugins/`
- `registry/`
- `internal/pipeline`
- storage or persistence modules
- worker/runtime-facing modules
- webhook or replay modules

## Possible Later Expansion

If a real consumer package proves the need, the layout can expand incrementally by adding one seam at a time, such as:

- `interfaces/dispatcher.ts`
- `interfaces/enqueuer.ts`
- `routing/route.ts`
- `routing/policy.ts`
- `reliability/retry.ts`
- `reliability/idempotency.ts`

That is not a commitment for the first pass. It is only a safe direction for later growth if real usage justifies it.

## Naming Guardrails

- Prefer `DeliveryRequest` over `MessageRequest`, `Intent`, `RecipientRequest`, or other near-duplicate request nouns.
- Use `target` consistently in core instead of alternating between `target` and `recipient`.
- Prefer `PreparedDelivery` over generic `Message` or `Job` terms in core.
- Use `DeliveryAttempt`, `DeliveryReceipt`, and `DeliveryEvent` consistently across docs and exports.
- If a new concept cannot be explained without channel, provider, queue, storage, or webhook assumptions, it likely does not belong in the day-1 package structure.
