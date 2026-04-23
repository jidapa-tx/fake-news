import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('GET /api/health', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 200 status=ok when DB query succeeds', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }] as never);
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
  });

  it('returns 503 status=error when DB query throws', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('no db'));
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.db).toBe('disconnected');
  });

  it('always includes an ISO timestamp', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([] as never);
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    const body = await res.json();
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  it('reports disconnected state with timestamp even on failure', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('x'));
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
  });

  it('is a GET-only endpoint responding without input', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([] as never);
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res).toBeInstanceOf(Response);
  });
});
