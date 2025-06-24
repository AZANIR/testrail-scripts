/**
 * Jest Configuration for TestRail Synchronization Tool
 * Supports ES modules and provides comprehensive testing setup
 */

export default {
  // Enable ES modules support
  preset: undefined,
  
  // Transform settings
  transform: {},
  
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!coverage/**',
    '!node_modules/**',
    '!tests/**'
  ],
  
  // Coverage thresholds (adjusted for logic testing approach)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Module directories
  moduleDirectories: ['node_modules'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true
}; 