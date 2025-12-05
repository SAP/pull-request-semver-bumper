# NPM Version Bumping Action

This action automates semantic version bumps for **NPM** projects using `package.json`.

## Overview
It reads the version from `package.json` and updates it using `npm version`. It automatically adds flags to prevent git tagging and allow same-version updates to ensure idempotency within the action's workflow.

## Configuration

### Inputs

| Input | Type | Required | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `token` | String | **Yes** | N/A | GitHub Token with `contents: write` permissions. |
| `package-json-file` | String | No | `package.json` | Path to the `package.json` file. |
| `bump-command` | String | No | `npm version @NEW_VERSION@ ...` | Command to update the version. |
| `post-command` | String | No | `''` | Shell command to run after bumping. |
| `git-username` | String | No | `github-actions[bot]` | Git author name. |
| `git-useremail` | String | No | `github-actions[bot]@users.noreply.github.com` | Git author email. |
| `commit-message` | String | No | `version bump to` | Commit message prefix. |
| `dry-run` | String | No | `false` | If true, skip git push. |

### Supported Bump Commands
The `bump-command` is validated. Allowed executables:
- `npm`
- `npx`
- `pnpm`
- `yarn`

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
      - name: Bump NPM Version
        uses: sap/pull-request-semver-bumper@v1
        with:
          type: npm
          token: ${{ secrets.GITHUB_TOKEN }}
```
