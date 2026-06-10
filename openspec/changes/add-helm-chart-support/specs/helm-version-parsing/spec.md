## ADDED Requirements

### Requirement: Helm version extraction

The system SHALL parse `Chart.yaml` files using the `js-yaml` library and extract the value of the top-level `version` field as the current semantic version.

#### Scenario: Standard Chart.yaml with unquoted version

- **WHEN** `Chart.yaml` contains `version: 1.2.3` (unquoted)
- **THEN** the system extracts `1.2.3` as the current version

#### Scenario: Chart.yaml with quoted version

- **WHEN** `Chart.yaml` contains `version: "1.2.3"` (double-quoted)
- **THEN** the system extracts `1.2.3` as the current version

#### Scenario: Chart.yaml with comments and other fields

- **WHEN** `Chart.yaml` contains `appVersion`, `description`, comments, and other fields alongside `version: 2.0.0`
- **THEN** the system extracts only the `version` field value `2.0.0`

### Requirement: Missing version field error

The system MUST produce a clear error message when the `Chart.yaml` file does not contain a `version` field.

#### Scenario: Chart.yaml without version field

- **WHEN** `Chart.yaml` is valid YAML but has no `version` field
- **THEN** the system throws an error indicating that no version was found in the Chart.yaml file

### Requirement: Helm version read from default branch

The system SHALL read the `Chart.yaml` content from the default branch (via `git show origin/<defaultBranch>:<filepath>`) to determine the current version, consistent with all other build types.

#### Scenario: Version read from remote default branch

- **WHEN** the action runs on a PR branch and `Chart.yaml` on `origin/main` contains `version: 1.0.0`
- **THEN** the system reads `1.0.0` as the current version from the default branch, not the PR branch

### Requirement: BUILD_TYPE enum extension

The system MUST include `HELM = 'helm'` as a member of the `BUILD_TYPE` enum.

#### Scenario: Helm type recognized

- **WHEN** `build-type` input is `helm`
- **THEN** the system maps it to `BUILD_TYPE.HELM` and processes accordingly

### Requirement: Files bag extension

The system MUST accept a `chart` property in the files configuration bag, defaulting to `Chart.yaml`.

#### Scenario: Default chart file path

- **WHEN** no `chart-file` input is provided
- **THEN** the system uses `Chart.yaml` as the default path

#### Scenario: Custom chart file path

- **WHEN** `chart-file` input is `charts/my-app/Chart.yaml`
- **THEN** the system uses `charts/my-app/Chart.yaml` as the file path
