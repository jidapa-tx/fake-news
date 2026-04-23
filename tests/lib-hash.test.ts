import { describe, it, expect } from 'vitest';
import { hashQuery } from '@/lib/hash';

describe('hashQuery', () => {
  it('produces a 64-char hex sha256 digest', () => {
    const h = hashQuery('hello world');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable for identical input', () => {
    expect(hashQuery('same input')).toBe(hashQuery('same input'));
  });

  it('normalizes case', () => {
    expect(hashQuery('Thailand')).toBe(hashQuery('thailand'));
    expect(hashQuery('HELLO')).toBe(hashQuery('hello'));
  });

  it('collapses whitespace and trims', () => {
    expect(hashQuery('  foo    bar  ')).toBe(hashQuery('foo bar'));
    expect(hashQuery('foo\t\nbar')).toBe(hashQuery('foo bar'));
  });

  it('produces distinct hashes for different content', () => {
    expect(hashQuery('one')).not.toBe(hashQuery('two'));
  });

  it('handles empty string without throwing', () => {
    expect(hashQuery('')).toMatch(/^[0-9a-f]{64}$/);
  });
});
