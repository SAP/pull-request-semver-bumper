## ADDED Requirements

### Requirement: Unified monorepo-style fixture layout

The `test-resources/` directory SHALL be structured as a monorepo with per-type packages, serving both monorepo and single-package E2E tests from a single fixture set.

#### Scenario: Fixture structure

- **WHEN** the test resources are checked out
- **THEN** the directory SHALL contain a `bumper.monorepo.json` config and subdirectories for each package type (npm, maven, python, version-file)

#### Scenario: Config file points to fixture packages

- **WHEN** the monorepo E2E test reads `test-resources/bumper.monorepo.json`
- **THEN** the config SHALL declare paths to the fixture packages within `test-resources/`

---

### Requirement: Single-package E2E tests use fixture paths

Single-package E2E tests SHALL reference individual package directories within the unified fixture layout via path inputs.

#### Scenario: npm single-package test

- **WHEN** the npm E2E test runs
- **THEN** it SHALL point `package-json-file` to the npm package's `package.json` within the fixture layout

#### Scenario: maven single-package test

- **WHEN** the maven E2E test runs
- **THEN** it SHALL point `pom-file` to the maven package's `pom.xml` within the fixture layout

#### Scenario: python single-package test

- **WHEN** the python E2E test runs
- **THEN** it SHALL point `pyproject-file` to the python package's `pyproject.toml` within the fixture layout

#### Scenario: version-file single-package test

- **WHEN** the version-file E2E test runs
- **THEN** it SHALL point `version-file` to the version-file package's `VERSION` within the fixture layout

---

### Requirement: Monorepo E2E tests

Monorepo E2E tests SHALL validate multi-package bumping using the unified fixture layout.

#### Scenario: Monorepo dry-run test

- **WHEN** the monorepo E2E test runs with `type: auto` and `dry-run: true`
- **THEN** the action SHALL detect `bumper.monorepo.json`, identify touched packages, compute versions, and set outputs without pushing

#### Scenario: Heterogeneous package types

- **WHEN** the monorepo fixture includes packages of different types (npm, maven, python, version-file)
- **THEN** the E2E test SHALL verify each package type is bumped correctly using its respective mechanism
