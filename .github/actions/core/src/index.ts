import * as core from '@actions/core';
import { createGit, configureGit } from './git/git';
import { BUILD_TYPE } from './types/build-type';
import { determineVersionLevelFromPRTitle } from './utils/parse-commit';
import { bumpVersion } from './version/bump-version';
import { updateLocalVersion } from './version/update-version';
import { fetchCurrentVersion } from './version/fetch-version';
import { validateBumpCommand } from "./version/validate-bump-command";
import fs from "fs";
import {executeCommand} from "./utils/executeCommand";

async function run(): Promise<void> {
    try {
        const git = createGit();
        let command = core.getInput('bump-command').trim() || '';
        const postCommand = core.getInput('post-command').trim() || '';

        const buildType = core.getInput('build-type') as BUILD_TYPE;
        const files = {
            pom: core.getInput('pom-file') || 'pom.xml',
            pkg: core.getInput('package-json-file') || 'package.json',
            version: core.getInput('version-file') || 'VERSION',
            py: core.getInput('pyproject-file') || 'pyproject.toml'
        };

        const eventPath = process.env.GITHUB_EVENT_PATH;
        if (!eventPath) {
            throw new Error('GITHUB_EVENT_PATH is not defined.');
        }
        const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

        validateBumpCommand(buildType,command)

        await configureGit(
            git,
            core.getInput('token'),
            core.getInput('git-username'),
            core.getInput('git-useremail')
        );

        const prTitle = event.pull_request?.title;
        if (!prTitle) {
            throw new Error('Pull request title not found in event payload.');
        }

        const defaultBranch = event?.pull_request?.base?.ref;
        core.info(`Using PR base branch as default branch: ${defaultBranch}`);

        const versionPropertyPath = core.getInput('version-property-path')

        const currentVersion = await fetchCurrentVersion(git, buildType, files, defaultBranch,versionPropertyPath);
        const level = determineVersionLevelFromPRTitle(prTitle);
        const newVersion = bumpVersion(currentVersion, level);
        core.setOutput('bump', level);

        await updateLocalVersion(
            buildType,
            core.getInput('bump-command') || '',
            newVersion,
            files,
        );

        if (postCommand) {
            core.info(`Executing post-command: ${postCommand}`);
            await executeCommand(postCommand.trim());
        }

        const status = await git.status();
        core.info("result:" + JSON.stringify(status));

        if (status.modified.length > 0 ) {
            await git.add('.');
            await git.commit(`chore: bump version to ${newVersion}`);

            const dryRun = core.getInput('dry-run') === 'true';
            if (dryRun) {
                core.info(`[DRY-RUN] Would push changes to origin/${core.getInput('pr-branch')}`);
            } else {
                await git.push('origin', core.getInput('pr-branch'));
            }

            core.summary.addDetails("Version Bump", `Bumped version from ${currentVersion} to ${newVersion}`);
            core.setOutput('new-version', newVersion);
            core.setOutput('bumped', true);
        } else {
            core.info('No changes detected, skipping commit and push.');
            core.setOutput('bumped', false);
        }

    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
