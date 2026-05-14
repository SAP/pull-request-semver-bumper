# AGENTS.md

## What This Repo Is

A suite of **Composite GitHub Actions** for semantic version bumping within PRs. Supports Maven, NPM, Python (Poetry), and generic VERSION files. The real logic lives in a single Node.js action at `.github/actions/core/`.

## Project Layout

```
action.yml                        # Gateway composite action (delegates by `type` input)
.github/actions/core/             # THE source code (TypeScript, Node 20 action)
.github/actions/version-bumping/  # Thin composite wrappers per ecosystem (maven/npm/python/version-file)
.github/workflows/                # CI (build-and-test.yml) and release (release.yml)
test-resources/                   # Fixture files for E2E dry-run tests in CI
configuration.json                # Changelog builder config for releases
```

## Developer Commands

All commands run from `.github/actions/core/`:

```bash
cd .github/actions/core
npm install       # also sets up husky hooks in project root
npm test          # jest (ts-jest, unit tests co-located with source)
npm run build     # tsc -> build/, then ncc -> dist/
```

- **No root-level package.json exists.** The only npm project is `.github/actions/core/`.
- There is no lint command yet (`npm run lint` is a no-op placeholder).

## Build Artifact: `dist/` Is Committed

The compiled `dist/` folder in `.github/actions/core/dist/` **must be committed**. The action runs directly from it (`runs: using: node20, main: dist/index.js`).

A **husky pre-commit hook** (`.husky/pre-commit`) automatically runs `npm run build --prefix .github/actions/core` and stages `dist/`. If you bypass hooks, CI will auto-commit `dist/` for same-repo PRs, but **forked PRs will fail** if `dist/` is stale.

## Testing

- **Unit tests**: `npm test` in `.github/actions/core/` — Jest with ts-jest, files match `**/*.test.ts`, co-located in `src/`.
- **E2E tests**: Run only in CI (`build-and-test.yml`) as dry-run action invocations against `test-resources/` fixtures. Cannot be run locally.
- CI patches `@main` references to local paths via `sed` for E2E — do not change the `sap/pull-request-semver-bumper/...@main` references in sub-action `action.yml` files thinking they are wrong.

## Key Conventions

- PR titles must follow **Conventional Commits** — the action parses them to determine bump level.
- The `@NEW_VERSION@` placeholder in `bump-command` inputs is replaced at runtime with the computed version.
- `version-property-path` input (Maven) is a JSON array path, e.g., `["project","version"]`.

## Release Process

Releases are triggered manually via `workflow_dispatch` on `release.yml`. The workflow:
1. Generates changelog from commits since last tag
2. Creates a changelog PR and auto-merges it
3. Tags `vX.Y.Z` and force-updates `vX` major tag
4. Replaces `@main` with `@vX` in action.yml references for the release tag

## Gotchas

- The `prepare` script in `package.json` runs `cd ../../ && husky` — this means `npm install` must be run from `.github/actions/core/`, not from root.
- TypeScript target is ES2019, module is CommonJS.
- Node.js 20 is the action runtime version.
