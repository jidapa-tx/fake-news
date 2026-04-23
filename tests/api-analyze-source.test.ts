import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/services/source-analyzer', () => ({
  analyzeSource: vi.fn(),
}));

function makeReq(body: unknown, ip = `3.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.1`) {
  return new NextRequest('http://localhost/api/analyze/source', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/analyze/source', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { analyzeSource } = await import('@/services/source-analyzer');
    vi.mocked(analyzeSource).mockResolvedValue({
      domain: 'example.com',
      riskLevel: 'suspicious',
      isKnownPhishing: false,
    } as never);
  });

  it('returns 200 with source analysis for a valid URL', async () => {
    const { POST } = await import('@/app/api/analyze/source/route');
    const res = await POST(makeReq({ url: 'https://example.com/x' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toBe('example.com');
    expect(body.socialAccountAnalysis.isMock).toBe(true);
  });

  it('returns 400 INVALID_URL when url is missing/not a URL', async () => {
    const { POST } = await import('@/app/api/analyze/source/route');
    const res = await POST(makeReq({ url: 'nope' }));
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_URL');
  });

  it('returns 400 VALIDATION_ERROR for malformed JSON', async () => {
    const { POST } = await import('@/app/api/analyze/source/route');
    const res = await POST(makeReq('{bad'));
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 INTERNAL_ERROR when analyzer throws', async () => {
    const { analyzeSource } = await import('@/services/source-analyzer');
    vi.mocked(analyzeSource).mockRejectedValueOnce(new Error('down'));
    const { POST } = await import('@/app/api/analyze/source/route');
    const res = await POST(makeReq({ url: 'https://example.com/z' }));
    expect(res.status).toBe(500);
  });

  it('returns 429 RATE_LIMITED after exceeding limit', async () => {
    const { POST } = await import('@/app/api/analyze/source/route');
    const ip = '7.7.7.7';
    for (let i = 0; i < 30; i++) {
      await POST(makeReq({ url: 'https://a.com' }, ip));
    }
    const res = await POST(makeReq({ url: 'https://a.com' }, ip));
    expect(res.status).toBe(429);
  });
});
