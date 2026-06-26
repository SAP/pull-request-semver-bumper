# Helm Chart Action

This action automates semantic version bumps for Helm chart projects by updating the `version` field in `Chart.yaml`.

## Contributing

If you are contributing from a forked repository, please ensure you have built the core action (`.github/actions/core`) and committed the `dist` folder. See the main [README](../../../../README.md#contributing) for details.

## Overview
It reads the `version` field from a specified `Chart.yaml` file using YAML parsing, calculates the next version based on the PR title, and updates it in-place using `yq`.

> **Note:** Only the chart `version` is bumped. The `appVersion` field (which tracks the deployed application version) is **not** modified.

## Configuration

### Inputs

| Input | Type | Required | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `token` | String | **Yes** | N/A | GitHub Token with `contents: write` permissions. |
| `chart-yaml-file` | String | No | `Chart.yaml` | Path to the Chart.yaml file. |
| `bump-command` | String | No | `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` | Command to update the version. |
| `post-command` | String | No | `''` | Shell command to run after bumping. |
| `git-username` | String | No | `github-actions[bot]` | Git author name. |
| `git-useremail` | String | No | `github-actions[bot]@users.noreply.github.com` | Git author email. |
| `commit-message` | String | No | `chore: bump version to @NEW_VERSION@` | Commit message. Use `@NEW_VERSION@` to insert the bumped version. |
| `dry-run` | String | No | `false` | If true, skip git checkout, pull, and push. |
| `default-branch` | String | No | `''` | Override default branch for version fetching (only effective when dry-run is true). |

### Supported Bump Commands

The allowed executables for the Helm build type are:
- `yq` (default) — YAML-aware in-place editing
- `sed` — Simple text substitution
- `helm` — Helm CLI for packaging workflows
- `echo` — Basic file overwrite patterns

> **Note:** `sh` and `bash` wrappers are also allowed (with a warning). Ensure your command includes `@NEW_VERSION@` for version substitution.

## Usage Example

```yaml
on:
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
      - name: Bump Helm Chart Version
        uses: sap/pull-request-semver-bumper@v1
        with:
          type: helm
          token: ${{ secrets.GITHUB_TOKEN }}
          chart-yaml-file: "Chart.yaml"
```

### Custom Chart Location

```yaml
      - name: Bump Helm Chart Version
        uses: sap/pull-request-semver-bumper@v1
        with:
          type: helm
          token: ${{ secrets.GITHUB_TOKEN }}
          chart-yaml-file: "charts/my-service/Chart.yaml"
```
