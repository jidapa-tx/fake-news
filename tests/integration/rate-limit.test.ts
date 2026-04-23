import { describe, it, expect } from 'vitest';
import { getJson, expectErrorShape } from './helpers/http';

const RATE_LIMIT_IP = '10.99.99.99';

describe('Rate limiting (30 req / 60 s)', () => {
  it('allows first 30 requests, 429s the 31st', async () => {
    // 30 allowed
    for (let i = 1; i <= 30; i++) {
      const { status } = await getJson('/api/trending', { ip: RATE_LIMIT_IP });
      expect(status, `request #${i} should be 200`).toBe(200);
    }

    // 31st should 429
    const { status, body } = await getJson('/api/trending', { ip: RATE_LIMIT_IP });
    expect(status).toBe(429);
    expectErrorShape(body, 'RATE_LIMITED');
  });
});
