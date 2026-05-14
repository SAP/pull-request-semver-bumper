export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    verbose: true,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'CommonJS',
                moduleResolution: 'node16',
                target: 'ES2019',
                esModuleInterop: true,
            },
        }],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@actions/core$': '<rootDir>/__mocks__/@actions/core.ts',
    },
};
