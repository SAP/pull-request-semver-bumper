import { bumpVersion } from './bump-version.js';

describe('bumpVersion', () => {
    it('should bump major version', () => {
        expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should bump minor version', () => {
        expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should bump patch version', () => {
        expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('should handle versions with v prefix if semver supports it (it usually strips it, but lets check behavior)', () => {
        // semver.inc handles 'v1.2.3' by returning '1.2.4' usually
        expect(bumpVersion('v1.2.3', 'patch')).toBe('1.2.4');
    });

    it('should throw error on invalid version', () => {
        expect(() => bumpVersion('invalid', 'patch')).toThrow();
    });
});
