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

vi.mock('@/lib/gemini', () => ({
  analyzeTextForFakeNews: vi.fn(),
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

  it('applies a partial-match penalty when similar to a known fake claim', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { analyzeTextForFakeNews } = await import('@/lib/gemini');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.knownFakeClaim.findMany).mockResolvedValueOnce([
      { id: 'k', claim: 'vaccine causes autism in children', claimHash: 'h', verdict: 'DANGEROUS' as never, evidence: 'e', firstSeenAt: new Date(), createdAt: new Date() },
    ]);
    vi.mocked(analyzeTextForFakeNews).mockResolvedValueOnce({
      score: 70, confidence: 80, reasoning: ['g1'], references: [],
    });

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('vaccine causes autism in children and adults');
    expect(result.score).toBeLessThan(70);
    expect(result.reasoning.some((r) => r.includes('คล้าย'))).toBe(true);
  });

  it('falls back to a heuristic reasoning bundle when Gemini returns null', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { analyzeTextForFakeNews } = await import('@/lib/gemini');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.knownFakeClaim.findMany).mockResolvedValueOnce([]);
    vi.mocked(analyzeTextForFakeNews).mockResolvedValueOnce(null);

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('untraceable topic abcdef');
    expect(result.confidence).toBe(30);
    expect(result.references).toEqual([]);
    expect(result.reasoning.length).toBeGreaterThanOrEqual(3);
  });

  it('uses Gemini reasoning and references when available', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { analyzeTextForFakeNews } = await import('@/lib/gemini');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.knownFakeClaim.findMany).mockResolvedValueOnce([]);
    vi.mocked(analyzeTextForFakeNews).mockResolvedValueOnce({
      score: 85, confidence: 90, reasoning: ['gemini-r1'],
      references: [{ sourceName: 'BBC', url: 'https://bbc.com', stance: 'SUPPORTING' as never, excerpt: '', sourceType: 'TRUSTED_MEDIA' as never, credibility: 90, publishedAt: null }],
    });

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('a truly verifiable mundane claim');
    expect(result.score).toBe(85);
    expect(result.references).toHaveLength(1);
    expect(result.references[0].id).toBe('ref-1');
  });

  it('includes Gemini reasoning alongside DB notice when known fake matches', async () => {
    const { prisma } = await import('@/lib/prisma');
    const { analyzeTextForFakeNews } = await import('@/lib/gemini');
    vi.mocked(prisma.knownFakeClaim.findFirst).mockResolvedValueOnce({
      id: 'kf', claim: 'test', claimHash: 'test', verdict: 'DANGEROUS' as never,
      evidence: 'already-debunked', firstSeenAt: new Date(), createdAt: new Date(),
    });
    vi.mocked(analyzeTextForFakeNews).mockResolvedValueOnce({
      score: 5, confidence: 90, reasoning: ['gemini-extra-reasoning'], references: [],
    });

    const { analyzeText } = await import('@/services/text-analyzer');
    const result = await analyzeText('test');
    expect(result.score).toBe(5);
    expect(result.reasoning.some((r) => r.includes('gemini-extra-reasoning'))).toBe(true);
  });
});
