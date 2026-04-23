import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trustedSource: { findFirst: vi.fn() },
    suspiciousDomain: { findFirst: vi.fn() },
  },
}));

describe('analyzeSource', () => {
  it('returns safe for trusted source domain', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce({
      id: '1', name: 'WHO', nameTh: null, domain: 'who.int',
      type: 'GOV' as never, credibility: 93, language: 'en',
      isActive: true, createdAt: new Date(),
    });

    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://who.int/news');
    expect(result.riskLevel).toBe('safe');
  });

  it('returns dangerous for known suspicious domain', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce({
      id: '2', domain: 'news-fake-th.com',
      reason: 'ข่าวปลอม', riskLevel: 'high', addedAt: new Date(),
    });

    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://news-fake-th.com/article');
    expect(result.riskLevel).toBe('dangerous');
    expect(result.isKnownPhishing).toBe(true);
  });

  it('returns suspicious for .xyz domain', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce(null);

    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://random-site.xyz/article');
    expect(result.riskLevel).toBe('suspicious');
  });

  it('handles invalid URL gracefully', async () => {
    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('not-a-url');
    expect(result.domain).toBe('unknown');
  });

  it('returns domain name correctly', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce(null);

    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://www.example.com/path');
    expect(result.domain).toBe('example.com');
  });

  it('flags .info domains as suspicious', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce(null);
    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://foo.info/a');
    expect(result.riskLevel).toBe('suspicious');
    expect(result.riskReasonsTh.length).toBeGreaterThan(0);
  });

  it('returns safe for unknown .com domains with no suspicious signal', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce(null);
    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://example.com/a');
    expect(result.riskLevel).toBe('safe');
  });

  it('maps non-high suspicious domain riskLevel to "suspicious"', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trustedSource.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.suspiciousDomain.findFirst).mockResolvedValueOnce({
      id: 's', domain: 'borderline.com', reason: 'สงสัย', riskLevel: 'medium', addedAt: new Date(),
    });
    const { analyzeSource } = await import('@/services/source-analyzer');
    const result = await analyzeSource('https://borderline.com/a');
    expect(result.riskLevel).toBe('suspicious');
    expect(result.isKnownPhishing).toBe(true);
  });
});
