import { describe, it, expect } from 'vitest';
import { errorResponse } from '@/lib/errors';

async function readBody(res: Response) {
  return (await res.json()) as { error: { code: string; message_th: string; message_en: string } };
}

describe('errorResponse', () => {
  it('returns 400 with VALIDATION_ERROR payload by default', async () => {
    const res = errorResponse('VALIDATION_ERROR');
    expect(res.status).toBe(400);
    const body = await readBody(res);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message_th).toBeTruthy();
    expect(body.error.message_en).toBeTruthy();
  });

  it('respects custom status code', async () => {
    const res = errorResponse('RATE_LIMITED', 429);
    expect(res.status).toBe(429);
    const body = await readBody(res);
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it.each([
    'TEXT_TOO_LONG',
    'INVALID_URL',
    'FILE_TOO_LARGE',
    'UNSUPPORTED_TYPE',
    'GEMINI_ERROR',
    'NOT_FOUND',
    'INTERNAL_ERROR',
  ])('returns complete envelope for %s', async (code) => {
    const res = errorResponse(code);
    const body = await readBody(res);
    expect(body.error.code).toBe(code);
    expect(typeof body.error.message_th).toBe('string');
    expect(typeof body.error.message_en).toBe('string');
  });

  it('falls back to INTERNAL_ERROR payload for unknown codes', async () => {
    const res = errorResponse('SOMETHING_UNLISTED', 500);
    expect(res.status).toBe(500);
    const body = await readBody(res);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('uses bilingual (Thai + English) messages', async () => {
    const res = errorResponse('FILE_TOO_LARGE');
    const body = await readBody(res);
    expect(body.error.message_th).toContain('10');
    expect(body.error.message_en.toLowerCase()).toContain('10 mb');
  });
});
