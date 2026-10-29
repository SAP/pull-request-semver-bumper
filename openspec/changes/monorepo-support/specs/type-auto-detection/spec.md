## ADDED Requirements

### Requirement: Filesystem marker detection

The `detect-type` module SHALL determine a package type by checking for the presence of well-known files in the target directory, using a fixed priority order.

#### Scenario: npm detected

- **WHEN** `package.json` exists in the target directory
- **THEN** the module SHALL return type `npm`

#### Scenario: maven detected

- **WHEN** `pom.xml` exists in the target directory and `package.json` does not
- **THEN** the module SHALL return type `maven`

#### Scenario: python detected

- **WHEN** `pyproject.toml` exists in the target directory and neither `package.json` nor `pom.xml` exist
- **THEN** the module SHALL return type `python`

#### Scenario: version-file detected

- **WHEN** a `VERSION` file exists in the target directory and no other markers are present
- **THEN** the module SHALL return type `version-file`

#### Scenario: No markers found

- **WHEN** none of the recognized markers exist in the target directory
- **THEN** the module SHALL return `null` (detection failed)

#### Scenario: Detection priority

- **WHEN** multiple markers exist in the same directory (e.g., both `package.json` and `pom.xml`)
- **THEN** the module SHALL use priority order: `package.json` > `pom.xml` > `pyproject.toml` > `VERSION`

---

### Requirement: Single-package auto-detection at repo root

When `type` is `"auto"` and no `bumper.monorepo.json` exists, the action SHALL auto-detect the package type from the repository root.

#### Scenario: Type detected at root

- **WHEN** `type` is `"auto"`, no monorepo config exists, and `package.json` exists at repo root
- **THEN** the action SHALL proceed in single-package mode with type `npm`

#### Scenario: No type detected at root

- **WHEN** `type` is `"auto"`, no monorepo config exists, and no markers are found at repo root
- **THEN** the action SHALL fail with error: "Could not detect package type. Specify `type` explicitly or add a version file (package.json, pom.xml, pyproject.toml, or VERSION) to the repo root."

---

### Requirement: Per-package type detection in monorepo mode

In monorepo mode, when a package entry does not specify `type`, the action SHALL auto-detect the type from the package directory.

#### Scenario: Type auto-detected for package

- **WHEN** a package entry omits `type` and `pom.xml` exists in its directory
- **THEN** the action SHALL assign type `maven` to that package

#### Scenario: Type detection fails for package

- **WHEN** a package entry omits `type` and no markers exist in its directory
- **THEN** the action SHALL fail with error identifying the package path and listing expected markers

#### Scenario: Explicit type overrides detection

- **WHEN** a package entry specifies `"type": "maven"`
- **THEN** the action SHALL use `maven` regardless of what files exist in the directory
