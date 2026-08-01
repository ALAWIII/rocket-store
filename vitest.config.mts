import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  oxc: false,
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    pool: 'forks',
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
