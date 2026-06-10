## ADDED Requirements

### Requirement: Gateway routes helm type

The root `action.yml` MUST include a conditional step that routes `inputs.type == 'helm'` to the Helm composite wrapper at `.github/actions/version-bumping/helm`.

#### Scenario: Helm type routed correctly

- **WHEN** a user invokes the action with `type: helm`
- **THEN** the root action routes to `.github/actions/version-bumping/helm` composite wrapper

#### Scenario: Other types unaffected

- **WHEN** a user invokes the action with `type: maven`
- **THEN** routing behavior remains unchanged — Maven wrapper is invoked as before

### Requirement: Gateway helm input

The root `action.yml` MUST accept a `chart-yaml-file` input with default `Chart.yaml`, and pass it to the Helm wrapper step.

#### Scenario: Input passed to helm wrapper

- **WHEN** a user provides `chart-yaml-file: charts/my-service/Chart.yaml`
- **THEN** the root action passes this value to the Helm composite wrapper's `chart-yaml-file` input

### Requirement: Gateway output chaining

The root `action.yml` outputs MUST include the Helm step's outputs in the `||` chaining pattern for `bumped`, `new-version`, and `bumpLevel`.

#### Scenario: Helm outputs included in chain

- **WHEN** the Helm step produces outputs
- **THEN** they are included in the output chain: `${{ steps.bump_maven.outputs.bumped || ... || steps.bump_helm.outputs.bumped }}`

### Requirement: Default bump command for helm in gateway

The root `action.yml` MUST set the default bump command for Helm to `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` in the `with:` block of the Helm routing step.

#### Scenario: Default command set in gateway

- **WHEN** no `bump-command` input is provided by the user
- **THEN** the gateway passes `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` as the bump-command to the Helm wrapper
