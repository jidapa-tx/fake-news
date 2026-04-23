import { PrismaClient } from '@prisma/client';
import { TEST_TAG } from './http';

export const prisma = new PrismaClient();

/**
 * Delete every row created by integration tests.
 * Safe to run repeatedly. Never touches production/seeded data.
 */
export async function cleanupTestRows(): Promise<void> {
  // Reference rows cascade via Analysis deletion, but TrendingEntry keeps analysisId nullable.
  await prisma.trendingEntry.deleteMany({
    where: {
      OR: [
        { analysis: { query: { startsWith: TEST_TAG } } },
        { analysis: { is: null }, queryHash: { startsWith: TEST_TAG } },
      ],
    },
  });
  await prisma.analysis.deleteMany({
    where: {
      OR: [
        { query: { startsWith: TEST_TAG } },
        { query: { contains: TEST_TAG } }, // covers `image:__test__-*.png`
      ],
    },
  });
  await prisma.suspiciousDomain.deleteMany({
    where: { domain: { startsWith: TEST_TAG } },
  });
}
