import { formatVersionBumpCommitMessage } from './commit-message.js';

describe('formatVersionBumpCommitMessage', () => {
    it('appends the new version to the configured commit message prefix', () => {
        expect(formatVersionBumpCommitMessage('version bump to', '1.2.3')).toBe('version bump to 1.2.3');
    });

    it('trims the configured commit message prefix', () => {
        expect(formatVersionBumpCommitMessage('  release:  ', '2.0.0')).toBe('release: 2.0.0');
    });

    it('falls back to the previous commit message prefix when input is empty', () => {
        expect(formatVersionBumpCommitMessage('', '3.0.0')).toBe('chore: bump version to 3.0.0');
    });
});
