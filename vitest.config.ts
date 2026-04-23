import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/integration/**'],
    coverage: {
      provider: 'v8',
      include: ['services/**', 'hooks/**', 'lib/**', 'app/api/**'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'tests/**',
        '**/*.d.ts',
        'lib/prisma.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 80,
        functions: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
