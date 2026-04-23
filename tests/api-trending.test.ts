import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trendingEntry: { findMany: vi.fn() },
  },
}));

function makeReq(period?: string, ip = `4.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.1`) {
  const url = `http://localhost/api/trending${period !== undefined ? `?period=${period}` : ''}`;
  return new NextRequest(url, {
    method: 'GET',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('GET /api/trending', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trendingEntry.findMany).mockResolvedValue([
      {
        id: 't1', queryHash: 'h', period: 'day', count: 5, lastVerdict: 'UNCERTAIN',
        analysisId: 'a1', updatedAt: new Date('2024-01-01'),
        analysis: { query: 'some trending query text', createdAt: new Date() },
      },
    ] as never);
  });

  it('returns 200 with default period=day', async () => {
    const { GET } = await import('@/app/api/trending/route');
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe('day');
    expect(body.items).toHaveLength(1);
    expect(body.items[0].rank).toBe(1);
  });

  it('accepts period=week and period=month', async () => {
    const { GET } = await import('@/app/api/trending/route');
    for (const p of ['week', 'month']) {
      const res = await GET(makeReq(p));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.period).toBe(p);
    }
  });

  it('returns 400 VALIDATION_ERROR for invalid period', async () => {
    const { GET } = await import('@/app/api/trending/route');
    const res = await GET(makeReq('year'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('falls back to placeholder when analysis is missing', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trendingEntry.findMany).mockResolvedValueOnce([
      {
        id: 't2', queryHash: 'h2', period: 'day', count: 1, lastVerdict: 'UNCERTAIN',
        analysisId: null, updatedAt: new Date(),
        analysis: null,
      },
    ] as never);
    const { GET } = await import('@/app/api/trending/route');
    const res = await GET(makeReq('day'));
    const body = await res.json();
    expect(body.items[0].queryPreview).toBe('ข้อมูลไม่พร้อมใช้งาน');
    expect(body.items[0].analysisId).toBe('');
  });

  it('returns 500 INTERNAL_ERROR when DB throws', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.trendingEntry.findMany).mockRejectedValueOnce(new Error('db'));
    const { GET } = await import('@/app/api/trending/route');
    const res = await GET(makeReq('day'));
    expect(res.status).toBe(500);
  });
});
