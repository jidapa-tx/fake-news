import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

// Load .env.local so Prisma sees DATABASE_URL
const envPath = path.resolve(__dirname, '.env.local');
const env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
    if (m) env[m[1]] = m[2];
  }
}

export default defineConfig({
  test: {
    env,
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 30_000,
    pool: 'forks',
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
