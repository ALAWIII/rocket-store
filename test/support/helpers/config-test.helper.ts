import { TEST_ENV } from './env-test-values';

/// responsible for mocking and overriding ConfigService for every single test.
export function createConfigServiceMock(
  overrides: Partial<Record<keyof typeof TEST_ENV, string>> = {},
) {
  const values = { ...TEST_ENV, ...overrides };

  return {
    get: vi.fn((key: string) => values[key as keyof typeof values]),
    getOrThrow: vi.fn((key: string) => {
      const value = values[key as keyof typeof values];
      if (value == null) throw new Error(`Missing config key: ${key}`);
      return value;
    }),
  };
}
export type ConfigServiceMock = ReturnType<typeof createConfigServiceMock>;
