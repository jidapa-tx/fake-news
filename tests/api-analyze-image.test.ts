// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { VerdictLevel } from '@/types';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analysis: { create: vi.fn() },
  },
}));

vi.mock('@/services/image-analyzer', () => ({
  analyzeImage: vi.fn(),
}));

function makeReq(form: FormData, ip = `2.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.1`) {
  return new NextRequest('http://localhost/api/analyze/image', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body: form,
  });
}

function imageFile(size: number, type = 'image/png', name = 'pic.png') {
  return new File([new Uint8Array(size)], name, { type });
}

describe('POST /api/analyze/image', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.analysis.create).mockResolvedValue({
      id: 'img1', createdAt: new Date(),
    } as never);
    const { analyzeImage } = await import('@/services/image-analyzer');
    vi.mocked(analyzeImage).mockResolvedValue({
      verdict: VerdictLevel.UNCERTAIN,
      score: 50,
      confidence: 50,
      reasoning: ['r'],
      aiDetection: { probability: 50, detectedModel: 'unknown', confidence: 50 },
      metadata: { hasExif: false },
      reverseImageSearch: { matches: [] },
    } as never);
  });

  it('returns 200 with analysisId for a valid image', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(1024));
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysisId).toBe('img1');
  });

  it('returns 400 VALIDATION_ERROR when image field is missing', async () => {
    const fd = new FormData();
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 FILE_TOO_LARGE for image > 10MB', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(10 * 1024 * 1024 + 1));
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    const body = await res.json();
    expect(body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('returns 400 UNSUPPORTED_TYPE for gif file', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(1024, 'image/gif', 'pic.gif'));
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    const body = await res.json();
    expect(body.error.code).toBe('UNSUPPORTED_TYPE');
  });

  it('accepts an optional caption', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(1024));
    fd.set('caption', 'this is context');
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(200);
  });

  it('returns 400 VALIDATION_ERROR for caption > 1000 chars', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(1024));
    fd.set('caption', 'x'.repeat(1001));
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 INTERNAL_ERROR when analyzer throws', async () => {
    const fd = new FormData();
    fd.set('image', imageFile(1024));
    const { analyzeImage } = await import('@/services/image-analyzer');
    vi.mocked(analyzeImage).mockRejectedValueOnce(new Error('gemini down'));
    const { POST } = await import('@/app/api/analyze/image/route');
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
