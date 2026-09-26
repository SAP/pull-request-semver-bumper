## ADDED Requirements

### Requirement: Config file detection

The action SHALL detect monorepo mode by checking for a `bumper.monorepo.json` file in the repository root after `configureGit()` completes.

#### Scenario: Config file present

- **WHEN** `bumper.monorepo.json` exists at the repository root and `type` is `"auto"`
- **THEN** the action SHALL enter monorepo mode

#### Scenario: Config file absent

- **WHEN** `bumper.monorepo.json` does not exist at the repository root and `type` is `"auto"`
- **THEN** the action SHALL fall through to single-package type auto-detection

#### Scenario: Explicit type bypasses detection

- **WHEN** `type` is set to an explicit value (`npm`, `maven`, `python`, `version-file`)
- **THEN** the action SHALL use single-package mode regardless of config file presence

---

### Requirement: Config schema validation

The action SHALL validate the parsed `bumper.monorepo.json` against the expected schema and fail with a clear error if validation fails.

#### Scenario: Valid config

- **WHEN** the config file contains a `packages` array with at least one entry, each having a `path` string
- **THEN** the action SHALL accept the config and proceed

#### Scenario: Empty packages array

- **WHEN** the config file contains an empty `packages` array
- **THEN** the action SHALL fail with error: "bumper.monorepo.json: packages array must not be empty"

#### Scenario: Missing path field

- **WHEN** a package entry lacks a `path` field
- **THEN** the action SHALL fail with error identifying the invalid entry

#### Scenario: Duplicate paths

- **WHEN** two package entries declare the same `path` (after glob expansion)
- **THEN** the action SHALL fail with error identifying the duplicate

#### Scenario: Invalid type value

- **WHEN** a package entry specifies a `type` not in (`npm`, `maven`, `python`, `version-file`)
- **THEN** the action SHALL fail with error identifying the invalid type

#### Scenario: Absolute or parent-traversal path

- **WHEN** a package entry `path` starts with `/` or contains `..`
- **THEN** the action SHALL fail with error: "package paths must be relative without parent traversal"

---

### Requirement: Glob expansion

The action SHALL expand glob patterns in package paths one level deep to discover subdirectories that contain a detectable version file marker.

#### Scenario: Wildcard path expansion

- **WHEN** a package entry has `"path": "packages/*"`
- **THEN** the action SHALL expand it to all immediate subdirectories of `packages/` that contain at least one of: `package.json`, `pom.xml`, `pyproject.toml`, `VERSION`

#### Scenario: No matching subdirectories

- **WHEN** a glob pattern expands to zero qualifying subdirectories
- **THEN** the action SHALL log a warning but not fail (other packages may still be valid)

#### Scenario: Override inheritance

- **WHEN** a glob entry includes overrides (e.g., `"bump-command": "..."`)
- **THEN** expanded packages SHALL inherit those overrides

#### Scenario: Recursive glob rejected

- **WHEN** a package entry path contains `**`
- **THEN** the action SHALL fail with error: "recursive globs (**) are not supported, use single-level (*) only"

---

### Requirement: Per-package override fields

Each package entry SHALL support optional override fields that mirror the action's single-package inputs.

#### Scenario: Override fields applied

- **WHEN** a package entry includes `pom-file`, `version-property-path`, `package-json-file`, `version-file`, `pyproject-file`, `bump-command`, or `post-command`
- **THEN** the action SHALL use those values instead of defaults for that package

#### Scenario: Override fields absent

- **WHEN** a package entry omits override fields
- **THEN** the action SHALL use the default file paths and commands for the detected type
