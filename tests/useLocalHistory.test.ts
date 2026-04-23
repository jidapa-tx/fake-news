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
});
