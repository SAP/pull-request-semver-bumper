import { determineVersionLevelFromPRTitle } from './parse-commit.js';

describe('determineVersionLevelFromPRTitle', () => {
    it('should return minor for feat', () => {
        expect(determineVersionLevelFromPRTitle('feat: add new feature')).toBe('minor');
    });

    it('should return patch for fix', () => {
        expect(determineVersionLevelFromPRTitle('fix: bug fix')).toBe('patch');
    });

    it('should return patch for chore', () => {
        expect(determineVersionLevelFromPRTitle('chore: cleanup')).toBe('patch');
    });

    it('should return major for breaking change via !', () => {
        expect(determineVersionLevelFromPRTitle('feat!: breaking feature')).toBe('major');
    });

    it('should return major for breaking change via body/footer text in title (simulated)', () => {
        // The parser library handles this, but usually BREAKING CHANGE is in body.
        // If the title itself contains BREAKING CHANGE (unlikely but possible in squash merges), it might trigger.
        // However, our logic checks: subject.includes('BREAKING CHANGE')
        expect(determineVersionLevelFromPRTitle('chore: BREAKING CHANGE: drop support')).toBe('major');
    });
});
