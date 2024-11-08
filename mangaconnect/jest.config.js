module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
}; 