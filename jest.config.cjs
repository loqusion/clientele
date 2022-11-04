/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  automock: false,
  resetMocks: false,
  setupFiles: ['<rootDir>/setup-jest.cjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@clientelejs/core$': '<rootDir>/packages/clientele-core/lib/index.ts',
    '^@clientelejs/request$':
      '<rootDir>/packages/clientele-request/lib/index.ts',
    '^@clientelejs/shared$': '<rootDir>/packages/clientele-shared/lib/index.ts',
  },
  transformIgnorePatterns: ['.*/node_modules/(?!universal-user-agent)'],
}
