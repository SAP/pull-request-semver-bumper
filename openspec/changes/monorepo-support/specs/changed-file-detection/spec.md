## ADDED Requirements

### Requirement: Changed files retrieval

The action SHALL retrieve the list of files changed in the PR using `git diff --name-only origin/<base-branch>...HEAD`.

#### Scenario: Normal PR with changed files

- **WHEN** the PR branch has commits that modify files
- **THEN** the action SHALL return a list of all file paths changed relative to the base branch

#### Scenario: No files changed

- **WHEN** the PR branch has no file differences from the base branch
- **THEN** the action SHALL return an empty list

---

### Requirement: Package path matching

The action SHALL match each changed file against all declared package paths using prefix matching. A file MAY trigger bumps for multiple packages if their paths overlap.

#### Scenario: File matches single package

- **WHEN** changed file `packages/foo/src/index.ts` exists and package path `packages/foo` is declared
- **THEN** the action SHALL include `packages/foo` in the set of touched packages

#### Scenario: File matches multiple packages

- **WHEN** changed file `packages/foo/sub/lib.ts` exists and both `packages/foo` and `packages/foo/sub` are declared
- **THEN** the action SHALL include both packages in the set of touched packages

#### Scenario: File matches no package

- **WHEN** a changed file path does not start with any declared package path
- **THEN** the action SHALL not include any package for that file

#### Scenario: No packages touched

- **WHEN** no changed files match any declared package path and the config file is not changed
- **THEN** the action SHALL set output `bumped: false` and exit without making a commit

---

### Requirement: Config file change detection

The action SHALL bump all declared packages when `bumper.monorepo.json` itself is among the changed files.

#### Scenario: Config file modified in PR

- **WHEN** `bumper.monorepo.json` is in the list of changed files
- **THEN** the action SHALL include ALL packages declared in the config in the set of touched packages

#### Scenario: Config file not modified

- **WHEN** `bumper.monorepo.json` is not in the list of changed files
- **THEN** the action SHALL only include packages whose paths match changed files
