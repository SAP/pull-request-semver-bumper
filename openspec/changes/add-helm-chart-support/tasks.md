## 1. Core Type Registration

- [x] 1.1 Add `HELM = 'helm'` to the `BUILD_TYPE` enum in `src/types/build-type.ts`
- [x] 1.2 Add `js-yaml` and `@types/js-yaml` dependencies to `.github/actions/core/package.json`
- [x] 1.3 Add `chart-file` input to `.github/actions/core/action.yml` with default `Chart.yaml`
- [x] 1.4 Extend the `files` bag in `src/index.ts` to include a `chart` property read from the new input

## 2. Version Fetching

- [x] 2.1 Add `case BUILD_TYPE.HELM` to `fetchCurrentVersion()` in `src/version/fetch-version.ts` — parse Chart.yaml with `js-yaml` and extract `.version`
- [x] 2.2 Add error handling for missing `version` field in Chart.yaml
- [x] 2.3 Add unit tests for Helm version fetching (standard, quoted, missing version)

## 3. Bump Command Validation

- [x] 3.1 Add `case BUILD_TYPE.HELM` to `validateBumpCommand()` in `src/version/validate-bump-command.ts` with allowed executables: `yq`, `sed`, `helm`, `echo`
- [x] 3.2 Add unit tests for Helm executable validation (allowed, disallowed, shell with warning)

## 4. Version Update

- [x] 4.1 Add `case BUILD_TYPE.HELM` to `updateLocalVersion()` in `src/version/update-version.ts` — select `files.chart` for path resolution
- [x] 4.2 Add unit tests for Helm version update (correct directory, command construction)

## 5. Composite Action Wrapper

- [x] 5.1 Create `.github/actions/version-bumping/helm/action.yml` with PR validation, yq installation, and core delegation
- [x] 5.2 Define inputs (token, chart-yaml-file, dry-run, default-branch, bump-command, post-command) and outputs (bumped, new-version, bumpLevel)

## 6. Gateway Routing

- [x] 6.1 Add `chart-yaml-file` input to root `action.yml` with default `Chart.yaml`
- [x] 6.2 Add `if: inputs.type == 'helm'` step routing to the Helm wrapper
- [x] 6.3 Update output chaining to include `steps.bump_helm.outputs.*`

## 7. Test Resources Restructure

- [x] 7.1 Create per-ecosystem subdirectories: `test-resources/maven/`, `test-resources/npm/`, `test-resources/python/`, `test-resources/version-file/`, `test-resources/helm/`
- [x] 7.2 Move existing fixtures into their subdirectories
- [x] 7.3 Create `test-resources/helm/Chart.yaml` with `version: 1.0.0`
- [x] 7.4 Update all fixture paths in `build-and-test.yml` E2E jobs

## 8. E2E Test

- [x] 8.1 Add `test-helm` job to `build-and-test.yml` following the existing pattern (checkout, sed patch, dry-run invoke, verify outputs)
- [x] 8.2 Add `test-helm` to the `needs:` list of `all-tests-passed` job

## 9. Build & Bundle

- [x] 9.1 Run `npm install` to install `js-yaml` dependency
- [x] 9.2 Run `npm run build` to generate updated `dist/index.js` via ncc
- [x] 9.3 Run `npm test` to verify all unit tests pass
