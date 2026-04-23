import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request from a new IP', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    expect(checkRateLimit('1.1.1.1')).toBe(true);
  });

  it('allows up to 30 requests within the window', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit('2.2.2.2')).toBe(true);
    }
  });

  it('blocks the 31st request within the window', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    for (let i = 0; i < 30; i++) checkRateLimit('3.3.3.3');
    expect(checkRateLimit('3.3.3.3')).toBe(false);
  });

  it('resets the counter after the 60s window elapses', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    for (let i = 0; i < 30; i++) checkRateLimit('4.4.4.4');
    expect(checkRateLimit('4.4.4.4')).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit('4.4.4.4')).toBe(true);
  });

  it('tracks IPs independently', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    for (let i = 0; i < 30; i++) checkRateLimit('5.5.5.5');
    expect(checkRateLimit('5.5.5.5')).toBe(false);
    expect(checkRateLimit('6.6.6.6')).toBe(true);
  });
});

describe('getClientIp', () => {
  it('picks the first value from x-forwarded-for', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' } });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const req = new Request('http://x', { headers: { 'x-real-ip': '10.0.0.9' } });
    expect(getClientIp(req)).toBe('10.0.0.9');
  });

  it('returns "unknown" when no header is present', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const req = new Request('http://x');
    expect(getClientIp(req)).toBe('unknown');
  });

  it('trims whitespace around forwarded IP', async () => {
    const { getClientIp } = await import('@/lib/rate-limit');
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '   10.0.0.5  , 10.0.0.6' } });
    expect(getClientIp(req)).toBe('10.0.0.5');
  });
});
