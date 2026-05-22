import { formatVersionBumpCommitMessage } from './commit-message.js';

describe('formatVersionBumpCommitMessage', () => {
    it('replaces the new version placeholder in the configured commit message', () => {
        expect(formatVersionBumpCommitMessage('version bump to @NEW_VERSION@', '1.2.3')).toBe('version bump to 1.2.3');
    });

    it('uses a configured commit message without a placeholder as-is', () => {
        expect(formatVersionBumpCommitMessage('Release 1.2.3', '2.0.0')).toBe('Release 1.2.3');
    });

    it('trims the configured commit message', () => {
        expect(formatVersionBumpCommitMessage('  release: @NEW_VERSION@  ', '2.0.0')).toBe('release: 2.0.0');
    });

    it('falls back to the previous commit message prefix when input is empty', () => {
        expect(formatVersionBumpCommitMessage('', '3.0.0')).toBe('chore: bump version to 3.0.0');
    });
});
