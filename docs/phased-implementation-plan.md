# Phased Implementation Plan for `@iterava/colis`

## Purpose

This repo should produce the smallest useful channel-agnostic core for Colis.

The first implementation pass should give downstream packages a stable delivery-domain contract layer without introducing a framework, runtime model, or channel-specific assumptions. The target is a practical core package that later packages such as `@iterava/colis-email` can consume without forcing email, provider, queue, or storage concerns into the center of the design.

## Non-Goals

`@iterava/colis` should explicitly not implement or own:

- Email-specific payload fields such as `subject`, `html`, `text`, `attachments`, `from`, or `replyTo`
- Provider SDK bindings, provider request/response types, or provider-specific status vocabularies
- Queue drivers, job workers, webhook servers, RPC interfaces, or deployment/runtime concerns
- Persistence implementations, storage abstractions, replay systems, or receipt databases
- Subscriber databases, inbox products, preference centers, workflow builders, or campaign systems
- Channel-specific rendering systems or template editors
- Cross-channel fallback execution engines
- Exact-once guarantees
- Plugin frameworks, middleware pipelines, or registry systems in the first implementation pass

## Design Constraints

- Core must stay strictly channel-agnostic.
- Core must model delivery lifecycle and normalized results, not channel payload details.
- Channel payloads and channel targets must remain opaque to core other than generic typing.
- The vocabulary should center on `DeliveryRequest`, `PreparedDelivery`, `DeliveryAttempt`, `DeliveryReceipt`, and `DeliveryEvent`.
- Avoid parallel core concepts such as separate `message`, `intent`, and `request` models unless a new concept is materially distinct.
- Phase 1 should be the minimum stable contract layer, not a generalized delivery framework.
- Runtime, storage, queue, replay, and webhook concerns are deferred unless a later consumer proves they must exist in core.
- Testing should use fake-channel coverage to catch accidental email leakage and accidental runtime assumptions.

## Recommended Day-1 Module Layout

The initial implementation should be smaller than the earlier draft structure.

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

Guidelines:

- `delivery/` owns the public domain contracts and lifecycle vocabulary.
- `interfaces/` is optional in the first pass. Create it only if the first implementation genuinely benefits from explicit `DeliveryPreparer` or `DeliverySender` contracts.
- `index.ts` should re-export a curated public surface only.
- Do not create `routing/`, `middleware/`, `plugins/`, `reliability/`, `registry/`, or `internal/pipeline` modules in the first pass.
- Do not split day-1 concepts into both `message.ts` and `request.ts`. Use `DeliveryRequest` as the primary request term.

## Possible Later Expansion

If real downstream packages later prove the need, the package can grow by adding one seam at a time, for example:

- thin orchestration interfaces such as `dispatcher`, `observer`, or `enqueuer`
- routing or policy contracts
- retry or idempotency contracts

That growth should be pressure-driven, not assumed up front.

## Proposed Core Domain Model with Standardized Naming

### `DeliveryRequest`

The application-facing input to core.

Responsibilities:

- carry the channel identifier
- carry an opaque channel payload
- carry an opaque channel target
- carry metadata
- optionally carry an `idempotencyKey`
- represent what the application is asking Colis to deliver

Guidance:

- Prefer `DeliveryRequest` as the only request noun in core.
- Use `target` consistently in core, not `recipient`.
- Keep target generic in phase 1 rather than inventing a shared address envelope too early.
- Do not introduce a separate top-level `MessageRequest`, `DeliveryIntent`, or `Message` concept in phase 1.

### `PreparedDelivery`

The validated and normalized output of a `DeliveryRequest`, ready for dispatch by a downstream channel or runtime package.

Responsibilities:

- carry a stable `deliveryId`
- preserve the logical delivery identity
- hold the opaque prepared payload
- hold the opaque normalized target
- capture normalization output that belongs to preparation rather than dispatch

Guidance:

- `PreparedDelivery` should be materially different from `DeliveryRequest`, not a duplicate with a different name.
- It exists to represent post-validation/post-normalization state.
- It is not a queue job, persistence model, or worker payload.

### `DeliveryAttempt`

One dispatch try for a prepared delivery.

Responsibilities:

- carry a stable `attemptId`
- refer back to `deliveryId`
- expose normalized status and timestamps
- expose normalized error data when relevant
- optionally carry provider/external references
- support retryability decisions without assuming a retry engine

Guidance:

- Provider/external references should live here in phase 1, not on `DeliveryReceipt`.

### `DeliveryReceipt`

The current normalized snapshot of delivery state.

Responsibilities:

- expose the current delivery status
- refer to `deliveryId`
- optionally point to the latest attempt via `latestAttemptId`
- expose high-level timestamps when known
- remain provider-neutral

Guidance:

- `DeliveryReceipt` is a state/snapshot model.
- Do not let it become a duplicate event record or a container of full attempt history in phase 1.

### `DeliveryEvent`

A point-in-time normalized lifecycle transition.

Responsibilities:

- refer to `deliveryId`
- represent a discrete lifecycle transition
- optionally refer to `attemptId` when relevant
- carry normalized event metadata without becoming provider-specific

Guidance:

- `DeliveryEvent` is a transition/event model.
- Keep it distinct from `DeliveryReceipt`, which is the current snapshot.
- Phase 1 should keep event vocabulary small and generic.

### `DeliveryStatus`

The normalized high-level state of a delivery or attempt.

Day-1 bias:

- `pending`
- `accepted`
- `delivered`
- `failed`
- `canceled`

Guidance:

- Keep the status set compact and provider-neutral.
- Do not mirror email/webhook/provider vocabularies directly in core.
- Do not use preparation or dispatch pipeline markers as public status values in phase 1.

### `DeliveryPhase`

The normalized processing phase for errors and diagnostics.

Day-1 bias:

- `validate`
- `prepare`
- `dispatch`

Guidance:

- Do not introduce `observe` into the public phase model until observation exists as a real core concern.

### Normalized Errors

Core errors should encode:

- `phase`
- `code`
- `message`
- `retryable`
- optional `cause`
- optional `details`

The error model should support later channel packages without embedding provider-specific types.

## Proposed Phase-1 Public API Surface

Phase 1 should export only the smallest stable set needed by the first consumer package.

Recommended type exports:

- `DeliveryRequest`
- `PreparedDelivery`
- `DeliveryAttempt`
- `DeliveryReceipt`
- `DeliveryEvent`
- `DeliveryStatus`
- `DeliveryPhase`
- normalized error types and error-code unions

Optional interface exports, only if implementation pressure justifies them:

- `DeliveryPreparer`
- `DeliverySender`

Phase-1 notes:

- `DeliveryPreparer` is justified only if `PreparedDelivery` benefits from an explicit preparation seam in the first code pass.
- `DeliverySender` is justified only if a thin direct-send seam improves the first consumer discussion.
- `Dispatcher`, `Enqueuer`, `Observer`, route/policy contracts, and reliability contracts should wait until a real consumer proves they belong in core.
- Avoid separate `SendResult` and `EnqueueResult` types in phase 1 unless implementation pressure proves they add clarity.

## Tighter Phased Implementation Plan

### Phase 0: Lock vocabulary and boundaries

Objective:
Finalize the day-1 contract set and naming before code expands.

Scope:

- confirm the standardized `Delivery*` vocabulary
- confirm day-1 module layout
- confirm what is intentionally deferred
- lock the `target`, `deliveryId`, `attemptId`, snapshot-vs-event, and status/phase rules

Deliverables:

- approved planning docs
- explicit list of phase-1 exports
- resolved naming and boundary decisions for request/prepared/attempt/receipt/event/status/error

### Phase 1: Smallest useful contract layer

Objective:
Implement the lifecycle/domain contract layer only.

Scope:

- `DeliveryRequest`
- `PreparedDelivery`
- `DeliveryAttempt`
- `DeliveryReceipt`
- `DeliveryEvent`
- `DeliveryStatus`
- `DeliveryPhase`
- normalized errors
- curated root exports
- optional thin `DeliveryPreparer` and `DeliverySender` interfaces only if truly justified

Deliverables:

- stable TypeScript contracts
- concise API comments where naming could be misread
- contract-level tests and type tests

Explicitly out of scope:

- plugins
- middleware
- registries
- route/policy systems
- retry/idempotency engines beyond an optional `idempotencyKey`
- queue models
- webhook or observation behavior

### Phase 2: First consumer pressure pass

Objective:
Validate whether the phase-1 contracts are sufficient for the first downstream package.

Scope:

- fake-channel consumer tests
- minimal API adjustments driven by real package usage
- no expansion into runtime or framework concerns unless clearly unavoidable

Deliverables:

- consumer-oriented tests
- narrowed follow-up backlog for missing seams

### Phase 3: Add the next seam only when justified

Objective:
Introduce the next smallest missing contract, not a general framework.

Possible candidates:

- explicit send vs dispatch separation
- enqueue contract
- routing or policy contract
- retry or idempotency contract

Rule:

- choose only one area at a time based on concrete downstream pressure

## Recommended First PR Sequence

1. PR 1: Add minimal domain contracts plus anti-leakage tests
   - `DeliveryRequest`
   - `PreparedDelivery`
   - `DeliveryAttempt`
   - `DeliveryReceipt`
   - `DeliveryEvent`
   - `DeliveryStatus`
   - `DeliveryPhase`
   - normalized errors
   - type tests and fake-channel / anti-email-leakage coverage

2. PR 2: Add curated root exports and documentation comments
   - keep the public API deliberate
   - avoid accidental export sprawl

3. PR 3: Add only the thinnest justified interfaces if needed
   - `DeliveryPreparer`
   - `DeliverySender`
   - skip this PR entirely if plain contract exports are enough for the first consumer discussion

4. PR 4: Consumer-pressure refinements
   - only after real package usage
   - add the next smallest seam if a consumer proves it is necessary

## Testing Strategy

Testing should stay practical and biased toward boundary protection.

Recommended coverage:

- Type tests proving core contracts accept opaque channel payloads
- Type tests proving core contracts accept opaque non-email target shapes
- Negative tests proving core does not require email-shaped fields
- Fake-channel tests proving a non-email channel can use the same contracts cleanly
- Tests for normalized status and event modeling
- Tests ensuring normalized errors always carry phase and retryability information
- Tests proving core does not assume queue, job, store, or webhook semantics

Specific anti-leakage checks worth encoding:

- core contracts do not define `subject`
- core contracts do not define `html`
- core contracts do not define `text`
- core contracts do not define `attachments`
- core contracts do not define `from`
- core contracts do not define `replyTo`
- target modeling does not require an email address shape
- receipts do not become attempt-history stores
- events do not become receipt snapshots

## What Not to Implement Yet

- Middleware or hook systems
- Plugin APIs or registries
- Route or policy resolution contracts
- Retry strategy contracts
- Rich idempotency contracts beyond an optional `idempotencyKey`
- Queue semantics, enqueued job models, or worker-facing payloads
- Persistence abstractions, receipt stores, or attempt stores
- Replay/debug models
- Webhook parsing or normalized inbound provider events
- Channel registries
- Builder DSLs or framework-style composition helpers
- Channel-specific example types in core beyond opaque test payloads

## Open Questions for TK

- Should phase 1 ship with only contracts, or with optional `DeliveryPreparer` / `DeliverySender` interfaces as well?
- What is the smallest `DeliveryStatus` set that still feels useful across channels after initial implementation pressure?
- Should `canceled` remain day-1 scope, or be deferred until a concrete cancel path exists in a consumer?
- Is an optional `idempotencyKey` enough for phase 1, or should even that wait until a real consumer demands it?
