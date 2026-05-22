export function formatVersionBumpCommitMessage(
    commitMessage: string,
    newVersion: string
): string {
    const message = commitMessage.trim();

    if (!message) {
        return `chore: bump version to ${newVersion}`;
    }

    return message.split('@NEW_VERSION@').join(newVersion);
}
