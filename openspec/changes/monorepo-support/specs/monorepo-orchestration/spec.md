## ADDED Requirements

### Requirement: Per-package version fetching

The action SHALL fetch the current version for each touched package independently from the base branch.

#### Scenario: Fetch version for npm package

- **WHEN** a touched package has type `npm`
- **THEN** the action SHALL read the version from `git show origin/<base>:<package-path>/<package-json-file>` and parse the `version` field

#### Scenario: Fetch version for maven package

- **WHEN** a touched package has type `maven`
- **THEN** the action SHALL read the version from `git show origin/<base>:<package-path>/<pom-file>` using the configured `version-property-path`

#### Scenario: Fetch version for python package

- **WHEN** a touched package has type `python`
- **THEN** the action SHALL read the version from `git show origin/<base>:<package-path>/<pyproject-file>` and parse the `version` field

#### Scenario: Fetch version for version-file package

- **WHEN** a touched package has type `version-file`
- **THEN** the action SHALL read the version from `git show origin/<base>:<package-path>/<version-file>` as a plain string

---

### Requirement: Uniform bump level application

The action SHALL apply the same bump level (derived from PR title) to all touched packages. Each package maintains its own independent version.

#### Scenario: Minor bump across packages with different versions

- **WHEN** bump level is `minor`, package A is at `1.2.0`, and package B is at `3.0.1`
- **THEN** the action SHALL bump A to `1.3.0` and B to `3.1.0`

#### Scenario: Major bump

- **WHEN** bump level is `major` and package is at `1.2.3`
- **THEN** the action SHALL bump to `2.0.0`

---

### Requirement: Per-package bump command execution

The action SHALL execute the appropriate bump command for each touched package in its package directory.

#### Scenario: Default bump command for npm

- **WHEN** package type is `npm` and no custom `bump-command` is specified
- **THEN** the action SHALL execute the default npm version command in the package directory with `@NEW_VERSION@` replaced

#### Scenario: Custom bump command

- **WHEN** a package entry specifies a `bump-command`
- **THEN** the action SHALL execute that command in the package directory with `@NEW_VERSION@` replaced by the computed version

#### Scenario: Post command execution

- **WHEN** a package entry specifies a `post-command`
- **THEN** the action SHALL execute the post command in the package directory after the bump command succeeds

---

### Requirement: Single atomic commit

The action SHALL stage all version file changes across all touched packages and create a single combined commit.

#### Scenario: Multiple packages bumped

- **WHEN** packages `packages/foo` (bumped to `1.3.0`) and `packages/bar` (bumped to `2.1.0`) are touched
- **THEN** the action SHALL create one commit with message: `chore: bump version packages/foo@1.3.0 packages/bar@2.1.0`

#### Scenario: Single package bumped in monorepo

- **WHEN** only one package `packages/foo` (bumped to `1.3.0`) is touched
- **THEN** the action SHALL create one commit with message: `chore: bump version packages/foo@1.3.0`

#### Scenario: Dry-run mode

- **WHEN** `dry-run` input is `true`
- **THEN** the action SHALL compute versions and execute bump commands but SHALL NOT push the commit

---

### Requirement: All-or-nothing error handling

The action SHALL fail entirely if any package bump operation fails. No partial commits SHALL be created.

#### Scenario: Bump command fails for one package

- **WHEN** the bump command fails for package B after package A succeeded
- **THEN** the action SHALL fail with an error identifying package B and SHALL NOT commit or push any changes

#### Scenario: Version fetch fails

- **WHEN** fetching the current version fails for a package (e.g., file not found on base branch)
- **THEN** the action SHALL fail with a clear error identifying the package and file path

---

### Requirement: Monorepo outputs

The action SHALL set outputs appropriate for monorepo mode.

#### Scenario: Packages bumped successfully

- **WHEN** one or more packages are bumped
- **THEN** the action SHALL set `bumped: true`, `bumpLevel: <level>`, and `new-version` as a JSON map of `{<path>: <version>}`

#### Scenario: No packages touched

- **WHEN** no packages are in the touched set
- **THEN** the action SHALL set `bumped: false` and `new-version` as an empty JSON object `{}`
