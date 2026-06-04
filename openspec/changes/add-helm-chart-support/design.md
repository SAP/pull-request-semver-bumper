## Context

The pull-request-semver-bumper is a suite of composite GitHub Actions that bumps semantic versions in PRs based on Conventional Commit titles. It currently supports four ecosystems: Maven (`pom.xml`), NPM (`package.json`), Python (`pyproject.toml`), and generic VERSION files. Each ecosystem follows an identical architecture: a `BUILD_TYPE` enum member, switch cases in fetch/validate/update modules, a composite action wrapper, and gateway routing in the root `action.yml`.

Helm charts use `Chart.yaml` with a top-level `version` field for the chart's semantic version. Users currently work around the lack of native support by using `version-file` type or manual bumping. A dedicated Helm type provides proper YAML-aware handling and ecosystem-appropriate tooling.

**Constraints:**
- Must follow the existing architectural pattern exactly (no special-casing)
- The `dist/` folder must be committed after build (enforced by husky pre-commit hook)
- `@main` references in sub-action `action.yml` files must not be changed (CI patches them via `sed`)
- `appVersion` in `Chart.yaml` is explicitly out of scope (tracks deployed app, not chart version)

## Goals / Non-Goals

**Goals:**
- Read `version` from `Chart.yaml` using proper YAML parsing (`js-yaml`)
- Bump the version using `yq` as the default configurable shell command
- Validate bump commands against a restricted set of allowed executables
- Provide a composite action wrapper that installs `yq` automatically
- Route `type: helm` through the gateway `action.yml`
- Unit test all new code paths (fetch, validate, update)
- E2E test via dry-run in CI matching existing patterns
- Restructure `test-resources/` into per-ecosystem subfolders

**Non-Goals:**
- Bumping `appVersion` in `Chart.yaml` (different semantic — tracks app, not chart)
- Supporting Helm umbrella charts or Chart dependencies
- Auto-detecting Chart.yaml location (user provides path via input)
- Modifying any other fields in Chart.yaml beyond `version`

## Decisions

**Decision: YAML parsing library**
- Chosen: `js-yaml`
- Reason: Robust YAML parsing without regex fragility. `Chart.yaml` can have comments, multi-line values, and varied quoting — a proper parser handles all cases correctly.
- Alternatives considered: Regex (`/^version:\s*["']?(.+?)["']?$/m`) — simpler but brittle for YAML edge cases; rejected.

**Decision: Default bump command tool**
- Chosen: `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml`
- Reason: `yq` is the de facto YAML CLI tool in the Kubernetes/Helm ecosystem. It's YAML-aware, preserves file structure (comments, ordering), and is familiar to the target audience.
- Alternatives considered: `sed` — simpler setup but not YAML-aware, could corrupt files; internal Node.js modification — breaks the user-configurable command pattern.

**Decision: Allowed executables for Helm**
- Chosen: `yq`, `sed`, `helm`, `echo` (plus `sh`/`bash` with warning, per existing behavior)
- Reason: Covers the common tools a Helm user might reasonably use in a bump command. `helm` is included for potential `helm package`-style post-processing.

**Decision: Test resource directory structure**
- Chosen: Move all fixtures into per-ecosystem subfolders (`test-resources/<type>/`)
- Reason: Current flat structure is implicit about which file belongs to which type. Subfolders make ownership clear and avoid naming conflicts as more types are added.

**Decision: New dependency management**
- Chosen: Add `js-yaml` (+ `@types/js-yaml`) to `.github/actions/core/package.json`. Bundled by `ncc` into `dist/`.
- Reason: The dependency is needed at runtime for version parsing. `ncc` bundles it into a single file, so there's no runtime installation required.

## Risks / Trade-offs

- [js-yaml adds bundle size] → Minimal impact; `js-yaml` is ~70KB and `ncc` tree-shakes unused code. The `dist/` folder is already committed.
- [yq not available on all runners] → Mitigated by the composite wrapper installing `mikefarah/yq` action. Users with custom bump commands can skip `yq` entirely.
- [Test resource restructure breaks existing CI] → Low risk; the restructure is a simple path change in both fixtures and workflow `with:` inputs. All changes are in a single PR.
- [Chart.yaml version field could be quoted or unquoted] → `js-yaml` handles both `version: 1.0.0` and `version: "1.0.0"` transparently.

## Migration Plan

This is a greenfield addition — no existing users are affected. The test resource restructure is the only change to existing behavior:

Deployment steps:
1. Move fixture files to subfolders
2. Update all `test-resources/<file>` references in `build-and-test.yml` to `test-resources/<type>/<file>`
3. Add Helm support code (enum, fetch, validate, update, wrapper, routing)
4. Add `test-helm` E2E job
5. Build `dist/`, commit, push

Rollback:
- Revert the PR. No configuration migration needed since this adds a new type without modifying existing behavior.

## Open Questions

All resolved during brainstorming — no outstanding questions remain.
