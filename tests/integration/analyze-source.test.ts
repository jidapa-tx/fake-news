import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { postJson, expectErrorShape, TEST_TAG } from './helpers/http';
import { prisma } from './helpers/db';

const TEST_PHISHING_DOMAIN = `${TEST_TAG}-phishing-src.example`;
const TEST_UNKNOWN_DOMAIN = `${TEST_TAG}-unknown-src.example`;

describe('POST /api/analyze/source', () => {
  beforeAll(async () => {
    await prisma.suspiciousDomain.upsert({
      where: { domain: TEST_PHISHING_DOMAIN },
      update: { riskLevel: 'high', reason: 'integration test phishing fixture' },
      create: {
        domain: TEST_PHISHING_DOMAIN,
        reason: 'integration test phishing fixture',
        riskLevel: 'high',
      },
    });
  });

  afterAll(async () => {
    await prisma.suspiciousDomain.deleteMany({
      where: { domain: { in: [TEST_PHISHING_DOMAIN] } },
    });
  });

  it('400 for invalid URL string', async () => {
    const { status, body } = await postJson('/api/analyze/source', { url: 'not-a-url' });
    expect(status).toBe(400);
    expectErrorShape(body, 'INVALID_URL');
  });

  it('200 riskLevel=safe for trusted domain (bbc.com)', async () => {
    const { status, body } = await postJson('/api/analyze/source', {
      url: 'https://www.bbc.com/news',
    });
    expect(status).toBe(200);
    const b = body as { domain: string; riskLevel: string };
    expect(b.domain).toBe('bbc.com');
    expect(b.riskLevel).toBe('safe');
  });

  it('200 riskLevel=dangerous for seeded phishing domain', async () => {
    const { status, body } = await postJson('/api/analyze/source', {
      url: `https://${TEST_PHISHING_DOMAIN}/article`,
    });
    expect(status).toBe(200);
    const b = body as { riskLevel: string; isKnownPhishing: boolean };
    expect(b.riskLevel).toBe('dangerous');
    expect(b.isKnownPhishing).toBe(true);
  });

  it('200 with riskLevel string for unknown domain', async () => {
    const { status, body } = await postJson('/api/analyze/source', {
      url: `https://${TEST_UNKNOWN_DOMAIN}/article`,
    });
    expect(status).toBe(200);
    const b = body as { riskLevel: string };
    expect(['safe', 'unknown', 'suspicious', 'dangerous']).toContain(b.riskLevel);
  });
});
