# Maven Version Bumping Action

This action automates semantic version bumps for **Maven** projects using `pom.xml`.

## Overview
It parses the `pom.xml`, handles SNAPSHOT versions (stripping `-SNAPSHOT` before bumping), and updates the version using the `versions-maven-plugin`.

## Configuration

### Inputs

| Input | Type | Required | Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `token` | String | **Yes** | N/A | GitHub Token with `contents: write` permissions. |
| `pom-file` | String | No | `pom.xml` | Path to the `pom.xml` file. |
| `bump-command` | String | No | `mvn org.codehaus.mojo:versions-maven-plugin:set -DnewVersion=@NEW_VERSION@ -s settings.xml` | Command to update the version. |
| `version-property-path` | String | No | `["project","version"]` | JSON array path to find the version in the POM object model. |
| `post-command` | String | No | `''` | Shell command to run after bumping. |
| `git-username` | String | No | `github-actions[bot]` | Git author name. |
| `git-useremail` | String | No | `github-actions[bot]@users.noreply.github.com` | Git author email. |
| `commit-message` | String | No | `version bump to` | Commit message prefix. |
| `dry-run` | String | No | `false` | If true, skip git push. |

### Supported Bump Commands
The `bump-command` is validated. Allowed executables:
- `mvn`
- `mvnw`
- `./mvnw`

## Contributing

If you are contributing from a forked repository, please ensure you have built the core action (`.github/actions/core`) and committed the `dist` folder. See the main [README](../../../../README.md#contributing) for details.

### Private Repositories & Credentials
The default `bump-command` automatically includes `-s settings.xml` to support private repositories.
If your `settings.xml` requires authentication, ensure you inject the necessary environment variables (e.g. `NEXUS_USERNAME`, `NEXUS_PASSWORD`) into the action step.


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
      - name: Bump Maven Version
        uses: sap/pull-request-semver-bumper@v1
        env:
          NEXUS_USERNAME: ${{ secrets.NEXUS_USERNAME }}
          NEXUS_PASSWORD: ${{ secrets.NEXUS_PASSWORD }}
        with:
          type: maven
          token: ${{ secrets.GITHUB_TOKEN }}
```
