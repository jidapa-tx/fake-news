import { describe, it, expect } from 'vitest';
import { getJson, expectErrorShape } from './helpers/http';

describe('GET /api/trending', () => {
  it('200 default period=day', async () => {
    const { status, body } = await getJson('/api/trending');
    expect(status).toBe(200);
    const b = body as { period: string; updatedAt: string; items: unknown[] };
    expect(b.period).toBe('day');
    expect(typeof b.updatedAt).toBe('string');
    expect(Array.isArray(b.items)).toBe(true);
    expect(b.items.length).toBeLessThanOrEqual(20);
  });

  it('200 period=week', async () => {
    const { status, body } = await getJson('/api/trending?period=week');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('week');
  });

  it('200 period=month', async () => {
    const { status, body } = await getJson('/api/trending?period=month');
    expect(status).toBe(200);
    expect((body as { period: string }).period).toBe('month');
  });

  it('400 for invalid period', async () => {
    const { status, body } = await getJson('/api/trending?period=century');
    expect(status).toBe(400);
    expectErrorShape(body, 'VALIDATION_ERROR');
  });
});
