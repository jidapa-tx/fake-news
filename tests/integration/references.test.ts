import { describe, it, expect } from 'vitest';
import { getJson, postJson, expectErrorShape, TEST_TAG } from './helpers/http';

describe('GET /api/references/[analysisId]', () => {
  it('404 for unknown analysisId', async () => {
    const { status, body } = await getJson('/api/references/does-not-exist-xyz');
    expect(status).toBe(404);
    expectErrorShape(body, 'NOT_FOUND');
  });

  it('200 returns array for analysisId that exists', async () => {
    const unique = Date.now();
    const text = await postJson('/api/analyze/text', {
      query: `${TEST_TAG} reference probe ${unique}`,
      queryType: 'text',
    });
    expect(text.status).toBe(200);
    const id = (text.body as { analysisId: string }).analysisId;

    const { status, body } = await getJson(`/api/references/${id}`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
