'use client';

import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, HistoryExport, VerdictLevel } from '@/types';

const STORAGE_KEY = 'snbs_history';
const MAX_ENTRIES = 100;

function readStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function enforceLimit(items: HistoryItem[]): HistoryItem[] {
  if (items.length <= MAX_ENTRIES) return items;
  return [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ENTRIES);
}

export function useLocalHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(readStorage());
  }, []);

  const addItem = useCallback((item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => {
      const updated = enforceLimit([newItem, ...prev]);
      writeStorage(updated);
      return updated;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      writeStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setItems([]);
  }, []);

  const exportJSON = useCallback((): HistoryExport => {
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      items,
    };
  }, [items]);

  const importJSON = useCallback((data: unknown): boolean => {
    try {
      const parsed = data as HistoryExport;
      if (!parsed.version || !Array.isArray(parsed.items)) return false;
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = parsed.items.filter((i) => !existingIds.has(i.id));
        const merged = enforceLimit([...newItems, ...prev]);
        writeStorage(merged);
        return merged;
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const filterByVerdict = useCallback(
    (verdict: VerdictLevel | null) => {
      return verdict ? items.filter((i) => i.verdict === verdict) : items;
    },
    [items]
  );

  return { items, addItem, deleteItem, clearAll, exportJSON, importJSON, filterByVerdict };
}
