module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    '.github/workflows/**/*.yml',
    '.github/workflows/**/*.yaml',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json', 'yml', 'yaml'],
  verbose: true,
  // Transform configuration for TypeScript
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
