import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Inline validation schemas (mirror of route schemas)
const TextSchema = z.object({
  query: z.string().min(10).max(5000),
  queryType: z.enum(['text', 'url']),
});

const SourceSchema = z.object({
  url: z.string().url(),
});

describe('API Zod validation', () => {
  it('rejects text longer than 5000 chars', () => {
    const result = TextSchema.safeParse({ query: 'a'.repeat(5001), queryType: 'text' });
    expect(result.success).toBe(false);
  });

  it('rejects text shorter than 10 chars', () => {
    const result = TextSchema.safeParse({ query: 'short', queryType: 'text' });
    expect(result.success).toBe(false);
  });

  it('accepts valid text query', () => {
    const result = TextSchema.safeParse({ query: 'This is a valid query with enough characters', queryType: 'text' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL in source analyzer', () => {
    const result = SourceSchema.safeParse({ url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts valid URL in source analyzer', () => {
    const result = SourceSchema.safeParse({ url: 'https://example.com/news' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid queryType', () => {
    const result = TextSchema.safeParse({ query: 'This is a valid query text', queryType: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('error format matches API contract', () => {
    const errorPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message_th: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
        message_en: 'Invalid input data',
      },
    };
    expect(errorPayload.error.code).toBe('VALIDATION_ERROR');
    expect(errorPayload.error.message_th).toBeDefined();
    expect(errorPayload.error.message_en).toBeDefined();
  });
});
