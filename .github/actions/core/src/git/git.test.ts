import { jest } from '@jest/globals';
import { createGit, configureGit, getFileFromDefaultBranch } from './git.js';
import { simpleGit } from 'simple-git';
import * as core from '@actions/core';

jest.mock('simple-git');
jest.mock('@actions/core');

describe('git', () => {
    const mockSimpleGit = {
        addConfig: jest.fn(),
        show: jest.fn(),
        clone: jest.fn(),
        remote: jest.fn(),
        addRemote: jest.fn(),
        fetch: jest.fn(),
        checkout: jest.fn(),
        pull: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (simpleGit as jest.Mock).mockReturnValue(mockSimpleGit);
        process.env.GITHUB_SERVER_URL = 'https://github.com';
        process.env.GITHUB_REPOSITORY = 'owner/repo';
        process.env.GITHUB_HEAD_REF = 'feature/branch';
    });

    afterEach(() => {
        delete process.env.GITHUB_SERVER_URL;
        delete process.env.GITHUB_REPOSITORY;
        delete process.env.GITHUB_HEAD_REF;
    });

    it('should create git instance', () => {
        createGit();
        expect(simpleGit).toHaveBeenCalled();
    });

    it('should configure git', async () => {
        await configureGit(mockSimpleGit as any, 'token', 'user', 'email');
        expect(mockSimpleGit.addConfig).toHaveBeenCalledWith('user.name', 'user');
        expect(mockSimpleGit.addConfig).toHaveBeenCalledWith('user.email', 'email');
        expect(mockSimpleGit.checkout).toHaveBeenCalledWith('feature/branch');
        expect(mockSimpleGit.pull).toHaveBeenCalled();
    });

    it('should skip branch checkout and pull for dry runs', async () => {
        await configureGit(mockSimpleGit as any, 'token', 'user', 'email', true);
        expect(mockSimpleGit.fetch).toHaveBeenCalledWith(['--all']);
        expect(mockSimpleGit.checkout).not.toHaveBeenCalled();
        expect(mockSimpleGit.pull).not.toHaveBeenCalled();
        expect(core.info).toHaveBeenCalledWith('[DRY-RUN] Skipping PR branch checkout and pull.');
    });

    it('should get file from default branch', async () => {
        mockSimpleGit.show.mockResolvedValue('content');
        const content = await getFileFromDefaultBranch(mockSimpleGit as any, 'file.txt', 'main');
        expect(content).toBe('content');
        expect(mockSimpleGit.show).toHaveBeenCalledWith(['origin/main:file.txt']);
    });
});
