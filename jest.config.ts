import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(?:.pnpm/)?uuid)'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^uuid$': require.resolve('uuid'),
  },
};

export default config;
