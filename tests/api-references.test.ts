import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reference: { findMany: vi.fn() },
    analysis: { findUnique: vi.fn() },
  },
}));

function makeReq(ip = `5.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.1`) {
  return new NextRequest('http://localhost/api/references/abc', {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('GET /api/references/[analysisId]', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 200 with references when they exist', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.reference.findMany).mockResolvedValueOnce([
      { id: 'r1', analysisId: 'abc', sourceName: 'BBC', url: 'https://bbc.com', stance: 'OPPOSING', excerpt: '', credibility: 90, sourceType: 'TRUSTED_MEDIA', publishedAt: null } as never,
    ]);
    const { GET } = await import('@/app/api/references/[analysisId]/route');
    const res = await GET(makeReq(), { params: Promise.resolve({ analysisId: 'abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it('returns empty array when analysis exists but has no references', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.reference.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.analysis.findUnique).mockResolvedValueOnce({ id: 'abc' } as never);
    const { GET } = await import('@/app/api/references/[analysisId]/route');
    const res = await GET(makeReq(), { params: Promise.resolve({ analysisId: 'abc' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns 404 NOT_FOUND when analysis does not exist', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.reference.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.analysis.findUnique).mockResolvedValueOnce(null);
    const { GET } = await import('@/app/api/references/[analysisId]/route');
    const res = await GET(makeReq(), { params: Promise.resolve({ analysisId: 'missing' }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 INTERNAL_ERROR when DB throws', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.reference.findMany).mockRejectedValueOnce(new Error('db'));
    const { GET } = await import('@/app/api/references/[analysisId]/route');
    const res = await GET(makeReq(), { params: Promise.resolve({ analysisId: 'abc' }) });
    expect(res.status).toBe(500);
  });

  it('returns 429 RATE_LIMITED after exceeding limit', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.reference.findMany).mockResolvedValue([]);
    vi.mocked(prisma.analysis.findUnique).mockResolvedValue({ id: 'x' } as never);
    const { GET } = await import('@/app/api/references/[analysisId]/route');
    const ip = '8.8.8.8';
    for (let i = 0; i < 30; i++) {
      await GET(makeReq(ip), { params: Promise.resolve({ analysisId: 'x' }) });
    }
    const res = await GET(makeReq(ip), { params: Promise.resolve({ analysisId: 'x' }) });
    expect(res.status).toBe(429);
  });
});
