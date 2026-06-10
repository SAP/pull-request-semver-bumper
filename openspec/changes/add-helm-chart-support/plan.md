# Helm Chart Version Bumping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `type: helm` support to the pull-request-semver-bumper action, reading version from Chart.yaml via js-yaml and bumping via yq.

**Architecture:** Extends the existing BUILD_TYPE switch-based architecture with a new HELM enum member. Touches fetch-version, validate-bump-command, update-version, adds a composite wrapper, and routes through the gateway action.yml. Also restructures test-resources into per-ecosystem subfolders.

**Tech Stack:** TypeScript, Jest, js-yaml, GitHub Actions (composite), yq (mikefarah/yq)

---

## Task 1: Core Type Registration

**Files:**
- Modify: `.github/actions/core/src/types/build-type.ts`
- Modify: `.github/actions/core/package.json`
- Modify: `.github/actions/core/action.yml`
- Modify: `.github/actions/core/src/index.ts`

- [ ] **Step 1: Add HELM to BUILD_TYPE enum**

In `.github/actions/core/src/types/build-type.ts`, add a new enum member:

```typescript
export enum BUILD_TYPE {
    MAVEN = 'maven',
    NPM = 'npm',
    PYTHON = 'python',
    VERSION_FILE = 'version-file',
    HELM = 'helm'
}
```

- [ ] **Step 2: Add js-yaml dependency**

In `.github/actions/core/package.json`, add to `dependencies`:
```json
"js-yaml": "^4.1.0"
```

And to `devDependencies`:
```json
"@types/js-yaml": "^4.0.9"
```

- [ ] **Step 3: Add chart-file input to core action.yml**

In `.github/actions/core/action.yml`, add after the `pyproject-file` input:
```yaml
  chart-file:
    description: "Where to find the Chart.yaml file, only relevant for buildType helm"
    default: "Chart.yaml"
    required: false
```

- [ ] **Step 4: Extend files bag in index.ts**

In `.github/actions/core/src/index.ts`, update the `files` object (around line 21-26):
```typescript
const files = {
    pom: core.getInput('pom-file') || 'pom.xml',
    pkg: core.getInput('package-json-file') || 'package.json',
    version: core.getInput('version-file') || 'VERSION',
    py: core.getInput('pyproject-file') || 'pyproject.toml',
    chart: core.getInput('chart-file') || 'Chart.yaml'
};
```

- [ ] **Step 5: Run npm install**

```bash
cd .github/actions/core && npm install
```

---

## Task 2: Version Fetching

**Files:**
- Modify: `.github/actions/core/src/version/fetch-version.ts`
- Modify: `.github/actions/core/src/version/fetch-version.test.ts`

- [ ] **Step 1: Write failing test for Helm version fetching**

In `.github/actions/core/src/version/fetch-version.test.ts`, add a describe block for Helm:

```typescript
describe('HELM', () => {
    it('should extract version from Chart.yaml', async () => {
        const chartContent = 'apiVersion: v2\nname: my-chart\nversion: 1.2.3\nappVersion: "1.0.0"';
        (getFileFromDefaultBranch as jest.Mock).mockResolvedValue(chartContent);

        const result = await fetchCurrentVersion(
            {} as any,
            BUILD_TYPE.HELM,
            { pom: '', pkg: '', version: '', py: '', chart: 'Chart.yaml' },
            'main',
            ''
        );

        expect(result).toBe('1.2.3');
    });

    it('should extract quoted version from Chart.yaml', async () => {
        const chartContent = 'apiVersion: v2\nname: my-chart\nversion: "2.0.0"';
        (getFileFromDefaultBranch as jest.Mock).mockResolvedValue(chartContent);

        const result = await fetchCurrentVersion(
            {} as any,
            BUILD_TYPE.HELM,
            { pom: '', pkg: '', version: '', py: '', chart: 'Chart.yaml' },
            'main',
            ''
        );

        expect(result).toBe('2.0.0');
    });

    it('should throw error when version field is missing', async () => {
        const chartContent = 'apiVersion: v2\nname: my-chart\nappVersion: "1.0.0"';
        (getFileFromDefaultBranch as jest.Mock).mockResolvedValue(chartContent);

        await expect(fetchCurrentVersion(
            {} as any,
            BUILD_TYPE.HELM,
            { pom: '', pkg: '', version: '', py: '', chart: 'Chart.yaml' },
            'main',
            ''
        )).rejects.toThrow('Version not found in Chart.yaml');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .github/actions/core && npm test -- --testPathPattern=fetch-version
```

Expected: FAIL — `BUILD_TYPE.HELM` case not implemented.

- [ ] **Step 3: Implement Helm case in fetchCurrentVersion**

In `.github/actions/core/src/version/fetch-version.ts`:

Add import at top:
```typescript
import yaml from 'js-yaml';
```

Update the function signature to include `chart` in the files type:
```typescript
files: { pom: string; pkg: string; version: string; py: string; chart: string },
```

Add case before the closing `}` of the switch:
```typescript
case BUILD_TYPE.HELM: {
    const content = await getFileFromDefaultBranch(git, files.chart, defaultBranch);
    const parsed = yaml.load(content) as Record<string, unknown>;
    if (!parsed || !parsed.version) {
        throw new Error(`Version not found in ${files.chart}`);
    }
    return String(parsed.version).trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd .github/actions/core && npm test -- --testPathPattern=fetch-version
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/actions/core/src/version/fetch-version.ts .github/actions/core/src/version/fetch-version.test.ts
git commit -m "feat: add Helm version fetching from Chart.yaml using js-yaml"
```

---

## Task 3: Bump Command Validation

**Files:**
- Modify: `.github/actions/core/src/version/validate-bump-command.ts`
- Modify: `.github/actions/core/src/version/validate-bump-command.test.ts`

- [ ] **Step 1: Write failing tests for Helm validation**

In `.github/actions/core/src/version/validate-bump-command.test.ts`, add:

```typescript
describe('HELM', () => {
    it('should allow yq', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'yq e \'.version = "@NEW_VERSION@"\' -i Chart.yaml')).not.toThrow();
    });

    it('should allow sed', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'sed -i \'s/^version:.*/version: @NEW_VERSION@/\' Chart.yaml')).not.toThrow();
    });

    it('should allow helm', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'helm package . --version @NEW_VERSION@')).not.toThrow();
    });

    it('should allow echo', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'echo @NEW_VERSION@ > Chart.yaml')).not.toThrow();
    });

    it('should reject disallowed executable', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'curl http://example.com/@NEW_VERSION@')).toThrow(/Invalid bump-command executable for helm/);
    });

    it('should allow bash with warning', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.HELM, 'bash -c "yq e \'.version = @NEW_VERSION@\' -i Chart.yaml"')).not.toThrow();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .github/actions/core && npm test -- --testPathPattern=validate-bump-command
```

Expected: FAIL — hits `default: throw new Error('Unsupported build type')`.

- [ ] **Step 3: Implement Helm case in validateBumpCommand**

In `.github/actions/core/src/version/validate-bump-command.ts`, add before the `case BUILD_TYPE.VERSION_FILE:` block (around line 37):

```typescript
case BUILD_TYPE.HELM:
    validateExecutable(cmd, ["yq", "sed", "helm", "echo"], buildType);
    break;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd .github/actions/core && npm test -- --testPathPattern=validate-bump-command
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/actions/core/src/version/validate-bump-command.ts .github/actions/core/src/version/validate-bump-command.test.ts
git commit -m "feat: add Helm bump command validation (yq, sed, helm, echo)"
```

---

## Task 4: Version Update

**Files:**
- Modify: `.github/actions/core/src/version/update-version.ts`
- Modify: `.github/actions/core/src/version/update-version.test.ts`

- [ ] **Step 1: Write failing test for Helm version update**

In `.github/actions/core/src/version/update-version.test.ts`, add:

```typescript
describe('HELM', () => {
    it('should resolve file path from files.chart', async () => {
        (executeCommand as jest.Mock).mockResolvedValue('');

        await updateLocalVersion(
            BUILD_TYPE.HELM,
            'yq e \'.version = "@NEW_VERSION@"\' -i Chart.yaml',
            '2.0.0',
            { pom: '', pkg: '', version: '', py: '', chart: 'charts/my-app/Chart.yaml' }
        );

        expect(executeCommand).toHaveBeenCalledWith(
            expect.stringContaining('cd charts/my-app')
        );
        expect(executeCommand).toHaveBeenCalledWith(
            expect.stringContaining('2.0.0')
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .github/actions/core && npm test -- --testPathPattern=update-version
```

Expected: FAIL — hits `default: throw new Error('Unsupported build type')`.

- [ ] **Step 3: Implement Helm case in updateLocalVersion**

In `.github/actions/core/src/version/update-version.ts`:

Update the function signature files type to include `chart`:
```typescript
files: { pom: string; pkg: string; version: string; py: string; chart: string }
```

Add to the first switch (file path selection, around line 65):
```typescript
case BUILD_TYPE.HELM:
    filePath = files.chart;
    break;
```

Add to the second switch (command construction, around line 116):
```typescript
case BUILD_TYPE.HELM: {
    command = bumpCommand.replace("@NEW_VERSION@", newVersion);
    [cmd, ...args] = command.split(/\s+/);
    break;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd .github/actions/core && npm test -- --testPathPattern=update-version
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/actions/core/src/version/update-version.ts .github/actions/core/src/version/update-version.test.ts
git commit -m "feat: add Helm version update with chart file path resolution"
```

---

## Task 5: Composite Action Wrapper

**Files:**
- Create: `.github/actions/version-bumping/helm/action.yml`

- [ ] **Step 1: Create Helm composite action**

Create `.github/actions/version-bumping/helm/action.yml`:

```yaml
name: Automated Helm Chart Version Bump
description: Automated Helm Chart Version Bump, only recommend to run in PRs.

inputs:
  chart-yaml-file:
    description: "Where to find the Chart.yaml file"
    default: "Chart.yaml"
    required: false
  bump-command:
    description: "Command to update the version"
    default: "yq e '.version = \"@NEW_VERSION@\"' -i Chart.yaml"
    required: false
  commit-message:
    description: "Custom commit message for version bump commit"
    default: "chore: bump version to @NEW_VERSION@"
    required: false
  git-username:
    description: "Git username for the commit"
    default: "github-actions[bot]"
    required: false
  git-useremail:
    description: "Git user email for the commit"
    default: "github-actions[bot]@users.noreply.github.com"
    required: false
  post-command:
    description: "shell command to run after version bump"
    default: ""
    required: false
  token:
    description: "Github token with permission to fetch PR status and commit the changes"
    required: true
  dry-run:
    description: "If true, skip git checkout, pull, and push"
    default: "false"
    required: false

outputs:
  bumped:
    description: "True if version was bumped"
    value: ${{ steps.bump.outputs.bumped }}
  new-version:
    description: "The new version"
    value: ${{ steps.bump.outputs.new-version }}
  bumpLevel:
    description: "The computed SemVer bump level (major, minor, patch)"
    value: ${{ steps.bump.outputs.bumpLevel }}

runs:
  using: composite
  steps:
    - uses: amannn/action-semantic-pull-request@v6
      env:
        GITHUB_TOKEN: ${{ inputs.token }}

    - name: Install yq
      uses: mikefarah/yq@master

    - name: Bump up helm chart version
      id: bump
      uses: sap/pull-request-semver-bumper/.github/actions/core@main
      with:
        build-type: "helm"
        chart-file: ${{ inputs.chart-yaml-file }}
        git-username: ${{ inputs.git-username }}
        git-useremail: ${{ inputs.git-useremail }}
        commit-message: ${{ inputs.commit-message }}
        token: ${{ inputs.token }}
        bump-command: ${{ inputs.bump-command }}
        post-command: ${{ inputs.post-command }}
        dry-run: ${{ inputs.dry-run }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/actions/version-bumping/helm/action.yml
git commit -m "feat: add Helm composite action wrapper with yq installation"
```

---

## Task 6: Gateway Routing

**Files:**
- Modify: `action.yml` (root)

- [ ] **Step 1: Add chart-yaml-file input to root action.yml**

In `action.yml`, after the `version-file` input (around line 58), add:
```yaml
  chart-yaml-file:
    description: "Path to Chart.yaml (helm only)"
    default: "Chart.yaml"
    required: false
```

- [ ] **Step 2: Add Helm routing step**

After the `Bump Version File` step (after line 129), add:
```yaml
    - name: Bump Helm
      if: inputs.type == 'helm'
      id: bump_helm
      uses: sap/pull-request-semver-bumper/.github/actions/version-bumping/helm@main
      with:
        token: ${{ inputs.token }}
        dry-run: ${{ inputs.dry-run }}
        bump-command: ${{ inputs.bump-command || 'yq e ''.version = "@NEW_VERSION@"'' -i Chart.yaml' }}
        commit-message: ${{ inputs.commit-message }}
        git-username: ${{ inputs.git-username }}
        git-useremail: ${{ inputs.git-useremail }}
        post-command: ${{ inputs.post-command }}
        chart-yaml-file: ${{ inputs.chart-yaml-file }}
```

- [ ] **Step 3: Update output chaining**

Update the three output lines to include helm:
```yaml
  bumped:
    value: ${{ steps.bump_maven.outputs.bumped || steps.bump_npm.outputs.bumped || steps.bump_python.outputs.bumped || steps.bump_version_file.outputs.bumped || steps.bump_helm.outputs.bumped }}
  new-version:
    value: ${{ steps.bump_maven.outputs.new-version || steps.bump_npm.outputs.new-version || steps.bump_python.outputs.new-version || steps.bump_version_file.outputs.new-version || steps.bump_helm.outputs.new-version }}
  bumpLevel:
    value: ${{ steps.bump_maven.outputs.bumpLevel || steps.bump_npm.outputs.bumpLevel || steps.bump_python.outputs.bumpLevel || steps.bump_version_file.outputs.bumpLevel || steps.bump_helm.outputs.bumpLevel }}
```

- [ ] **Step 4: Commit**

```bash
git add action.yml
git commit -m "feat: add Helm gateway routing in root action.yml"
```

---

## Task 7: Test Resources Restructure

**Files:**
- Move: `test-resources/*` → `test-resources/<type>/*`
- Create: `test-resources/helm/Chart.yaml`
- Modify: `.github/workflows/build-and-test.yml`

- [ ] **Step 1: Create subdirectories and move fixtures**

```bash
mkdir -p test-resources/{maven,npm,python,version-file,helm}
mv test-resources/pom.xml test-resources/maven/
mv test-resources/package.json test-resources/npm/
mv test-resources/pyproject.toml test-resources/python/
mv test-resources/VERSION test-resources/version-file/
mv test-resources/target test-resources/maven/
```

- [ ] **Step 2: Create Helm fixture**

Create `test-resources/helm/Chart.yaml`:
```yaml
apiVersion: v2
name: test-chart
description: A test Helm chart
version: 1.0.0
appVersion: "1.0.0"
```

- [ ] **Step 3: Update E2E fixture paths in build-and-test.yml**

Update references in each E2E job:
- `test-resources/pom.xml` → `test-resources/maven/pom.xml`
- `test-resources/package.json` → `test-resources/npm/package.json`
- `test-resources/pyproject.toml` → `test-resources/python/pyproject.toml`
- `test-resources/VERSION` → `test-resources/version-file/VERSION`

- [ ] **Step 4: Commit**

```bash
git add test-resources/ .github/workflows/build-and-test.yml
git commit -m "refactor: restructure test-resources into per-ecosystem subfolders"
```

---

## Task 8: E2E Test

**Files:**
- Modify: `.github/workflows/build-and-test.yml`

- [ ] **Step 1: Add test-helm job**

Add after `test-version-file` job:
```yaml
  test-helm:
    needs: [build-test-core, commit-dist]
    if: >-
      always() &&
      needs.build-test-core.result == 'success' &&
      (needs.commit-dist.result == 'success' || needs.commit-dist.result == 'skipped')
    runs-on: [ubuntu-latest]
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Patch composite actions for E2E
        run: |
          sed -i -E 's|sap/pull-request-semver-bumper/.github/actions/core@[^[:space:]"]+|./.github/actions/core|g' .github/actions/version-bumping/*/action.yml
          sed -i -E 's|sap/pull-request-semver-bumper/.github/actions/version-bumping/helm@[^[:space:]"]+|./.github/actions/version-bumping/helm|g' action.yml
      - name: Test Helm Action (Dry Run)
        id: version_bump
        uses: ./
        with:
          type: helm
          token: ${{ secrets.GITHUB_TOKEN }}
          chart-yaml-file: "test-resources/helm/Chart.yaml"
          dry-run: "true"

      - name: Verify Outputs
        run: |
          echo "Bumped: ${{ steps.version_bump.outputs.bumped }}"
          echo "New Version: ${{ steps.version_bump.outputs.new-version }}"
          echo "Bump Level: ${{ steps.version_bump.outputs.bumpLevel }}"
          echo "### Helm Test New Version: ${{ steps.version_bump.outputs.new-version }}" >> $GITHUB_STEP_SUMMARY
          if [ -z "${{ steps.version_bump.outputs.bumped }}" ]; then
            echo "Error: 'bumped' output is empty"
            exit 1
          fi
```

- [ ] **Step 2: Add test-helm to all-tests-passed needs**

Update the `needs:` line of `all-tests-passed`:
```yaml
    needs: [build-test-core, commit-dist, test-python, test-npm, test-maven, test-version-file, test-helm]
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/build-and-test.yml
git commit -m "test: add Helm E2E dry-run test job"
```

---

## Task 9: Build & Verify

- [ ] **Step 1: Install dependencies**

```bash
cd .github/actions/core && npm install
```

- [ ] **Step 2: Build dist**

```bash
cd .github/actions/core && npm run build
```

- [ ] **Step 3: Run all tests**

```bash
cd .github/actions/core && npm test
```

Expected: All tests pass including new Helm tests.

- [ ] **Step 4: Final commit with dist**

```bash
git add .github/actions/core/dist/ .github/actions/core/package.json .github/actions/core/package-lock.json
git commit -m "chore: rebuild dist with Helm support"
```
