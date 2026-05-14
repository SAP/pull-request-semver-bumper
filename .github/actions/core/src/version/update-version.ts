/**
 * Utilities for updating a local project version across multiple build ecosystems (Maven, NPM,
 * generic VERSION file, Python). The core exported function constructs a version bump command
 * from a template, injects the requested version, adjusts ecosystem-specific flags, and executes
 * the command inside the directory that contains the target version file.
 */

import { exec } from "child_process";
import * as core from "@actions/core";
import { BUILD_TYPE } from "../types/build-type.js";
import * as path from "path";
import { executeCommand } from "../utils/executeCommand.js";

/**
 * Update the local version for a given build system by executing a templated bump command.
 *
 * Command template placeholders:
 *  - @NEW_VERSION@ -> replaced with the provided newVersion string for all build types.
 *  - @PYPROJECT@  -> replaced with the Python project file name (only for BUILD_TYPE.PYTHON).
 *
 * Behavior per build type:
 *  - MAVEN: If the target POM file does not have the standard name `pom.xml`, appends `-f <filename>`.
 *  - NPM: Ensures `--no-git-tag-version` (avoid creating a git tag) and `--allow-same-version` if not already present.
 *  - VERSION_FILE: Executes the raw command after placeholder substitution (generic use case).
 *  - PYTHON: Also substitutes @PYPROJECT@ for commands that need the file reference.
 *
 * Logging: Emits info-level logs indicating the final command and working directory; stderr/stdout are
 * provided via debug/error channels depending on outcome.
 *
 * @param buildType Build system type discriminator.
 * @param bumpCommand A shell command template containing placeholders (e.g. `npm version @NEW_VERSION@`).
 * @param newVersion The version string to inject into the command template.
 * @param files Object containing paths to the relevant version files for each build type.
 * @returns Promise that resolves with stdout on success; rejects with the underlying exec error on failure.
 * @throws Error if an unsupported build type is supplied.
 */
export function updateLocalVersion(
    buildType: BUILD_TYPE,
    bumpCommand: string,
    newVersion: string,
    files: { pom: string; pkg: string; version: string; py: string }
): Promise<string> {
    // Accumulators for command construction
    let command = "";
    let cmd = "";
    let args: string[] = [];
    let filePath = "";
    let fileDir = "";
    let fileName = "";

    // --------------------------
    // Determine which file path is relevant for this build type
    // --------------------------
    switch (buildType) {
        case BUILD_TYPE.MAVEN:
            filePath = files.pom;
            break;
        case BUILD_TYPE.NPM:
            filePath = files.pkg;
            break;
        case BUILD_TYPE.VERSION_FILE:
            filePath = files.version;
            break;
        case BUILD_TYPE.PYTHON:
            filePath = files.py;
            break;
        default:
            throw new Error(`Unsupported build type: ${buildType}`);
    }

    // Extract directory + filename for later path-sensitive command adjustments
    fileDir = path.dirname(filePath);
    fileName = path.basename(filePath);

    // --------------------------
    // Build bump command (tokenize executable + args for later logging/manipulation)
    // --------------------------
    switch (buildType) {
        case BUILD_TYPE.MAVEN: {
            command = bumpCommand.replace("@NEW_VERSION@", newVersion);
            [cmd, ...args] = command.split(/\s+/);

            // Add custom -f <pom> if needed for non-standard POM filenames
            if (fileName !== "pom.xml") {
                args.push("-f", fileName);
            }
            break;
        }

        case BUILD_TYPE.NPM: {
            command = bumpCommand.replace("@NEW_VERSION@", newVersion);
            [cmd, ...args] = command.split(/\s+/);

            // Ensure consistent npm behavior (avoid tag + allow same version idempotency)
            if (!args.includes("--no-git-tag-version")) {
                args.push("--no-git-tag-version");
            }
            if (!args.includes("--allow-same-version")) {
                args.push("--allow-same-version");
            }
            break;
        }

        case BUILD_TYPE.VERSION_FILE: {
            command = bumpCommand.replace("@NEW_VERSION@", newVersion);
            [cmd, ...args] = command.split(/\s+/);
            break;
        }

        case BUILD_TYPE.PYTHON: {
            command = bumpCommand
                .replace("@NEW_VERSION@", newVersion);

            [cmd, ...args] = command.split(/\s+/);
            break;
        }
    }

    // --------------------------
    // Log command context for debugging
    // --------------------------
    core.info(`bumping command: ${cmd} ${args.join(" ")}`);
    core.info(`running in directory: ${fileDir}`);

    const finalCmd = `cd ${fileDir} && ${cmd} ${args.join(" ")}`;

    // --------------------------
    // Execute bump command in the correct directory
    // --------------------------
    return executeCommand(finalCmd);
}
