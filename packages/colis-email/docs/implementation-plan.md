# Colis Email Implementation Plan

## Purpose

`@iterava/colis-email` is the first real downstream channel package for Colis.

Its job is to validate the current `@iterava/colis` core against real email-package design and implementation pressure without turning this repo into the whole delivery platform.

## Current State

This repository now has a real package skeleton in place:

- Vite+ library baseline is in place
- repository metadata and community-health files are in place
- the starter source and placeholder test have been replaced with the first real package layout
- the current code establishes package boundaries, preparation flow shape, dispatch flow shape, and a first internal Resend adapter path without committing to broader platform architecture

## Core Boundaries

These rules are non-negotiable for the first pass:

- `@iterava/colis` remains the channel-agnostic core
- `@iterava/colis-email` owns email-specific concepts
- provider details must be normalized at the adapter edge
- Resend must not be hardcoded into the package architecture as the only supported provider assumption
- the package should treat providers as adapter-style integrations, with Resend as the first implementation path
- do not build a broad plugin framework on day 1 just to make providers pluggable in theory
- runtime, queue, webhook, worker, and storage concerns do not belong in core by default
- if this package exposes core friction, capture only the smallest justified seam
- do not expand core based on anticipated future platform scope alone

## Primary Objective

Turn `@iterava/colis-email` from a scaffold into the first real downstream pressure test for `@iterava/colis`.

## Success Criteria

This plan is successful if one of these outcomes is reached:

1. `@iterava/colis-email` can proceed cleanly using the current core contracts as-is, or
2. it exposes one narrow, concrete core gap that is justified by real downstream package needs

Failure mode to avoid:

- inventing platform-level abstractions before real package pressure requires them

## Recommended Implementation Sequence

### Phase A — Replace the scaffold with a real package shape

Objective:
Remove the toy starter export and establish the actual package boundary.

Deliverables:

- replace placeholder `src/index.ts`
- replace placeholder `tests/index.test.ts`
- add a proper docs-backed package purpose statement
- establish the first real module layout

### Phase B — Define the first public surface

Objective:
Keep the initial API deliberately small.

Export only what is required for the first real package pass, such as:

- email request input types
- prepare path types/functions
- dispatch/send path types/functions
- provider-neutral adapter interfaces and normalized package-level outputs/errors
- one provider path only in the first pass, exposed as an optional provider module rather than root API identity

Do not export broad framework concepts.

### Phase C — Implement one provider path end-to-end

Objective:
Prove the package with one provider, one clean flow, and one normalization path.

Architecture note:

- the first implementation may be Resend
- Resend should live behind a provider adapter boundary
- public root package APIs should not assume Resend-only naming or Resend-specific request/response types
- provider-specific helpers should be isolated to explicit provider modules such as `providers/resend`
- choosing Resend first is an execution shortcut, not a package-level lock-in decision

Recommended first-pass flow:

1. accept an email-shaped request
2. validate and normalize it
3. convert it into core-compatible delivery concepts
4. dispatch through one provider
5. normalize the provider result into core vocabulary such as attempts, receipts, and events where justified

### Phase D — Record pressure findings

Objective:
Use real package implementation pressure to judge whether core needs any change.

Questions this package should answer:

- Is `DeliveryRequest` sufficient once email targets and content are real?
- Is `PreparedDelivery` materially useful in a real email path?
- Do `DeliveryAttempt`, `DeliveryReceipt`, and `DeliveryEvent` still feel correctly separated?
- Is one small new seam justified?
- Or is the current core already right-sized?

Valid outcomes:

- no core change needed
- one narrow core change justified

Invalid outcome:

- broad architecture expansion because it sounds clean on paper

## Recommended Package Layout

This is the intended next real shape for the repo:

```text
src/
  index.ts
  email/
    request.ts
    target.ts
    content.ts
  prepare/
    prepare-email-delivery.ts
  dispatch/
    dispatch-email-delivery.ts
  providers/
    types.ts
    resend/
      client.ts
      normalize.ts
  normalize/
    delivery-attempt.ts
    delivery-receipt.ts
    delivery-event.ts
  errors/
    email-error.ts

tests/
  package-boundary.test.ts
  prepare-email-delivery.test.ts
  dispatch-email-delivery.test.ts
  provider-normalization.test.ts
```

Notes:

- this layout is pressure-driven, not final doctrine
- provider-specific code stays inside provider-facing modules
- core-facing normalized outputs should stay provider-neutral
- provider-specific modules may be published as optional subpaths, but they do not define the root package contract

## Recommended First PR Sequence

### PR 1 — Replace the scaffold with a real skeleton

Scope:

- remove placeholder export and test
- create the first real package layout
- update README and docs to reflect actual package intent
- no broad provider implementation yet beyond shape/stubs if needed

### PR 2 — Email request and prepare path

Scope:

- add email-specific request, target, and content types
- implement preparation logic into a core-compatible shape
- add tests proving email concepts stay in `colis-email`, not core

### PR 3 — One provider dispatch path

Scope:

- implement one provider only
- send path
- normalization into core vocabulary
- success/failure tests and normalized error tests

### PR 4 — Pressure findings and core review

Scope:

- document what felt awkward
- decide whether core needs:
  - no change
  - one type refinement
  - one small new seam

Only after this review should changes to `@iterava/colis` be considered.

## Test Priorities

### Must-have tests

- email types stay in `colis-email`, not core
- provider-specific fields do not leak into core
- email target and content can be prepared cleanly
- provider success maps into normalized core results
- provider failure maps into normalized retryable/non-retryable error shapes
- current core vocabulary works without adding email-only concepts

### Later tests

- provider mapping snapshots
- cross-provider comparison tests
- webhook event normalization tests

These are explicitly later.

## What Not To Build Yet

Do not start with any of the following:

- template editor or rendering platform
- campaign layer
- subscriber or preference center
- quiet hours
- multi-channel orchestration
- fallback systems
- worker/runtime contracts
- webhook ingestion platform
- provider registry abstraction
- multi-provider failover

Those are later platform concerns, not day-1 `colis-email` scope.

## Working Rule

If a proposed addition is justified only by future ambition and not by current downstream implementation pressure, do not add it yet.
