# Monorepo Migration — Phase 0 and Phase 1 Findings

## Purpose

This document records the actual findings from:

- Phase 0 — pre-migration audit
- Phase 1 — Vite+ scout

It supplements `docs/monorepo-migration-plan.md` with concrete observations from the current repos and the throwaway Vite+ monorepo scaffold.

---

## Phase 0 — Pre-migration Audit

### Repos audited

- Core repo:
  - `/Users/dewgie/omfg/iterava/colis/repos/colis`
- Email repo:
  - `/Users/dewgie/omfg/iterava/colis/repos/colis-email`

### Baseline command results

#### Core repo (`colis`)

- `CI=1 vp check` → PASS
- `vp test` → PASS
- `vp pack` → PASS

Current state during audit:

- branch: `preview`
- HEAD: `2f5a370`
- status: clean relative to branch except for the new migration-plan doc under `docs/`
- lockfile present: `pnpm-lock.yaml`

#### Email repo (`colis-email`)

- `CI=1 vp check` → PASS
- `vp test` → PASS
- `vp pack` → PASS

Current state during audit:

- branch: `preview`
- HEAD: `4487ec1`
- status: clean
- lockfile present: `pnpm-lock.yaml`

### Package metadata findings

#### `@iterava/colis`

Current important metadata:

- package name: `@iterava/colis`
- package manager: `pnpm@10.32.1`
- root export:
  - `.`
- publish access already set to public
- package contains local `pnpm.overrides`

#### `@iterava/colis-email`

Current important metadata:

- package name: `@iterava/colis-email`
- package manager: `pnpm@10.33.0`
- root export:
  - `.`
- public subpath export already exists:
  - `./providers/resend`
- dependency on core currently uses:
  - `"@iterava/colis": "link:../colis"`
- publish access already set to public
- package contains local `pnpm.overrides`
- metadata still points at a standalone repo:
  - homepage: `https://github.com/iterava/colis-email#readme`
  - bugs: `https://github.com/iterava/colis-email/issues`
  - repository URL: `git+https://github.com/iterava/colis-email.git`

### Phase 0 conclusions

1. **Both repos are currently healthy enough to migrate.**
   There is no failing baseline that needs repair before the monorepo move.

2. **The root package-manager version must be normalized during migration.**
   The repos currently disagree:
   - core: `pnpm@10.32.1`
   - email: `pnpm@10.33.0`

3. **The `./providers/resend` public subpath must be preserved explicitly.**
   It is already part of the real public surface of `@iterava/colis-email`.

4. **Per-package lockfiles must collapse into one root lockfile.**
   The migration should leave one workspace-level `pnpm-lock.yaml`, not nested lockfiles.

5. **`colis-email` metadata rewrite is required.**
   The package still carries standalone repo URLs and must be rewritten to the monorepo with `repository.directory`.

---

## Phase 1 — Vite+ Scout

### Scout command used

From `/Users/dewgie/omfg`:

```bash
vp create vite:monorepo --directory .tmp/colis-vp-scout --no-hooks --no-interactive
```

Scout location:

- `/Users/dewgie/omfg/.tmp/colis-vp-scout`

This was run outside the live repo and used only as a reference scaffold.

### What the generated scaffold contained

Top-level generated structure included:

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `vite.config.ts`
- `README.md`
- `AGENTS.md`
- `apps/website`
- `packages/utils`
- `node_modules/`
- `.git/`

Notably, it did **not** generate a `.github/workflows` structure in the scaffold we inspected.

### Root scaffold findings

#### Root `package.json`

The generated root package was:

- `private: true`
- `type: module`
- `packageManager: pnpm@10.33.0`
- `engines.node: >=22.12.0`
- root scripts:
  - `ready`
  - `dev`

Observations:

- `private: true` is aligned with our plan.
- a single root `packageManager` pin is aligned with our plan.
- the generated scripts are starter-oriented and not directly reusable for Colis.
- the generated script style uses `vp run test -r` / `vp run build -r`, which should **not** be copied blindly into our plan or scripts without verifying the desired invocation style in our actual environment.

#### Root `pnpm-workspace.yaml`

The generated workspace config used:

```yaml
packages:
  - apps/*
  - packages/*
  - tools/*
```

It also introduced:

- `catalogMode: prefer`
- a root `catalog:` block for shared dependency versions
- root `overrides:` for `vite` and `vitest`
- `peerDependencyRules`

Observations:

- the generated workspace globs are **broader than we need** for the Colis migration
- `packages/*` is relevant
- `apps/*` and `tools/*` are not migration requirements for Colis
- the scaffold confirms that Vite+ is comfortable with a root-level workspace and centralized package-manager coordination
- root-level dependency coordination may be worth borrowing later, but it is not required to complete the structural move

#### Root `vite.config.ts`

The generated root Vite+ config was minimal:

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
});
```

Observation:

- this supports our plan’s stance that any root `vite.config.ts` should be **minimal and orchestration-oriented**, not a place to normalize package-specific build behavior

#### Root `tsconfig.json`

The generated root TypeScript config was also minimal and generic.

Observation:

- this again supports keeping any root TS config small
- it does **not** justify centralizing or flattening current package-specific TS behavior during migration

### Generated example packages/apps

The scaffold generated:

- `apps/website`
- `packages/utils`

Observations:

- these are starter/demo content only
- they should **not** influence Colis package architecture
- they confirm that Vite+ monorepo scaffolding is opinionated toward a more general app/package starter than what we need for the Colis migration

### Phase 1 conclusions

1. **The scout was useful as a reference, but not as a migration engine.**
   This validates the current plan.

2. **The main things worth borrowing are root-level conventions, not structure wholesale.**
   Useful ideas:
   - root `private: true`
   - one root `packageManager`
   - one root lockfile
   - root `pnpm-workspace.yaml`
   - optional minimal root `vite.config.ts`

3. **We should not copy the generated structure wholesale.**
   Ignore:
   - `apps/website`
   - `packages/utils`
   - broader `apps/*` / `tools/*` workspace shape
   - starter README/package metadata

4. **We do not need Vite+ to perform the migration for us.**
   The scout confirmed the root file concepts we needed to see.

5. **The live migration should remain manual.**
   Nothing in the scout changed that conclusion.

---

## Adopt vs Ignore Summary

### Adopt or consider adopting

- root `private: true`
- one root `packageManager`
- one root `pnpm-lock.yaml`
- root `pnpm-workspace.yaml`
- optional minimal root `vite.config.ts`
- root-level dependency coordination only if it clearly simplifies the workspace later

### Ignore for the migration

- `apps/website`
- `packages/utils`
- default starter README wording
- generic placeholder package metadata
- broad `apps/*` / `tools/*` workspace assumptions
- any temptation to reshape Colis around the scaffold

---

## Recommended update to the live plan

The existing migration plan remains directionally correct.

The actual findings from Phase 0 and Phase 1 reinforce these points:

1. keep the migration **manual**
2. keep root config **minimal**
3. normalize to **one root package-manager version**
4. collapse to **one root lockfile**
5. preserve `@iterava/colis-email/providers/resend`
6. rewrite `colis-email` metadata to the monorepo
7. do not let the scout scaffold push us toward extra apps/tools or structural overbuild

---

## Practical next move

After Phase 0 and Phase 1, the next execution step is:

- create the migration branch in `iterava/colis`
- move core into `packages/colis`
- establish the workspace root
- then import `colis-email` into `packages/colis-email`

That remains the right sequence.
