## Why

Monorepo repositories cannot use `pull-request-semver-bumper` today because the action only supports a single version file in a single location. Teams with multiple independently-versioned packages in one repo must either maintain separate CI jobs with hardcoded paths or forgo automated version bumping entirely. Adding monorepo support and type auto-detection removes this gap, making the action usable for the growing number of SAP monorepos while simultaneously simplifying onboarding for new single-package users who no longer need to specify their build type explicitly.

## What Changes

**`type` Input Behavior**
- From: `type` is required; must be one of `npm`, `maven`, `python`, `version-file`
- To: `type` defaults to `"auto"`; auto-detects monorepo mode (via config file) or single-package type (via filesystem markers). Explicit values still work unchanged.
- Reason: Enables monorepo auto-activation and simplifies single-package onboarding
- Impact: Non-breaking — existing users pass explicit types which bypass auto-detection

**New Monorepo Orchestration Path**
- From: Single linear pipeline in `index.ts` (one package, one bump, one commit)
- To: Early branch after `configureGit()` into isolated `src/monorepo/` modules when `bumper.monorepo.json` is detected
- Reason: Zero risk to existing single-package users; clean separation of concerns
- Impact: Non-breaking — additive code path gated behind config file presence

**`new-version` Output Format**
- From: Always a plain string (`"1.2.0"`)
- To: Plain string in single-package mode; JSON map (`{"packages/foo":"1.2.0","packages/bar":"2.1.0"}`) in monorepo mode
- Reason: Monorepo mode produces multiple versions; a map is the natural representation
- Impact: Non-breaking — only monorepo mode (new feature) produces the map format

## Capabilities

### New Capabilities

- `monorepo-config-loading`: Parse and validate `bumper.monorepo.json` from target repo root, expand glob patterns (`packages/*`) one level deep, auto-detect package types from filesystem markers
- `changed-file-detection`: Cross-reference PR changed files (via `git diff`) against declared package paths to determine which packages need bumping
- `monorepo-orchestration`: Coordinate per-package version bumping — fetch current version per package from base branch, apply uniform bump level, execute per-package bump/post commands, produce single atomic commit
- `type-auto-detection`: Shared module detecting package type from filesystem markers (`package.json` → npm, `pom.xml` → maven, `pyproject.toml` → python, `VERSION` → version-file). Serves both monorepo per-package detection and single-package auto-detection at repo root.
- `e2e-test-fixtures`: Restructure `test-resources/` as a single monorepo-style layout with per-type packages. Monorepo E2E tests use the config directly; single-package E2E tests map paths to individual package directories. One fixture set serves both modes.

### Modified Capabilities

None — existing single-package behavior is preserved unchanged. The `type` input default change is additive (new default value, existing explicit values unaffected).

## Impact

- **Source code**: New `src/monorepo/` directory (4 modules); minor addition to `index.ts` (early branch); extension to `git/git.ts` (changed-file detection, multi-package commit message)
- **action.yml**: `type` input changes from required to optional with default `"auto"`
- **Composite wrappers**: Unaffected (they pass explicit `build-type` to core action)
- **Dependencies**: None added — uses existing `simple-git` and `semver`
- **Outputs**: `new-version` format differs in monorepo mode (JSON map vs string)
- **CI**: Existing tests restructured; single-package E2E tests point to individual package paths within the unified fixture. New monorepo E2E tests added.
- **Test resources**: `test-resources/` reorganized as monorepo-style layout — single fixture set serves both monorepo and single-package E2E tests
- **Bundle size**: Modest increase in `dist/index.js` from new modules
