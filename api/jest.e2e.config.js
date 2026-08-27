module.exports = {
  testEnvironment: "node",
  rootDir: __dirname,
  testMatch: ["<rootDir>/test/e2e/**/*.e2e.spec.ts"],
  moduleNameMapper: {
    "^@canmingir/link-express/event/client$":
      "<rootDir>/test/e2e/harness/eventClientMock.ts",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: {
          module: "commonjs",
          target: "es2022",
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
  testTimeout: 900_000,
  maxWorkers: 1,
  slowTestThreshold: 300,
  forceExit: true,
};
