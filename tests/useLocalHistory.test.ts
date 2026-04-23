import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalHistory } from '@/hooks/useLocalHistory';
import { VerdictLevel } from '@/types';

const SAMPLE_ITEM = {
  queryType: 'text' as const,
  queryPreview: 'ข่าวทดสอบ',
  query: 'ข่าวทดสอบฉบับเต็ม',
  verdict: VerdictLevel.SUSPICIOUS,
  score: 35,
  confidence: 80,
  analysisId: 'analysis-1',
};

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalHistory', () => {
  it('starts with empty items', () => {
    const { result } = renderHook(() => useLocalHistory());
    expect(result.current.items).toHaveLength(0);
  });

  it('addItem adds a new history entry', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => { result.current.addItem(SAMPLE_ITEM); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].queryPreview).toBe('ข่าวทดสอบ');
  });

  it('deleteItem removes the correct entry', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => { result.current.addItem(SAMPLE_ITEM); });
    const id = result.current.items[0].id;
    act(() => { result.current.deleteItem(id); });
    expect(result.current.items).toHaveLength(0);
  });

  it('clearAll removes all entries and localStorage key', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => {
      result.current.addItem(SAMPLE_ITEM);
      result.current.addItem({ ...SAMPLE_ITEM, queryPreview: 'ข่าว 2' });
    });
    act(() => { result.current.clearAll(); });
    expect(result.current.items).toHaveLength(0);
    expect(localStorage.getItem('snbs_history')).toBeNull();
  });

  it('exportJSON returns correct structure', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => { result.current.addItem(SAMPLE_ITEM); });
    const exported = result.current.exportJSON();
    expect(exported.version).toBe('1.0');
    expect(exported.items).toHaveLength(1);
    expect(exported.exported_at).toBeDefined();
  });

  it('importJSON merges without duplicates', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => { result.current.addItem(SAMPLE_ITEM); });
    const exported = result.current.exportJSON();
    act(() => { result.current.importJSON(exported); });
    expect(result.current.items).toHaveLength(1);
  });

  it('filterByVerdict returns matching items only', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => {
      result.current.addItem(SAMPLE_ITEM);
      result.current.addItem({ ...SAMPLE_ITEM, verdict: VerdictLevel.DANGEROUS, queryPreview: 'ข่าวอันตราย' });
    });
    const filtered = result.current.filterByVerdict(VerdictLevel.DANGEROUS);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].queryPreview).toBe('ข่าวอันตราย');
  });

  it('filterByVerdict with null returns all items', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => {
      result.current.addItem(SAMPLE_ITEM);
      result.current.addItem({ ...SAMPLE_ITEM, verdict: VerdictLevel.DANGEROUS });
    });
    expect(result.current.filterByVerdict(null)).toHaveLength(2);
  });

  it('restores items from localStorage on mount', () => {
    localStorage.setItem('snbs_history', JSON.stringify([{ ...SAMPLE_ITEM, id: 'x', createdAt: new Date().toISOString() }]));
    const { result } = renderHook(() => useLocalHistory());
    expect(result.current.items).toHaveLength(1);
  });

  it('returns empty list when localStorage holds invalid JSON', () => {
    localStorage.setItem('snbs_history', '{not json');
    const { result } = renderHook(() => useLocalHistory());
    expect(result.current.items).toHaveLength(0);
  });

  it('importJSON rejects malformed payloads', () => {
    const { result } = renderHook(() => useLocalHistory());
    let ok = true;
    act(() => { ok = result.current.importJSON({ nope: true }); });
    expect(ok).toBe(false);
    act(() => { ok = result.current.importJSON(null); });
    expect(ok).toBe(false);
  });

  it('enforces the 100-entry limit', () => {
    const { result } = renderHook(() => useLocalHistory());
    act(() => {
      for (let i = 0; i < 105; i++) {
        result.current.addItem({ ...SAMPLE_ITEM, queryPreview: `q${i}` });
      }
    });
    expect(result.current.items.length).toBeLessThanOrEqual(100);
  });
});
