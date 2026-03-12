module.exports = {
  roots: ['<rootDir>/tests'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/renderer/index.tsx',
    '!src/renderer/**/*.tsx',
    '!src/preload.ts',
    '!src/renderer/shims/global.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      lines: 90,
      functions: 85,
    },
  },
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testPathIgnorePatterns: ['\\.dom\\.test\\.js$'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
        }],
      },
    },
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.dom.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/support/setup.dom.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/tests/support/style.mock.js',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.json',
        }],
      },
    },
  ],
};
