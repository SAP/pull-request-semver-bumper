# Generic Version File Action

This action automates semantic version bumps for projects using a plain text `VERSION` file (e.g., Go, Python or any arbitrary projects).

## Contributing

If you are contributing from a forked repository, please ensure you have built the core action (`.github/actions/core`) and committed the `dist` folder. See the main [README](../../../../README.md#contributing) for details.

## Overview
It reads the version from a specified file (default `VERSION`), calculates the next version, and overwrites the file content.

## Configuration

### Inputs

| Input | Type | Required | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `token` | String | **Yes** | N/A | GitHub Token with `contents: write` permissions. |
| `version-file` | String | No | `VERSION` | Path to the version file. |
| `bump-command` | String | No | `echo @NEW_VERSION@ > VERSION` | Command to update the version. |
| `post-command` | String | No | `''` | Shell command to run after bumping. |
| `git-username` | String | No | `github-actions[bot]` | Git author name. |
| `git-useremail` | String | No | `github-actions[bot]@users.noreply.github.com` | Git author email. |
| `commit-message` | String | No | `version bump to` | Commit message prefix. |
| `dry-run` | String | No | `false` | If true, skip git push. |

### Supported Bump Commands
This action is **permissive**. It does not restrict the executable, allowing you to use any shell command available in the runner environment (e.g., `echo`, `printf`, custom scripts).

> **Note:** Ensure your command includes `@NEW_VERSION@` if you are using a template that requires substitution.

## Usage Example

```yaml
on:
  # Triggers the workflow on push or pull request events but only for the "main" branch
  pull_request:
    branches:
      - "main"
    types:
      - opened
      - reopened
      - edited
      - synchronize

jobs:
  bump-version:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: read
    steps:
      - uses: actions/checkout@v4
      - name: Bump Version File
        uses: sap/pull-request-semver-bumper/.github/actions/version-bumping/version-file@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          version-file: "VERSION"
```
