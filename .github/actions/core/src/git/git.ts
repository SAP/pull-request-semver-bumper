import { simpleGit, SimpleGit } from 'simple-git';
import * as fs from "fs";
import * as core from "@actions/core";

export async function configureGit(
    git: SimpleGit,
    token: string,
    gitUsername: string,
    gitUserEmail: string
): Promise<void> {

    // -------------------------------
    // Restore original logic:
    // If NOT inside a repo, clone it
    // -------------------------------
    const serverUrl = process.env.GITHUB_SERVER_URL;       // works on GHES & GitHub.com
    const repo = process.env.GITHUB_REPOSITORY;            // owner/repo

    if (!serverUrl || !repo) {
        throw new Error(
            `Missing GITHUB_SERVER_URL or GITHUB_REPOSITORY: cannot set git remote dynamically`
        );
    }

    const baseHost = `${serverUrl.replace(/^https?:\/\//, '')}`;
    const remoteUrl = `https://x-access-token:${token}@${baseHost}/${process.env.GITHUB_REPOSITORY}.git`;
    const prBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
    core.debug("prBranch:" + prBranch)
    if (!prBranch) {
        throw new Error('PR branch (head.ref) not found in environment variables!!');
    }


    if (!fs.existsSync('.git')) {
        core.info('No .git detected, cloning repository...');
        await git.clone(remoteUrl, '.');
    }

    // Ensure origin remote points to authenticated URL (set-url if exists, add if not)
    try {
        await git.remote(['set-url', 'origin', remoteUrl]);
    } catch (e) {
        core.debug('origin remote missing, adding it');
        await git.addRemote('origin', remoteUrl);
    }

    await git.fetch(['--all']);
    await git.checkout(prBranch);
    await git.pull();
    await git.addConfig('user.email', gitUserEmail);
    await git.addConfig('user.name', gitUsername);

}


export async function getFileFromDefaultBranch(
    git: SimpleGit,
    filePath: string,
    defaultBranch: string
): Promise<string> {
    try {
        return await git.show([`origin/${defaultBranch}:${filePath}`]);
    } catch {
        throw new Error(`Failed to fetch ${filePath} from default branch`);
    }
}

export const createGit = (): SimpleGit => simpleGit();
