import { jest } from '@jest/globals';
import { parsePom } from './pom.js';

// Mock pom-parser since it's an external dependency that might read files or behave complexly
jest.mock('pom-parser', () => ({
    parse: jest.fn((opts: any, cb: any) => {
        if (opts.xmlContent === '<invalid>') {
            cb(new Error('Invalid XML'), null);
        } else {
            cb(null, { pomObject: { project: { version: '1.0.0' } } });
        }
    })
}));

describe('parsePom', () => {
    it('should parse valid XML string', async () => {
        const result = await parsePom('<project>...</project>');
        expect(result.pomObject.project.version).toBe('1.0.0');
    });

    it('should reject on error', async () => {
        await expect(parsePom('<invalid>')).rejects.toThrow('Invalid XML');
    });
});
