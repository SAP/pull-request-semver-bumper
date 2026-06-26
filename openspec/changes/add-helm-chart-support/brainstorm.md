## Design Summary

Add Helm chart version bumping support (`type: helm`) to the pull-request-semver-bumper action suite. This extends the existing ecosystem (Maven, NPM, Python, VERSION file) with a dedicated build type that reads `version` from `Chart.yaml` using `js-yaml` and writes it back using `yq` as the default bump command. The implementation follows the identical architectural pattern of existing build types — enum member, switch cases across fetch/validate/update, composite wrapper, and gateway routing.

## Alternatives Considered

### Option A: yq-based bump with js-yaml for reading (Chosen)

- **Approach**: Use `js-yaml` (new dependency, bundled by ncc) to parse `Chart.yaml` for version reading. Default bump command uses `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml`. Composite wrapper installs `yq` via the `mikefarah/yq` GitHub Action.
- **Pros**: YAML-aware on both read and write sides. `yq` is the de facto CLI tool for YAML in CI/K8s environments. Follows the configurable-command pattern. Users can override with their own command.
- **Cons**: Adds `js-yaml` as a bundled dependency. Composite wrapper must install `yq`.
- **Why chosen**: Best balance of correctness, user familiarity, and pattern compliance.

### Option B: sed-based bump (no extra tooling)

- **Approach**: Use `js-yaml` for reading, but default bump command is `sed -i 's/^version:.*/version: @NEW_VERSION@/' Chart.yaml`.
- **Pros**: No extra tool installation in the composite wrapper. Simpler CI setup.
- **Cons**: `sed` is fragile with YAML (comments, quoting, indentation). While `version` is top-level and this works in practice, it's not YAML-aware and could produce invalid YAML in edge cases.
- **Why not chosen**: Less robust than `yq`. Helm/K8s users expect proper YAML tooling.

### Option C: Internal Node.js-based bump (no external tools)

- **Approach**: Use `js-yaml` for both reading and writing — the core Node action itself modifies `Chart.yaml` without a shell command.
- **Pros**: No external tool dependencies at all. Full control over YAML formatting.
- **Cons**: Breaks the pattern where the bump command is a user-configurable shell command with `@NEW_VERSION@` substitution. Would require special-casing the update logic. Reduces user flexibility.
- **Why not chosen**: Violates the project's core architectural principle that bump commands are external, configurable shell commands.

## Agreed Approach

**Option A**: `yq`-based bump with `js-yaml` for reading. This was chosen because:
1. It maintains architectural consistency with all other build types
2. `yq` is the natural tool for Helm chart users
3. `js-yaml` provides robust version extraction without regex fragility
4. The composite wrapper pattern cleanly handles `yq` installation

## Key Decisions

- **`js-yaml` for version reading**: Proper YAML parsing instead of regex. Added as a dependency in `.github/actions/core/package.json` and bundled by `ncc` into `dist/`.
- **`yq` as default bump tool**: `yq e '.version = "@NEW_VERSION@"' -i Chart.yaml` is the default bump command. Users can override this.
- **Allowed executables**: `yq`, `sed`, `helm`, `echo` — matches the ecosystem's tooling expectations while remaining restrictive.
- **File input naming**: `chart-file` (core action) / `chart-yaml-file` (composite/gateway) with default `Chart.yaml`.
- **No `appVersion` handling**: Explicitly out of scope per issue #90. Only `version` is bumped.
- **Composite wrapper installs `yq`**: Uses `mikefarah/yq` action to ensure `yq` is available regardless of runner configuration.
- **E2E test**: New `test-helm` job in `build-and-test.yml` with `test-resources/helm/Chart.yaml` fixture containing `version: 1.0.0`.
- **Test resource restructure**: Move each ecosystem's fixture into its own subfolder (`test-resources/maven/pom.xml`, `test-resources/npm/package.json`, `test-resources/python/pyproject.toml`, `test-resources/version-file/VERSION`, `test-resources/helm/Chart.yaml`). Update CI workflow paths accordingly. This keeps fixtures isolated and easier to manage.

## Open Questions

- [x] YAML parsing approach → Decided: `js-yaml` library
- [x] Bump command tool → Decided: `yq` (Option A)
- [x] E2E test coverage → Decided: Include `test-helm` job matching existing pattern
