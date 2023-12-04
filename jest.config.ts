import type {Config} from "jest"

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/test/**/*.test.ts"],
  coveragePathIgnorePatterns: [
    "build",
    "coverage",
    "node_modules",
    "test"
  ],
  restoreMocks: true,
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
}

export default config