module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      forceExit: true,
      testMatch: ['**/*.test.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      "transformIgnorePatterns": [
            "node_modules/(?!@ngrx|(?!Injectable.js)|ng-dynamic)"
          ]
    };