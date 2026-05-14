## Design Summary

Add monorepo support to `pull-request-semver-bumper` enabling independent per-package semver bumping within a single repository. The action auto-detects monorepo mode when a `bumper.monorepo.json` config file exists in the target repo root, determines which packages were touched by the PR's changed files, and bumps each one using the same bump level derived from the PR title. The design prioritizes zero impact on existing single-package users by branching early into an isolated code path.

## Alternatives Considered

### Option A: Early Branch — Separate Monorepo Module

- **Approach**: Detect `bumper.monorepo.json` at runtime in `index.ts` after git setup. If present, branch into a completely separate orchestration path (`src/monorepo/orchestrate.ts`) handling config loading, file detection, per-package bumping, and combined commit. Existing single-package path remains untouched.
- **Pros**: Zero risk to existing users; clean separation of concerns; each module independently testable; easy mental model ("if config exists → monorepo path")
- **Cons**: Some shared logic (git setup, PR title parsing) runs before the branch point; two code paths to maintain long-term
- **Why chosen**: See Agreed Approach below

### Option B: Unified Pipeline with Package Loop

- **Approach**: Refactor `index.ts` to always operate on a `Package[]`. Single-package mode produces a one-element list from inputs; monorepo mode produces N entries from config. Same loop handles both.
- **Pros**: DRY, single code path; forces cleaner abstractions
- **Cons**: Touches existing working code (regression risk); complex "N=1 special case"; harder to test parameterized paths; commit message logic gets complicated
- **Why not chosen**: Higher risk to existing users, over-engineers the single-package case

### Option C: Separate Composite Action

- **Approach**: Create a new top-level `action-monorepo.yml` with an entirely separate Node action entry point.
- **Pros**: Complete isolation from existing action
- **Cons**: Massive code duplication; two npm projects to maintain; users must change workflow files; violates "auto-activated, no input changes" requirement
- **Why not chosen**: Breaks the auto-detection requirement and creates maintenance burden

## Agreed Approach

**Option A: Early Branch with isolated `src/monorepo/` modules.**

This was chosen because:
- It preserves backward compatibility by construction — the existing code path is never entered in monorepo mode
- New code is isolated and testable without affecting existing tests
- Shared utilities (git, semver, parse-commit) are reused without refactoring them
- It matches the principle of minimal change to existing working code
- The `type` input becomes optional (default `"auto"`) which is future-proof for single-package auto-detection later

## Key Decisions

- **`type` input becomes optional with default `"auto"`**: Enables monorepo auto-detection without new inputs. Future-proof for single-package type auto-detection. Existing users passing explicit types are unaffected.
- **Detection trigger**: `type: "auto"` + `bumper.monorepo.json` exists in target repo → monorepo mode. No config + `"auto"` → error (today), auto-detect single-package type (future).
- **Config lives in target repo**: Each monorepo defines its own structure; the config is read at runtime from the checked-out repo root, after `configureGit()` completes (guarantees PR branch is checked out).
- **Config read timing**: Detection happens after `configureGit()` since repo files aren't guaranteed before that (fallback clone case). Order: read inputs → configureGit → detect mode → branch into monorepo or single-package path. Skip bump-command validation when `type === "auto"`.
- **Changed-file detection via git diff**: `git diff --name-only origin/<base>...HEAD` — zero new dependencies, leverages existing `simple-git` and `fetch --all` setup.
- **Config file change triggers full bump**: If `bumper.monorepo.json` itself is among changed files, all declared packages are bumped. Ensures new packages get their initial version.
- **Single bump level for all packages**: Derived from PR title (Conventional Commits). No per-package scope differentiation. Deliberate simplification.
- **Per-package type auto-detection**: Filesystem markers (`package.json` → npm, `pom.xml` → maven, `pyproject.toml` → python, `VERSION` → version-file).
- **Per-package overrides mirror action inputs**: `pom-file`, `version-property-path`, `package-json-file`, `version-file`, `pyproject-file`, `bump-command`, `post-command` — all optional per entry.
- **Single atomic commit**: All package bumps staged together. Format: `chore: bump version packages/foo@1.2.0 packages/bar@2.1.0`. No partial commits on failure.
- **`new-version` output differs by mode**: Single-package → plain string `"1.2.0"`. Monorepo → JSON map `{"packages/foo":"1.2.0","packages/bar":"2.1.0"}`. Consumers adopting monorepo mode adapt their parsing.
- **All-or-nothing error handling**: If any package bump fails, the entire action fails with a clear error identifying the failing package.
- **Package path matching**: A changed file triggers a bump for every declared package whose `path` is a prefix of the file path. Overlapping paths are allowed — file can trigger multiple packages.
- **Glob support in paths**: `"path": "packages/*"` expands to immediate subdirectories (one level only) that contain a detectable version file marker. Expanded packages inherit the parent entry's overrides. Exact paths and glob paths coexist in the same config.

## Open Questions

None — design is fully resolved through brainstorming session.
