module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.test.cjs' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(pixi\\.js|@pixi/layout|yoga-layout|earcut|three)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle ESM-style .js imports by mapping to .ts files
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock @pixi/layout since yoga-layout doesn't work in Jest's CommonJS environment
    '^@pixi/layout$': '<rootDir>/tests/__mocks__/@pixi/layout.ts'
  },
  testTimeout: 10000
};