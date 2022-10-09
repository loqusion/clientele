/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  automock: false,
  resetMocks: false,
  setupFiles: ['<rootDir>/setup-jest.cjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: ['.*/node_modules/(?!universal-user-agent)'],
}
