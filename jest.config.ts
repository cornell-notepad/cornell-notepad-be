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
  restoreMocks: true
}

export default config