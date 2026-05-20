import { BUILD_TYPE } from "../types/build-type.js";
import * as core from "@actions/core";

export function validateBumpCommand(buildType: BUILD_TYPE, bumpCommand: string): void {
    if (!bumpCommand || bumpCommand.trim() === "") {
        throw new Error("bump-command cannot be empty.");
    }

    if (!bumpCommand.includes("@NEW_VERSION@")) {
        throw new Error("bump-command must include @NEW_VERSION@ placeholder.");
    }

    const parts = bumpCommand.trim().split(/\s+/);
    const cmd = parts[0];

    if (!cmd) {
        throw new Error(`Invalid bump-command: no executable found in "${bumpCommand}".`);
    }

    switch (buildType) {
        case BUILD_TYPE.MAVEN:
            validateExecutable(cmd, ["mvn", "mvnw", "./mvnw"], buildType);
            break;

        case BUILD_TYPE.NPM:
            validateExecutable(cmd, ["npm", "npx", "pnpm", "yarn"], buildType);
            break;

        case BUILD_TYPE.PYTHON:
            validateExecutable(
                cmd,
                ["poetry", "toml", "python", "python3"],
                buildType
            );
            break;

        case BUILD_TYPE.VERSION_FILE:
            // very permissive, no special exec requirements
            return;

        default:
            throw new Error(`Unsupported build type: ${buildType}`);
    }

    core.debug(`bump-command validated for ${buildType}: ${cmd}`);
}

/**
 * Validate that the executable is allowed for the given build type.
 */
function validateExecutable(cmd: string, allowed: string[], buildType: BUILD_TYPE) {
    if (allowed.includes(cmd)) return;

    // Some commands like "sh -c ..." aren't parsed cleanly.
    if (cmd === "sh" || cmd === "bash") {
        core.warning(`Using '${cmd}' wrapper; ensure inner command matches expected tool for ${buildType}.`);
        return;
    }

    throw new Error(
        `Invalid bump-command executable for ${buildType}: "${cmd}". Allowed executables: ${allowed.join(", ")}`
    );
}
