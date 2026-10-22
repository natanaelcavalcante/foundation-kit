import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: { provider: 'v8', include: ['src/**'], exclude: ['src/index.ts', 'src/use-case.ts', 'src/ports/**'], thresholds: { lines: 100, branches: 100 } },
  },
});
