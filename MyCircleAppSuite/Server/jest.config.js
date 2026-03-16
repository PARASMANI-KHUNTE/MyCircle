module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/workers/**',
    '!src/config/**',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
};