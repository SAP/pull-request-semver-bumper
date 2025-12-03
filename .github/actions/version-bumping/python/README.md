# Python Version Bumping Action

This action automates semantic version bumps for **Python** projects using `pyproject.toml`.

## Contributing

If you are contributing from a forked repository, please ensure you have built the core action (`.github/actions/core`) and committed the `dist` folder. See the main [README](../../../../README.md#contributing) for details.

## Overview
It reads the current version from `pyproject.toml`, calculates the next version based on the PR title, and updates the file using a configurable command (defaulting to `poetry`).

## Configuration

### Inputs

| Input | Type | Required | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `token` | String | **Yes** | N/A | GitHub Token with `contents: write` permissions. |
| `pyproject-file` | String | No | `pyproject.toml` | Path to the `pyproject.toml` file. |
| `bump-command` | String | No | `poetry version @NEW_VERSION@` | Command to update the version. Must include `@NEW_VERSION@`. |
| `post-command` | String | No | `''` | Shell command to run after bumping (e.g., `poetry lock --no-update`). |
| `git-username` | String | No | `github-actions[bot]` | Git author name. |
| `git-useremail` | String | No | `github-actions[bot]@users.noreply.github.com` | Git author email. |
| `commit-message` | String | No | `version bump to` | Commit message prefix. |
| `dry-run` | String | No | `false` | If true, skip git push. |

### Supported Bump Commands
The `bump-command` is validated for security. Only the following executables are allowed:
- `poetry` (Default)
- `toml`
- `python`
- `python3`

> **Note:** `sed` and other shell utilities are **not** supported in the bump command for security reasons.

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
      - name: Bump Python Version
        uses: sap/pull-request-semver-bumper/.github/actions/version-bumping/python@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          post-command: "poetry lock --no-update"
```

## Troubleshooting

| Error | Cause | Fix |
| :--- | :--- | :--- |
| `Version not found in pyproject.toml` | The regex `version\s*=\s*"(.*?)"` failed to match. | Ensure `version = "x.y.z"` exists in `pyproject.toml`. |
| `bump-command must include @NEW_VERSION@` | The placeholder is missing. | Add `@NEW_VERSION@` to your command. |
| `Invalid bump-command executable` | Using a blocked command (e.g., `sed`). | Use `poetry` or a python script instead. |
