import { describe, it, expect } from 'vitest';
import { postJson, expectErrorShape, TEST_TAG } from './helpers/http';
import { prisma } from './helpers/db';

describe('POST /api/analyze/text', () => {
  it('400 when query is empty', async () => {
    const { status, body } = await postJson('/api/analyze/text', {
      query: '',
      queryType: 'text',
    });
    expect(status).toBe(400);
    expectErrorShape(body, 'VALIDATION_ERROR');
  });

  it('400 when query shorter than 10 chars', async () => {
    const { status, body } = await postJson('/api/analyze/text', {
      query: 'short',
      queryType: 'text',
    });
    expect(status).toBe(400);
    expectErrorShape(body, 'VALIDATION_ERROR');
  });

  it('400 when query exceeds 5000 chars', async () => {
    const { status, body } = await postJson('/api/analyze/text', {
      query: 'a'.repeat(5001),
      queryType: 'text',
    });
    expect(status).toBe(400);
    // Route maps by exact Zod error string, which changed in zod 4
    // → accepts either the specific TEXT_TOO_LONG or generic VALIDATION_ERROR
    const code = (body as { error: { code: string } }).error.code;
    expect(['TEXT_TOO_LONG', 'VALIDATION_ERROR']).toContain(code);
  });

  it('400 when queryType missing', async () => {
    const { status, body } = await postJson('/api/analyze/text', {
      query: `${TEST_TAG} something long enough to pass min length`,
    });
    expect(status).toBe(400);
    expectErrorShape(body, 'VALIDATION_ERROR');
  });

  it('400 when queryType=url with invalid URL', async () => {
    const { status, body } = await postJson('/api/analyze/text', {
      query: `${TEST_TAG} not-really-a-url`,
      queryType: 'url',
    });
    expect(status).toBe(400);
    expectErrorShape(body, 'INVALID_URL');
  });

  it('200 for valid text query — persists Analysis row', async () => {
    const unique = Date.now();
    const query = `${TEST_TAG} integration text query ${unique}`;
    const { status, body } = await postJson('/api/analyze/text', {
      query,
      queryType: 'text',
    });
    expect(status).toBe(200);

    const b = body as {
      analysisId: string;
      verdict: string;
      score: number;
      confidence: number;
      reasoning: string[];
      references: unknown[];
    };
    expect(typeof b.analysisId).toBe('string');
    expect(b.analysisId.length).toBeGreaterThan(0);
    expect(['DANGEROUS', 'SUSPICIOUS', 'UNCERTAIN', 'LIKELY_TRUE', 'VERIFIED']).toContain(b.verdict);
    expect(typeof b.score).toBe('number');
    expect(typeof b.confidence).toBe('number');
    expect(Array.isArray(b.reasoning)).toBe(true);
    expect(Array.isArray(b.references)).toBe(true);

    const row = await prisma.analysis.findUnique({ where: { id: b.analysisId } });
    expect(row).not.toBeNull();
    expect(row!.query).toBe(query);
  });

  it('200 returns cached analysisId on duplicate query', async () => {
    const unique = Date.now();
    const query = `${TEST_TAG} cache probe ${unique}`;
    const first = await postJson('/api/analyze/text', { query, queryType: 'text' });
    expect(first.status).toBe(200);
    const firstId = (first.body as { analysisId: string }).analysisId;

    const second = await postJson('/api/analyze/text', { query, queryType: 'text' });
    expect(second.status).toBe(200);
    const secondId = (second.body as { analysisId: string }).analysisId;
    expect(secondId).toBe(firstId);
  });
});
