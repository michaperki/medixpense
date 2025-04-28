/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: 'apps/api',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: './tsconfig.json'
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@packages/database$': '<rootDir>/../../packages/database/lib/prisma.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFiles: ['../../jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts']
};
