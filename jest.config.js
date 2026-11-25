module.exports = {
  preset: "jest-expo",
  clearMocks: true,
  testTimeout: 30000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};
