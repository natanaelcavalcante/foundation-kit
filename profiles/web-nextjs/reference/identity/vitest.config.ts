import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@app/kernel': fileURLToPath(new URL('../../kernel/src/index.ts', import.meta.url)) } },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/index.ts', 'src/aplicacao/portas.ts', 'src/infra/prisma/**'],
      thresholds: { lines: 90, branches: 85 },
    },
  },
});
