export function formatVersionBumpCommitMessage(
    commitMessagePrefix: string,
    newVersion: string
): string {
    const prefix = commitMessagePrefix.trim() || 'chore: bump version to';
    return `${prefix} ${newVersion}`;
}
