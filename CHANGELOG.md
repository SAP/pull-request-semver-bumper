## [1.0.0] - 2025-12-08

# Changelog

## 🚀 Features

- feat: Add an  job to aggregate test results and set commit status.
- feat: Add changelog configuration file and integrate it into the release workflow.
- feat: add release workflow, MPL-2.0 license, and update REUSE.toml.
- feat: add workflow concurrency to build-and-test workflow and update core action paths in version bumping actions.

## 🐛 Fixes

- fix: Add step to copy actions to workspace as a workaround for a GitHub Actions runner limitation.
- fix: correct copyright year in README.md
- fix: correct core action path in npm version bumping workflow
- fix: correctly copy action contents to the workspace instead of the directory itself.
- fix: correctly copy action directory contents to workspace (#12)
- fix: correctly copy action directory contents to workspace instead of the directory itself.
- fix: fix calling branch in documentation (#22)
- fix: remove angle brackets from SPDX fields in REUSE.toml
- fix: update workflow group (#7)
- fix: use external invoking for sub-actions (#13)
- fix: workaround for invoke local action from external repo (#11)

## 🧰 Maintenance

- chore: add build test final status for PR's status check (#14)
- chore: remove package-lock.json
- chore: Replace copyright placeholder with actual project name in REUSE.toml.
- chore: update action usage examples to use a unified gateway action (#2)
- chore: Update action usage paths in READMEs and project metadata in REUSE.toml.
- chore: Use pull request number for workflow concurrency groups.
- chore(deps-dev): bump jest and @types/jest in /.github/actions/core (#8)
- chore(deps-dev): bump ts-jest from 29.4.5 to 29.4.6 in /.github/actions/core (#9)
- ci: change workflow trigger from pull_request_target to pull_request
- ci: Configure semver bumper to explicitly use HEAD as the target tag in the release workflow. (#18)
- ci: improved changelog generation (#16)
- ci: switch GitHub Actions runners from 'solinas' to 'ubuntu-latest'
- ci: Update build runner from solinas to ubuntu-latest
- refactor: Update  path for core action and rename  input to .
- refactor: update action usage examples to use a unified gateway action with a  input and add clarifying documentation
- refactor: Update build workflow to use a unified version bumper action with a  input.
- refactor: update internal action  path and rename  input to 
- refactor: update workflow trigger from pull_request to pull_request_target
- refactor: validation workflow now test from gateway action (#4)

## 📝 Documentation

- docs: add issue templates and reuse api badege (#21)
- docs: add project name into copyright place holder (#5)
- docs: add requirements section and update licensing link in README (#10)
- docs: add requirements section and update licensing link in README.
- docs: update Maven README (#3)
- docs: update Maven README to remove outdated credential example and add Nexus env vars to main usage.
- docs: update readme highlighting USP and update meta information (#23)


