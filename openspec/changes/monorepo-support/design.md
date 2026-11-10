## Context

The `pull-request-semver-bumper` GitHub Action currently supports single-package repositories only. It reads a PR title (Conventional Commits format), determines the bump level, fetches the current version from the base branch, computes the new version via `semver.inc()`, runs a bump command, and commits the result.

The architecture is linear: `index.ts` → git setup → parse PR → fetch version → bump → commit → push. All version operations target a single file in a single location. There is no concept of multiple packages, scoped commits, or selective bumping.

**Constraints:**
- Backward compatibility is mandatory — existing single-package users must not be affected
- The action is used across SAP repositories; breaking changes require major version bump
- `dist/index.js` is committed (ncc bundle); build must remain simple
- Target repos have heterogeneous structures (npm, maven, python, version-file mixed in one repo)

**Stakeholders:** Monorepo maintainers who currently cannot use this action, plus all existing single-package users who must not experience regressions.

## Goals / Non-Goals

**Goals:**
- Enable per-package semver bumping in monorepos with a single config file
- Auto-detect monorepo mode without requiring changes to existing workflow files
- Support heterogeneous package types within one repo
- Provide glob-based package discovery for convenience
- Maintain zero impact on existing single-package behavior

**Non-Goals:**
- Per-package bump levels based on commit scopes (e.g., `feat(auth):`) — single bump level for all touched packages
- Synchronized versioning (all packages share one version number) — each package maintains its own independent version
- Recursive glob discovery (`**`) — only one level deep (`*`)
- Independent versioning strategies per package (e.g., one on pre-release, another on stable)
- Single-package type auto-detection is included in this change (not deferred) — shared `detect-type.ts` module
- Workspace dependency graph resolution (e.g., bumping dependents when a dependency bumps)

## Decisions

**Decision: Early branch architecture**
- Chosen: Detect monorepo config after `configureGit()`, branch into isolated `src/monorepo/` modules
- Reason: Zero risk to existing users by construction — the single-package code path is never entered in monorepo mode. New code is independently testable.
- Alternatives considered: Unified pipeline (regression risk, over-engineering), separate composite action (code duplication, breaks auto-detection requirement)

**Decision: `type` input defaults to `"auto"`**
- Chosen: Default value `"auto"` triggers auto-detection. Config file presence determines monorepo vs single-package. Same `detect-type.ts` module handles both cases.
- Reason: Explicit default value is clearer than empty-string semantics. Existing users with explicit types are unaffected. New users get auto-detection out of the box. Single `"auto"` value cleanly covers both monorepo detection and single-package type detection.
- Alternatives considered: No default / empty string (less explicit), required input (blocks auto-detection), separate boolean input (unnecessary given config file detection)

**Decision: Git diff for changed-file detection**
- Chosen: `git diff --name-only origin/<base>...HEAD` via existing `simple-git`
- Reason: Zero new dependencies. `configureGit()` already runs `fetch --all`, so base branch ref is available. Three-dot diff gives exactly "changes introduced by PR branch." No pagination limits.
- Alternatives considered: GitHub API `pulls/{pr}/files` (requires Octokit, pagination handling for >100 files, stale `@octokit/rest@17.x` already in deps)

**Decision: Config read after `configureGit()`**
- Chosen: Read `bumper.monorepo.json` only after git setup completes
- Reason: The action has a fallback clone path (if `.git` doesn't exist). Repo files aren't guaranteed on disk until after `configureGit()`. Reading after checkout also ensures we get the PR branch's version of the config.
- Alternatives considered: Read before git setup (breaks in fallback clone case)

**Decision: Glob expansion at config load time (one level only)**
- Chosen: `"path": "packages/*"` expands to immediate subdirectories containing a version file marker
- Reason: Convenience for large monorepos without recursive discovery surprises. `*` naturally means one level in glob semantics. `**` reserved for future use (rejected today).
- Alternatives considered: Require all paths to be explicit (tedious for 10+ packages), recursive discovery (too risky, catches test fixtures)

**Decision: All-match semantics for path overlap**
- Chosen: A changed file triggers bumps for ALL packages whose `path` is a prefix match
- Reason: Simpler than "first match wins" (no ordering dependency). Config owner controls overlap by choosing non-overlapping paths if desired.
- Alternatives considered: First match wins (config order matters — fragile), longest prefix match (complex, unnecessary)

**Decision: `new-version` output format differs by mode**
- Chosen: Plain string in single-package mode, JSON map in monorepo mode
- Reason: Monorepo mode is new — consumers opting in already make workflow changes. Clean semantic: mode determines output format.
- Alternatives considered: Always JSON (breaks existing consumers), dynamic per-package outputs (fragile naming)

## Risks / Trade-offs

- [Two code paths to maintain long-term] → Shared utilities (git, semver, parse-commit) remain DRY; only orchestration logic is duplicated. Acceptable given backward compat guarantee.
- [Glob expansion could discover unintended packages] → Mitigated by requiring a version file marker in subdirectory. Directories without `package.json`/`pom.xml`/`pyproject.toml`/`VERSION` are skipped.
- [`type: "auto"` with no config and no detectable type at repo root] → Clear error: "Could not detect package type. Specify `type` explicitly or add a version file (package.json, pom.xml, pyproject.toml, or VERSION) to the repo root."
- [Large PRs with many changed files] → Git diff has no pagination limits (unlike GitHub API's 3000 file cap). Performance is bounded by git operation time, which is already the baseline.
- [Config file change triggers bump of ALL packages] → Deliberate — ensures new packages get initial version. Documented behavior; users can split config changes into separate PRs if needed.

## Migration Plan

**Deployment steps:**
1. Make `type` input optional with default `"auto"` in root `action.yml` and all composite wrappers
2. Add `detect-type.ts` module with shared filesystem marker detection logic
3. Ship new `src/monorepo/` modules behind config file detection gate
4. Single-package auto-detection enabled when `type` is `"auto"` and no monorepo config exists
5. Existing users: no change needed — their explicit `type: npm/maven/etc.` bypasses all auto-detection
6. New monorepo users: add `bumper.monorepo.json` to repo root, leave `type` at default `"auto"`
7. New single-package users: can leave `type` at default `"auto"` if repo root has a detectable version file

**Rollback:**
- Revert to previous version tag (`@v1` → `@v1` prior release). Since monorepo mode is additive and gated behind config file detection, there is no state to clean up — removing the config file also disables monorepo mode.

## Open Questions

None — all design decisions resolved during brainstorming.
