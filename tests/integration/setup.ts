import { beforeAll, afterAll } from 'vitest';
import { prisma, cleanupTestRows } from './helpers/db';

beforeAll(async () => {
  const baseUrl = process.env.INTEGRATION_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/health`).catch(() => null);
  if (!res || !res.ok) {
    throw new Error(
      `Dev server not reachable at ${baseUrl}/api/health — run \`docker compose up\` or \`npm run dev\` first.`
    );
  }
  await cleanupTestRows();
});

afterAll(async () => {
  await cleanupTestRows();
  await prisma.$disconnect();
});
