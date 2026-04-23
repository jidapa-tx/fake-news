import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreToVerdict, VerdictLevel } from '@/types';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    knownFakeClaim: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/lib/hash', () => ({
  hashQuery: (s: string) => s,
}));

describe('scoreToVerdict', () => {
  it('returns DANGEROUS for score 0', () => {
    expect(scoreToVerdict(0)).toBe(VerdictLevel.DANGEROUS);
  });

  it('returns DANGEROUS for score 20', () => {
    expect(scoreToVerdict(20)).toBe(VerdictLevel.DANGEROUS);
  });

  it('returns SUSPICIOUS for score 21', () => {
    expect(scoreToVerdict(21)).toBe(VerdictLevel.SUSPICIOUS);
  });

  it('returns UNCERTAIN for score 50', () => {
    expect(scoreToVerdict(50)).toBe(VerdictLevel.UNCERTAIN);
  });

  it('returns LIKELY_TRUE for score 70', () => {
    expect(scoreToVerdict(70)).toBe(VerdictLevel.LIKELY_TRUE);
  });

  it('returns VERIFIED for score 100', () => {
    expect(scoreToVerdict(100)).toBe(VerdictLevel.VERIFIED);
  });
});

describe('analyzeText', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns DANGEROUS verdict for known fake claims', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce({
      id: '1',
      claim: 'test',
      claimHash: 'test',
      verdict: 'DANGEROUS' as never,
      evidence: 'test evidence',
      firstSeenAt: new Date(),
      createdAt: new Date(),
    });

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('test');
    expect(result.verdict).toBe(VerdictLevel.DANGEROUS);
    expect(result.confidence).toBe(99);
  });

  it('returns reasoning array with at least 3 items for known fake', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce({
      id: '2',
      claim: 'test2',
      claimHash: 'test2',
      verdict: 'SUSPICIOUS' as never,
      evidence: 'test evidence 2',
      firstSeenAt: new Date(),
      createdAt: new Date(),
    });

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('test2');
    expect(result.reasoning.length).toBeGreaterThanOrEqual(3);
  });

  it('returns neutral score for unknown text', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.knownFakeClaim.findMany).mockResolvedValueOnce([]);

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('completely unknown text that is not fake');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
