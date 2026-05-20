import { validateBumpCommand } from './validate-bump-command.js';
import { BUILD_TYPE } from '../types/build-type.js';

describe('validateBumpCommand', () => {
    it('should throw if command is empty', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, '')).toThrow('bump-command cannot be empty');
    });

    it('should throw if @NEW_VERSION@ is missing', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'npm version')).toThrow('must include @NEW_VERSION@');
    });

    it('should validate allowed executables for NPM', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'npm version @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'yarn version @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'pnpm version @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'npx version @NEW_VERSION@')).not.toThrow();
    });

    it('should throw on disallowed executable for NPM', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.NPM, 'make version @NEW_VERSION@')).toThrow('Invalid bump-command executable');
    });

    it('should validate allowed executables for Maven', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.MAVEN, 'mvn set @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.MAVEN, 'mvnw set @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.MAVEN, './mvnw set @NEW_VERSION@')).not.toThrow();
    });

    it('should throw on disallowed executable for Maven', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.MAVEN, 'gradle set @NEW_VERSION@')).toThrow('Invalid bump-command executable');
    });

    it('should validate allowed executables for Python', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.PYTHON, 'poetry version @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.PYTHON, 'python script.py @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.PYTHON, 'toml set @NEW_VERSION@')).not.toThrow();
    });

    it('should throw on disallowed executable for Python (e.g. sed)', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.PYTHON, 'sed -i @NEW_VERSION@')).toThrow('Invalid bump-command executable');
    });

    it('should allow any command for VERSION_FILE', () => {
        expect(() => validateBumpCommand(BUILD_TYPE.VERSION_FILE, 'echo @NEW_VERSION@')).not.toThrow();
        expect(() => validateBumpCommand(BUILD_TYPE.VERSION_FILE, 'sed -i @NEW_VERSION@')).not.toThrow();
    });
});
