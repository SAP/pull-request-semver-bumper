## ADDED Requirements

### Requirement: Default Helm bump command

The system SHALL use `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` as the default bump command for the Helm build type.

#### Scenario: Default command applied

- **WHEN** no custom `bump-command` is provided for `type: helm`
- **THEN** the system uses `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` with `@NEW_VERSION@` substituted with the computed version

#### Scenario: Custom bump command override

- **WHEN** a user provides `bump-command: 'sed -i "s/^version:.*/version: @NEW_VERSION@/" Chart.yaml'`
- **THEN** the system uses the user-provided command instead of the default

### Requirement: Helm executable validation

The system MUST validate that the bump command executable is in the allowed list for Helm: `yq`, `sed`, `why `.

#### Scenario: Allowed executable passes validation

- **WHEN** the bump command starts with `yq`
- **THEN** validation passes without error

#### Scenario: Disallowed executable fails validation

- **WHEN** the bump command starts with `curl`
- **THEN** the system throws a validation error indicating the executable is not allowed for the Helm build type

#### Scenario: Shell executables allowed with warning

- **WHEN** the bump command starts with `sh` or `bash`
- **THEN** validation passes but a warning is logged (consistent with existing behavior for all types)

### Requirement: NEW_VERSION placeholder required

The system MUST validate that the bump command contains the `@NEW_VERSION@` placeholder.

#### Scenario: Missing placeholder

- **WHEN** the bump command for Helm does not contain `@NEW_VERSION@`
- **THEN** the system throws a validation error

### Requirement: Helm version update file selection

The system SHALL select the `files.chart` path when determining the working directory and filename for executing the bump command.

#### Scenario: Command executes in chart directory

- **WHEN** `chart-file` is `charts/my-app/Chart.yaml`
- **THEN** the bump command executes with working directory `charts/my-app/` and the filename `Chart.yaml` is available for the command
