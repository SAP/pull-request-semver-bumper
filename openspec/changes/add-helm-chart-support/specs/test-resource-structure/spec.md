## ADDED Requirements

### Requirement: Per-ecosystem test fixture directories

Test resource fixtures MUST be organized into per-ecosystem subdirectories under `test-resources/`.

#### Scenario: Maven fixture in subfolder

- **WHEN** E2E tests run for Maven
- **THEN** the fixture is at `test-resources/maven/pom.xml`

#### Scenario: NPM fixture in subfolder

- **WHEN** E2E tests run for NPM
- **THEN** the fixture is at `test-resources/npm/package.json`

#### Scenario: Python fixture in subfolder

- **WHEN** E2E tests run for Python
- **THEN** the fixture is at `test-resources/python/pyproject.toml`

#### Scenario: Version-file fixture in subfolder

- **WHEN** E2E tests run for version-file
- **THEN** the fixture is at `test-resources/version-file/VERSION`

#### Scenario: Helm fixture in subfolder

- **WHEN** E2E tests run for Helm
- **THEN** the fixture is at `test-resources/helm/Chart.yaml` containing `version: 1.0.0`

### Requirement: Helm E2E test job

The CI workflow MUST include a `test-helm` job that validates the Helm build type using a dry-run invocation.

#### Scenario: Helm E2E dry-run succeeds

- **WHEN** the `test-helm` job runs with `type: helm`, `dry-run: true`, and `chart-yaml-file: test-resources/helm/Chart.yaml`
- **THEN** the job produces non-empty `bumped`, `new-version`, and `bumpLevel` outputs

#### Scenario: Helm job included in all-tests-passed gate

- **WHEN** all E2E test jobs complete
- **THEN** `test-helm` is included in the `needs:` list of the `all-tests-passed` job

### Requirement: CI workflow path updates

All existing E2E test jobs MUST reference fixtures using the new subfolder paths.

#### Scenario: Existing Maven E2E uses new path

- **WHEN** the `test-maven` job runs
- **THEN** it references `test-resources/maven/pom.xml` (not `test-resources/pom.xml`)
