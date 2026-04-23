import { describe, it, expect } from 'vitest';
import { getJson } from './helpers/http';

describe('GET /api/health', () => {
  it('returns ok with db connected', async () => {
    const { status, body } = await getJson('/api/health');
    expect(status).toBe(200);
    expect(body).toMatchObject({ status: 'ok', db: 'connected' });
    expect(typeof (body as { timestamp: string }).timestamp).toBe('string');
  });
});
