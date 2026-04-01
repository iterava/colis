# Colis Email Publish Transition Plan

## Purpose

This document explains how `@iterava/colis-email` should move from sibling-repo local development into a publishable package shape.

Right now local development may use a direct sibling link to `@iterava/colis` so runtime resolution and type-checking work cleanly during active iteration.

That local setup is **not** the final publish model.

## Current Local-Development Assumption

For local work, `@iterava/colis-email` may depend on `@iterava/colis` using a direct local link such as:

- `link:../colis`

This is acceptable for active development across sibling repos.

Why:

- local iteration is faster
- runtime resolution and type-checking go through the same package path
- it avoids custom TypeScript path alias hacks

## Publish Goal

Published consumers of `@iterava/colis-email` must install a normal semver dependency on `@iterava/colis`.

That means publishable `@iterava/colis-email` must **not** contain any of the following:

- `link:../colis`
- `file:../colis`
- TypeScript path aliases pointing at sibling repo files
- assumptions that sibling repos exist next to each other on disk

The intended published dependency shape is:

```json
{
  "dependencies": {
    "@iterava/colis": "^0.1.0"
  }
}
```

Version range should be updated to the actual published core version at release time.

## Required Release Order

`@iterava/colis` must be published before `@iterava/colis-email`.

Reason:

- `@iterava/colis-email` is a downstream consumer of the core contract layer
- publishable `@iterava/colis-email` should depend on a real published core package version

## Publish Transition Checklist

### 1) Publish or stage `@iterava/colis`

Before publishing `@iterava/colis-email`, ensure:

- `@iterava/colis` has a releasable version
- the package builds cleanly
- the package has been published or is otherwise available via the intended registry

### 2) Replace the local dependency shape

In `@iterava/colis-email/package.json`:

- replace `link:../colis` with a real semver dependency on `@iterava/colis`

Example:

- from: `link:../colis`
- to: `^0.1.0`

### 3) Refresh installation state

After changing the dependency:

- reinstall dependencies
- refresh the lockfile
- verify no local-path assumptions remain in the lockfile or generated config

### 4) Re-run package validation

Run:

```bash
vp check
vp test
vp pack
```

All three must pass after the semver dependency replacement.

### 5) Verify consumer installation in a clean temp project

Before publishing `@iterava/colis-email`, test it like an external consumer would.

Recommended smoke test:

1. create a clean temporary project
2. install `@iterava/colis-email`
3. confirm `@iterava/colis` resolves as a normal package dependency
4. verify root import works
5. verify provider subpath import works

Example import checks:

```ts
import { prepareEmailDelivery, dispatchEmailDelivery } from "@iterava/colis-email";

import { createResendEmailProvider } from "@iterava/colis-email/providers/resend";
```

### 6) Confirm no local-dev residue remains

Before publish, verify there is no:

- `link:` dependency for `@iterava/colis`
- `file:` dependency for `@iterava/colis`
- repo-relative path aliasing in `tsconfig.json`
- build behavior that depends on sibling repo layout

## Development Mode vs Publish Mode

### Development mode

Use when actively building sibling repos together.

Characteristics:

- direct local linking is acceptable
- optimized for speed and iteration
- local machine assumptions are allowed

### Publish mode

Use when preparing a distributable package.

Characteristics:

- semver dependency only
- no sibling-repo assumptions
- package behaves like a normal consumer install

## Recommendation

Treat the transition from local link dependency to published semver dependency as a dedicated pre-release step, not an afterthought.

Do not publish until the package has been validated in publish mode.

## Working Rule

If `@iterava/colis-email` only works because the sibling `colis` repo exists locally, it is not ready to publish.
