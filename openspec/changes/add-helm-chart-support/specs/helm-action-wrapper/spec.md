## ADDED Requirements

### Requirement: Helm composite action wrapper

The system MUST provide a composite action at `.github/actions/version-bumping/helm/action.yml` that orchestrates the Helm version bump workflow.

#### Scenario: Wrapper installs yq

- **WHEN** the Helm composite action runs
- **THEN** it installs `yq` using the `mikefarah/yq` GitHub Action before invoking the core action

#### Scenario: Wrapper validates PR title

- **WHEN** the Helm composite action runs
- **THEN** it validates the PR title using `amannn/action-semantic-pull-request` (same as all other types)

#### Scenario: Wrapper delegates to core action

- **WHEN** the Helm composite action runs
- **THEN** it invokes `.github/actions/core` with `build-type: helm` and passes through common inputs (token, dry-run, default-branch, bump-command, post-command) plus the Helm-specific `chart-file` input

### Requirement: Helm wrapper inputs

The composite action MUST accept all common inputs plus a `chart-yaml-file` input defaulting to `Chart.yaml`.

#### Scenario: Default inputs

- **WHEN** the wrapper is invoked without `chart-yaml-file`
- **THEN** `Chart.yaml` is used as the default value passed to the core action's `chart-file` input

### Requirement: Helm wrapper outputs

The composite action MUST expose the same outputs as other type wrappers: `bumped`, `new-version`, `bumpLevel`.

#### Scenario: Outputs passed through

- **WHEN** the core action produces `bumped=true`, `new-version=1.1.0`, `bumpLevel=minor`
- **THEN** the wrapper exposes these same values as its outputs
