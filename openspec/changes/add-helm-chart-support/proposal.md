## Why

Helm charts use semantic versioning in `Chart.yaml` for the chart's own version. Currently, users managing Helm charts must fall back to the generic `version-file` type or manually handle version bumps outside the action. A dedicated Helm build type provides proper YAML-aware version reading/writing and ecosystem-appropriate tooling (`yq`), matching the first-class support already provided for Maven, NPM, and Python ecosystems.

## What Changes

**Build Type Registry**
- From: 4 supported types (maven, npm, python, version-file)
- To: 5 supported types (maven, npm, python, version-file, helm)
- Reason: Helm charts need YAML-aware version handling
- Impact: Non-breaking addition; no existing behavior changes

**Version Fetching**
- From: No support for Chart.yaml parsing
- To: `js-yaml` parses Chart.yaml and extracts `.version` field
- Reason: Proper YAML parsing handles comments, quoting, and complex structures
- Impact: New `js-yaml` dependency bundled by ncc

**Bump Command Validation**
- From: No Helm-specific executable whitelist
- To: Allows `yq`, `sed`, `helm`, `echo` for Helm type
- Reason: Matches tools Helm/K8s users expect in their workflows
- Impact: Non-breaking; only applies to new type

**Action Infrastructure**
- From: 4 composite wrappers + 4 gateway routes
- To: 5 composite wrappers + 5 gateway routes (new `helm` entry)
- Reason: Standard pattern for new ecosystem support
- Impact: Non-breaking; adds new routing path

**Test Resources**
- From: Flat `test-resources/` with all fixtures at root level
- To: Per-ecosystem subfolders (`test-resources/maven/`, `test-resources/npm/`, etc.)
- Reason: Cleaner organization, avoids naming conflicts, clearer ownership
- Impact: CI workflow paths updated accordingly

## Capabilities

### New Capabilities

- `helm-version-parsing`: Reading and validating the `version` field from Helm `Chart.yaml` files using `js-yaml`
- `helm-bump-command`: Default bump command configuration and executable validation for the Helm ecosystem
- `helm-action-wrapper`: Composite GitHub Action wrapper that installs `yq` and delegates to the core action
- `helm-gateway-routing`: Gateway routing in root `action.yml` for `type: helm` input

### Modified Capabilities

- `test-resource-structure`: Restructure existing test fixtures into per-ecosystem subfolders (affects all existing E2E test paths)

## Impact

- **Code**: New switch cases in `fetch-version.ts`, `validate-bump-command.ts`, `update-version.ts`; new enum member in `build-type.ts`; updated `files` bag in `index.ts`
- **Dependencies**: `js-yaml` + `@types/js-yaml` added to `.github/actions/core/package.json`
- **Actions**: New `.github/actions/version-bumping/helm/action.yml` composite wrapper
- **CI**: Updated fixture paths in all E2E jobs; new `test-helm` job in `build-and-test.yml`
- **Bundle**: `dist/index.js` grows slightly due to bundled `js-yaml`
- **Users**: New `type: helm` option available; existing types unaffected
