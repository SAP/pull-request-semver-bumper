# AGENTS.md

## Repository Overview

Composite GitHub Actions suite that bumps semantic versions inside PRs. Supports Maven, NPM, Python, Helm, and generic VERSION files. The core logic is a Node.js action; thin composite wrappers set up ecosystem tooling and delegate to it.

## Project Layout

```
.github/actions/core/          ← All TypeScript source, tests, build output
.github/actions/core/src/      ← Source (ESM, strict TS)
.github/actions/core/dist/     ← ncc-bundled output (COMMITTED to repo)
.github/actions/core/build/    ← Intermediate tsc output (GITIGNORED)
.github/actions/version-bumping/{maven,npm,python,version-file,helm}/
                               ← Composite action wrappers per ecosystem
action.yml                     ← Root gateway action (routes by `type` input)
test-resources/<type>/         ← E2E fixtures (one subfolder per ecosystem)
```

## Commands

All npm commands run from `.github/actions/core/`, NOT the repo root:

```bash
cd .github/actions/core

npm install          # Install deps (also installs husky hooks at repo root)
npm test             # Run Jest tests
npm run build        # tsc → ncc bundle (writes dist/index.js)
```

Single test file: `npm test -- --testPathPattern=<pattern>`

## Critical Conventions

- **`dist/` is committed.** After ANY source change, run `npm run build` and `git add .github/actions/core/dist/`. The pre-commit hook does this automatically.
- **ESM module system.** All imports use `.js` extensions. Config files use `export default`. Jest uses ts-jest with a separate `tsconfig.test.json`.
- **`@actions/core` is mocked** via `__mocks__/@actions/core.ts` in tests. Do not import the real module in test files.
- **`@NEW_VERSION@` placeholder** in bump commands is substituted at runtime. All bump commands must contain it.

## Adding a New Build Type

Pattern (each type follows this exactly):
1. Add enum member to `src/types/build-type.ts`
2. Add `case` to `src/version/fetch-version.ts` (read version)
3. Add `case` to `src/version/validate-bump-command.ts` (allowed executables)
4. Add `case` to `src/version/update-version.ts` (file path + command construction)
5. Extend `files` bag type in fetch-version, update-version signatures + `src/index.ts`
6. Add input to `.github/actions/core/action.yml`
7. Create wrapper at `.github/actions/version-bumping/<type>/action.yml`
8. Add routing step + input + output chaining in root `action.yml`
9. Add fixture in `test-resources/<type>/` and E2E job in `build-and-test.yml`

## CI / E2E Tests

E2E tests use `dry-run: "true"` to skip git push. They require sed-patching `@main` references to local paths:
```bash
sed -i -E 's|sap/pull-request-semver-bumper/.github/actions/core@[^[:space:]"]+|./.github/actions/core|g' .github/actions/version-bumping/*/action.yml
sed -i -E 's|sap/pull-request-semver-bumper/.github/actions/version-bumping/([^@]+)@[^[:space:]"]+|./.github/actions/version-bumping/\1|g' action.yml
```

E2E tests pass `default-branch: ${{ github.head_ref }}` so version fetching reads from the PR branch (where test fixtures live). This override **only takes effect when `dry-run` is true** — in production, the PR base branch from the event payload is always used regardless of this input.

The `all-tests-passed` job gates PR mergeability — add new type jobs to its `needs:` list.

## Fork Contribution Quirk

For fork PRs, CI cannot auto-commit `dist/`. Contributors must run `npm run build` and commit `dist/` themselves. The CI job checks for dirty dist and fails if it's stale.
