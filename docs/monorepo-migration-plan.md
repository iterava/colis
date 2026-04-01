# Monorepo Migration Plan for Colis

## Purpose

This document captures the recommended plan for restructuring Colis into a single monorepo before the first public npm release.

The migration goal is to consolidate repo shape, workspace tooling, docs, CI, and release flow **without redesigning the library**.

## Decision Summary

### Recommendation

Restructure now.

Use:

- **one GitHub repo:** `iterava/colis`
- **two publishable packages:**
  - `packages/colis` → `@iterava/colis`
  - `packages/colis-email` → `@iterava/colis-email`

### Tooling Recommendation

Use a **hybrid approach**:

- perform the actual migration **manually** inside the live `iterava/colis` repo on a feature branch
- optionally generate **one throwaway Vite+ monorepo** in a temp directory to inspect current scaffold conventions
- do **not** use Vite+ in-place migration tooling as the engine of the live move

Rationale:

- `iterava/colis` already exists on GitHub
- `colis-email` is still local and unpublished
- npm packages have not been released yet
- this is the cheapest point to consolidate
- manual migration minimizes accidental churn
- Vite+ is useful as a scout, but the live repo move should stay surgical

## Current State

### Current repos

- GitHub-backed core repo:
  - `/Users/dewgie/omfg/iterava/colis/repos/colis`
  - GitHub: `iterava/colis`
- Local, not-yet-pushed email repo:
  - `/Users/dewgie/omfg/iterava/colis/repos/colis-email`

### Current package intent

- `@iterava/colis` = tiny channel-agnostic core
- `@iterava/colis-email` = first downstream email package

### Current dependency shape

`colis-email` currently uses a local sibling dependency on core.

That should become a workspace dependency during the migration.

### Current design constraints that remain in force

- Core stays channel-agnostic.
- No email-only fields in core.
- No provider SDK leakage in core.
- No runtime-specific queue, database, or webhook assumptions in core.
- `@iterava/colis-email` owns email-specific target, content, request, and provider concerns.
- Resend remains the first optional provider path, not the package architecture.
- Most real users should eventually install `@iterava/colis-email`, not the abstract core package.
- The migration should restructure the repo, not redesign the library.

## Explicit Migration Guardrails

The following are **out of scope** during the migration:

- API redesign
- renaming current public concepts just because another shape seems cleaner
- adding new providers
- adding new channels
- adding worker/runtime/webhook systems
- adding orchestration, routing, failover, or platform abstractions
- widening runtime support claims
- doing a generalized architecture rewrite while files are moving

Working rule:

> Only move structure, metadata, scripts, docs boundaries, and package boundaries.

## Target Repository Shape

### Required migration target

```text
iterava/colis/
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  README.md
  LICENSE
  tsconfig.base.json            # only if it stays minimal and useful
  vite.config.ts                # optional, root orchestration only
  .github/
    workflows/
  docs/
    package-structure.md
    phased-implementation-plan.md
    monorepo-migration-plan.md
  scripts/
    smoke-tarballs.mjs
  packages/
    colis/
      package.json
      README.md
      vite.config.ts
      tsconfig.json
      src/
      tests/
    colis-email/
      package.json
      README.md
      vite.config.ts
      tsconfig.json
      src/
      tests/
```

### Optional follow-up structure after the migration

These are useful, but they are **not required** to complete the monorepo move itself:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.changeset/`
- `.github/ISSUE_TEMPLATE/`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `examples/`

## Root vs Package Responsibilities

### Root should own

- workspace/package-manager configuration
- CI/workflows
- shared release tooling
- shared docs
- smoke-test scripts
- root README explaining package map and install guidance
- optional minimal root Vite+ config for orchestration only
- exactly one workspace-level package-manager pin and one workspace lockfile

### Root should not own

- publishable library source
- package-specific implementation details
- package-specific README content beyond the package map

### Package directories should own

Each publishable package should own:

- its source
- its tests
- its package README
- its own `package.json`
- its own package-local config (`vite.config.ts`, `tsconfig.json`)
- its own pack/build/test behavior

## Docs and Examples Split

### Root README

The root README should explain:

- what Colis is
- what it is not
- package map
- which package most users should install first
- repo structure
- links to package READMEs and examples

### `packages/colis/README.md`

Should explain:

- who core is for
- the tiny contract surface
- adapter-author orientation
- what core deliberately does not contain

### `packages/colis-email/README.md`

Should explain:

- install
- quickstart
- provider-neutral email usage
- testing story
- currently supported provider path(s)
- non-goals

### `examples/`

Runnable examples belong at the root **if and when we add them**.

They are useful, but not migration-critical.

Rationale:

- examples should exercise public package import paths
- examples should be usable for tarball smoke tests
- examples should not automatically become first-class workspace packages during the migration

## Vite+ Strategy

### Recommended use of Vite+

Use Vite+ as a **reference scout**, not as the live migration engine.

### Approved use

- generate one temporary monorepo outside the live repo
- inspect root scaffold conventions
- borrow only what is clearly useful

### Disallowed use for this migration

- in-place Vite+ migration of the live repo
- letting template scaffolding decide package architecture
- adopting generated demo code or extra apps just because they are present

### What to inspect in the throwaway scaffold

Inspect only:

- root `package.json`
- `pnpm-workspace.yaml`
- root `vite.config.ts`
- root CI/workflow shape
- any clearly useful Node/package-manager pinning conventions

### What to ignore from the scaffold

Ignore:

- sample packages/apps
- demo code
- template naming
- structure that assumes website/apps/docs-site work we do not need yet
- anything that tries to reshape Colis itself

## Workspace and Package Configuration

## Root `package.json`

The workspace root should be:

- `private: true`
- orchestration-only
- non-publishable
- the single source of truth for workspace package-manager versioning

The root should own scripts like:

- `check`
- `test`
- `build`
- `pack:dry-run`
- `pack:tarballs`
- `smoke:tarballs`

It should **not** pretend to be a publishable package.

### Root tooling consolidation

The migration should explicitly consolidate workspace tooling at the root:

- choose one root `packageManager` version
- create one root `pnpm-lock.yaml`
- remove per-package lockfiles after the move
- preserve any required `pnpm.overrides` from the current repos
- avoid leaving package-manager drift between `packages/colis` and `packages/colis-email`

## Workspace config

Use pnpm workspaces with a root `pnpm-workspace.yaml`.

Initial package globs should be minimal:

```yaml
packages:
  - "packages/*"
```

Do not include `examples/*` in the workspace at first.

## Per-package manifests

Each publishable package should explicitly own:

- `name`
- `version`
- `description`
- `license`
- `homepage`
- `bugs`
- `repository` with `directory`
- `types`
- explicit `exports`
- `files`
- `engines`
- `publishConfig.access = "public"`
- package-local `check` / `test` / `build` / `prepack` scripts

### Repository directory values

- `packages/colis`
- `packages/colis-email`

### Required metadata rewrite during migration

The migration must explicitly update package metadata so the new monorepo is the canonical source:

- `@iterava/colis` should point to the monorepo with `repository.directory = "packages/colis"`
- `@iterava/colis-email` should stop pointing at a standalone repo and instead use the monorepo root plus `repository.directory = "packages/colis-email"`
- `@iterava/colis-email` `homepage` and `bugs` URLs should be rewritten to the monorepo
- existing public exports must survive the move, including:
  - `@iterava/colis`
  - `@iterava/colis-email`
  - `@iterava/colis-email/providers/resend`

### Dependency rewrite

Replace the local sibling dependency with:

```json
"@iterava/colis": "workspace:^"
```

That should be the monorepo dependency story instead of `link:../colis`.

## Migration Strategy

## Branch strategy

Do the migration on a feature branch inside `iterava/colis`.

Recommended posture:

- one feature branch in `iterava/colis`
- one safety tag or clearly recoverable baseline on current default branch state
- no API work mixed into the branch

## Phase 0 — Pre-migration audit

### Tasks

- baseline current `colis` repo:
  - `vp check`
  - `vp test`
  - `vp pack`
- baseline current `colis-email` repo:
  - `vp check`
  - `vp test`
  - `vp pack`
- inventory current package metadata in both repos:
  - `exports`
  - `types`
  - `files`
  - scripts
  - README presence
  - `homepage`
  - `bugs`
  - `repository`
  - `packageManager`
  - `pnpm.overrides`
- decide whether `colis-email` local Git history matters enough to preserve
- decide which root `packageManager` version and root `pnpm.overrides` set will become canonical

### Expected output

- validated baseline before structural change
- clear metadata inventory
- clear answer on whether local email history needs preservation

### Rollback point

- return to the pre-migration branch/tag state

## Phase 1 — Vite+ scout

### Tasks

- generate one throwaway Vite+ monorepo outside the live repo
- inspect only root-level conventions
- decide which, if any, scaffold ideas are worth copying
- explicitly choose **manual live migration** as the execution path

### Expected output

- one reference scaffold
- a short list of root-level conventions worth borrowing

### Rollback point

- delete the throwaway scaffold

## Phase 2 — Move core into `packages/colis`

### Tasks

- create `packages/colis/`
- move the current core package into it using `git mv`
- move the package README with it
- keep package-level source/tests/config attached to the package
- immediately create the new root workspace files after the move:
  - root `package.json`
  - `pnpm-workspace.yaml`
  - root `pnpm-lock.yaml`
  - `tsconfig.base.json` only if it stays minimal and does not normalize package differences away
  - root `.gitignore` updates if needed
  - optional minimal root `vite.config.ts` only if it proves useful for orchestration

### Expected output

- current core becomes `packages/colis`
- repo root becomes obviously a workspace coordinator, not a package

### Rollback point

- revert the move and root scaffold commits

## Phase 3 — Import `colis-email` into `packages/colis-email`

### Tasks

- choose import method:
  - preserve history if easy
  - otherwise copy it in cleanly
- place email package under `packages/colis-email`
- replace `link:../colis` with `workspace:^`
- ensure email imports core by package name, not by sibling source path
- preserve the existing public `./providers/resend` package subpath
- move or create package README

### Expected output

- second publishable package inside the workspace
- workspace dependency shape replaces local sibling linking

### Rollback point

- revert the import commit(s)

## Phase 4 — Wire workspace, metadata, and CI

### Tasks

Finalize root orchestration:

- root `package.json`
- `pnpm-workspace.yaml`
- root scripts
- `scripts/smoke-tarballs.mjs`
- CI workflow

Finalize package metadata:

- `repository.directory`
- `homepage`
- `bugs`
- `exports`
- `types`
- `files`
- `publishConfig.access`
- package scripts
- preserve any required `pnpm.overrides`
- remove nested lockfiles once the root lockfile is authoritative

Optionally add later:

- `.changeset/`
- governance docs
- issue/PR templates
- examples

These are good follow-up moves, but they are not required to complete the structural migration.

### Expected output

- runnable workspace
- publish-ready metadata boundaries
- shared CI and smoke-test entrypoints

### Rollback point

- revert config-only changes before merge

## Phase 5 — Validate tarballs and package boundaries

### Tasks

From the workspace root:

- `vp install`
- `vp run -r check`
- `vp run -r test`
- `vp run -r build`

From each package:

- `vp check`
- `vp test`
- `vp pack`
- `pnpm pack --dry-run`
- `pnpm pack --pack-destination <artifacts-dir>`

From a clean temp directory outside the workspace:

- install the packed tarballs
- verify public imports only:
  - `@iterava/colis`
  - `@iterava/colis-email`
  - `@iterava/colis-email/providers/resend`
- run a runtime smoke script against those packed artifacts
- run a TypeScript compile smoke that imports the same public entrypoints, including `@iterava/colis-email/providers/resend`

### Expected output

- proof that package boundaries work outside the workspace
- proof that tarballs contain the right files and metadata
- proof that workspace symlinks are not masking packaging errors

### Rollback point

- stop before merge and fix packaging/metadata issues

## Phase 6 — Push, review, and cleanup

### Tasks

- push feature branch to `iterava/colis`
- review the move in one PR
- merge only after tarball smoke tests pass
- archive or remove the standalone local `colis-email` repo once import is confirmed complete
- update any local docs/scripts that still point at the old split-repo layout

### Expected output

- one canonical repo
- no dangling split-repo workflow
- clean base for public scoped npm release

### Rollback point

- do not merge until packaging and smoke validation are green

## Validation Checklist

### Local workspace validation

- `vp install`
- `vp run -r check`
- `vp run -r test`
- `vp run -r build`

### Package validation

For each package:

- `vp check`
- `vp test`
- `vp pack`
- `pnpm pack --dry-run`

### Tarball validation

- pack both packages to a real artifacts directory
- install them into a clean temp project
- verify runtime imports for:
  - `@iterava/colis`
  - `@iterava/colis-email`
  - `@iterava/colis-email/providers/resend`
- verify a TypeScript compile smoke for the same entrypoints
- verify bundled declarations exist
- verify `dist/` exists
- verify package READMEs are present
- verify no workspace/local-only dependency specs survive in the tarballs

## Risks and Mitigations

### Path churn

**Risk:** large diffs and harder review

**Mitigation:** isolate the core move in its own clear commit before metadata cleanup

### Broken package metadata

**Risk:** wrong `repository.directory`, `exports`, `types`, or `files`

**Mitigation:** do one focused metadata review pass and validate with tarballs, not only workspace imports

### Hidden packaging bugs

**Risk:** everything works in the workspace but breaks for external consumers

**Mitigation:** require tarball packing, clean temp installs, and runtime + TypeScript smoke checks for the real public entrypoints before merge

### README drift

**Risk:** root and package READMEs contradict each other

**Mitigation:** update root and package READMEs in the same PR as the move

### Root/package confusion

**Risk:** contributors treat the root as a package

**Mitigation:** set root `private: true` and keep publishable library source only in `packages/*`

### Wasted effort from over-scaffolding

**Risk:** time lost deleting template structure and demo code

**Mitigation:** use the Vite+ generator only once as a scout, not as the live mutator, and treat non-structural follow-up work as optional after the repo move lands

### Migration creep into architecture work

**Risk:** the move turns into redesign, abstraction churn, or scope expansion

**Mitigation:** enforce the migration guardrails above and reject any “while we’re here” architecture changes

## Manual vs Generator-Assisted Migration

### Manual live migration

- **Speed:** medium
- **Safety:** highest
- **Churn:** low to medium
- **Risk to working packages:** lowest
- **Recommendation:** use this for the actual migration

### Vite+ in-place conversion

- **Speed:** looks fast at first
- **Safety:** lowest
- **Churn:** highest
- **Risk to working packages:** highest
- **Recommendation:** do not use this on the live repo

### Generate-new-then-port

- **Speed:** medium
- **Safety:** medium-high
- **Churn:** medium
- **Risk to working packages:** low to medium
- **Recommendation:** useful only as a scouting/reference step

## Final Recommendation

Use:

- **manual migration in the live `iterava/colis` repo**
- **optional one-time Vite+ monorepo scout** outside the live repo
- **strict boundary discipline** so the move stays structural, not architectural

## Do Not Do This During Migration

- do not redesign APIs
- do not rename public concepts
- do not add new providers
- do not add new channels
- do not add queue, worker, webhook, or orchestration systems
- do not add TS path aliases to bypass package boundaries
- do not centralize package-specific implementation config at the root unless it clearly pays for itself
- do not let the Vite+ scaffold dictate package architecture
- do not stop validation at workspace-local success
- do not drop or accidentally rename `@iterava/colis-email/providers/resend`
- do not publish `colis-email` as a separate repo after the monorepo is ready

## Practical Next Step

1. Baseline both current repos.
2. Generate one throwaway Vite+ monorepo scout.
3. Create the feature branch in `iterava/colis`.
4. Move core into `packages/colis`.
5. Create the workspace root.
6. Import `colis-email` into `packages/colis-email`.
7. Replace local linking with `workspace:^`.
8. Validate tarballs before any merge.
