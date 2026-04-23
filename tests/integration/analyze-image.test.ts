import { describe, it, expect } from 'vitest';
import { postForm, expectErrorShape } from './helpers/http';
import { prisma } from './helpers/db';

// Smallest valid 1x1 PNG
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';

function pngBuffer(): Buffer {
  return Buffer.from(TINY_PNG_B64, 'base64');
}

function tenMegPlusBuffer(): Buffer {
  return Buffer.alloc(11 * 1024 * 1024, 0);
}

describe('POST /api/analyze/image', () => {
  it('400 when image field missing', async () => {
    const form = new FormData();
    const { status, body } = await postForm('/api/analyze/image', form);
    expect(status).toBe(400);
    expectErrorShape(body, 'VALIDATION_ERROR');
  });

  it('400 when file exceeds 10 MB', async () => {
    const form = new FormData();
    const big = tenMegPlusBuffer();
    form.append(
      'image',
      new Blob([new Uint8Array(big)], { type: 'image/png' }),
      '__test__-big.png'
    );
    const { status, body } = await postForm('/api/analyze/image', form);
    expect(status).toBe(400);
    expectErrorShape(body, 'FILE_TOO_LARGE');
  });

  it('400 when MIME is text/plain', async () => {
    const form = new FormData();
    form.append(
      'image',
      new Blob(['not-an-image'], { type: 'text/plain' }),
      '__test__-fake.txt'
    );
    const { status, body } = await postForm('/api/analyze/image', form);
    expect(status).toBe(400);
    expectErrorShape(body, 'UNSUPPORTED_TYPE');
  });

  it('200 for valid PNG — persists Analysis row', async () => {
    const form = new FormData();
    const buf = pngBuffer();
    form.append(
      'image',
      new Blob([new Uint8Array(buf)], { type: 'image/png' }),
      '__test__-pixel.png'
    );
    const { status, body } = await postForm('/api/analyze/image', form);
    expect(status).toBe(200);

    const b = body as {
      analysisId: string;
      verdict: string;
      score: number;
      aiDetection: { aiProbability: number };
      metadata: unknown;
    };
    expect(typeof b.analysisId).toBe('string');
    expect(['DANGEROUS', 'SUSPICIOUS', 'UNCERTAIN', 'LIKELY_TRUE', 'VERIFIED']).toContain(b.verdict);
    expect(typeof b.aiDetection.aiProbability).toBe('number');
    expect(b.metadata).toBeDefined();

    const row = await prisma.analysis.findUnique({ where: { id: b.analysisId } });
    expect(row).not.toBeNull();
    expect(row!.queryType).toBe('image');
  });
});
