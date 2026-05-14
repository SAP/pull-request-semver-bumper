import { jest } from '@jest/globals';
import { updateLocalVersion } from './update-version.js';
import { BUILD_TYPE } from '../types/build-type.js';
import { executeCommand } from '../utils/executeCommand.js';

jest.mock('../utils/executeCommand');
const mockExecute = executeCommand as jest.Mock;

describe('updateLocalVersion', () => {
    const files = { pom: 'pom.xml', pkg: 'package.json', version: 'VERSION', py: 'pyproject.toml' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update Maven version', async () => {
        await updateLocalVersion(BUILD_TYPE.MAVEN, 'mvn set @NEW_VERSION@', '1.0.1', files);
        // Expect cd . && mvn set 1.0.1 -f pom.xml (since pom.xml is default but logic adds -f if name != pom.xml? No wait, logic says if fileName !== "pom.xml")
        // Actually let's check the code: if (fileName !== "pom.xml") args.push("-f", fileName);
        // Here file is pom.xml so no -f.
        expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('mvn set 1.0.1'));
    });

    it('should update Maven version with custom file', async () => {
        await updateLocalVersion(BUILD_TYPE.MAVEN, 'mvn set @NEW_VERSION@', '1.0.1', { ...files, pom: 'sub/custom.xml' });
        expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('mvn set 1.0.1 -f custom.xml'));
    });

    it('should update NPM version', async () => {
        await updateLocalVersion(BUILD_TYPE.NPM, 'npm version @NEW_VERSION@', '1.0.1', files);
        expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('npm version 1.0.1 --no-git-tag-version --allow-same-version'));
    });

    it('should update Python version', async () => {
        await updateLocalVersion(BUILD_TYPE.PYTHON, 'poetry version @NEW_VERSION@', '1.0.1', files);
        expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('poetry version 1.0.1'));
    });

    it('should update Version File', async () => {
        await updateLocalVersion(BUILD_TYPE.VERSION_FILE, 'echo @NEW_VERSION@ > VERSION', '1.0.1', files);
        expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('echo 1.0.1 > VERSION'));
    });
});
