import { jest } from '@jest/globals';
import { fetchCurrentVersion } from './fetch-version.js';
import { BUILD_TYPE } from '../types/build-type.js';
import { getFileFromDefaultBranch } from '../git/git.js';
import { parsePom } from '../utils/pom.js';

// Mock dependencies
jest.mock('../git/git');
jest.mock('../utils/pom');

const mockGetFile = getFileFromDefaultBranch as jest.Mock;
const mockParsePom = parsePom as jest.Mock;

describe('fetchCurrentVersion', () => {
    const mockGit = {} as any; // SimpleGit mock not needed deeply as we mock getFileFromDefaultBranch
    const files = { pom: 'pom.xml', pkg: 'package.json', version: 'VERSION', py: 'pyproject.toml' };
    const defaultBranch = 'main';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch Maven version', async () => {
        mockGetFile.mockResolvedValue('<project>...</project>');
        mockParsePom.mockResolvedValue({ pomObject: { project: { version: '1.0.0-SNAPSHOT' } } });

        const version = await fetchCurrentVersion(mockGit, BUILD_TYPE.MAVEN, files, defaultBranch, '["project","version"]');
        expect(version).toBe('1.0.0'); // Should strip SNAPSHOT
        expect(mockGetFile).toHaveBeenCalledWith(mockGit, 'pom.xml', 'main');
    });

    it('should fetch NPM version', async () => {
        mockGetFile.mockResolvedValue(JSON.stringify({ version: '1.2.3' }));
        const version = await fetchCurrentVersion(mockGit, BUILD_TYPE.NPM, files, defaultBranch, '');
        expect(version).toBe('1.2.3');
    });

    it('should fetch Version File version', async () => {
        mockGetFile.mockResolvedValue(' 2.0.0 \n');
        const version = await fetchCurrentVersion(mockGit, BUILD_TYPE.VERSION_FILE, files, defaultBranch, '');
        expect(version).toBe('2.0.0');
    });

    it('should fetch Python version', async () => {
        mockGetFile.mockResolvedValue('[tool.poetry]\nversion = "3.4.5"\nname="foo"');
        const version = await fetchCurrentVersion(mockGit, BUILD_TYPE.PYTHON, files, defaultBranch, '');
        expect(version).toBe('3.4.5');
    });

    it('should throw if Python version not found', async () => {
        mockGetFile.mockResolvedValue('[tool.poetry]\nname="foo"');
        await expect(fetchCurrentVersion(mockGit, BUILD_TYPE.PYTHON, files, defaultBranch, ''))
            .rejects.toThrow('Version not found in pyproject.toml');
    });
});
