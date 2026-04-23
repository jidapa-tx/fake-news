'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useLocalHistory } from '@/hooks/useLocalHistory';
import { VerdictBadge } from '@/components/VerdictBadge';
import { VerdictLevel, HistoryExport } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const VERDICT_OPTIONS: { label: string; value: VerdictLevel | '' }[] = [
  { label: 'ทุกผลลัพธ์', value: '' },
  { label: 'อันตราย', value: VerdictLevel.DANGEROUS },
  { label: 'น่าสงสัย', value: VerdictLevel.SUSPICIOUS },
  { label: 'ไม่แน่ใจ', value: VerdictLevel.UNCERTAIN },
  { label: 'ค่อนข้างจริง', value: VerdictLevel.LIKELY_TRUE },
  { label: 'ยืนยันแล้ว', value: VerdictLevel.VERIFIED },
];

const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  url: '🔗',
  image: '🖼',
};

export default function HistoryPage() {
  const { items, deleteItem, clearAll, exportJSON, importJSON } = useLocalHistory();
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<VerdictLevel | ''>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const matchesSearch = item.queryPreview.toLowerCase().includes(search.toLowerCase());
    const matchesVerdict = !verdictFilter || item.verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  function handleExport() {
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snbs-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as HistoryExport;
        const ok = importJSON(data);
        if (!ok) alert('ไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ที่ export จากระบบ');
      } catch {
        alert('ไม่สามารถอ่านไฟล์ได้');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">ประวัติการตรวจสอบ</h1>
          <p className="text-sm text-slate-500 mt-0.5">เก็บไว้ในเครื่องของคุณเท่านั้น • สูงสุด 100 รายการ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExport} className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-800 transition-colors">
            ⬇ Export JSON
          </button>
          <label className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-800 transition-colors cursor-pointer">
            ⬆ Import JSON
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3.5 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            🗑 ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="search"
          className="flex-1 min-w-48 px-3.5 py-2.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-blue-800 outline-none"
          placeholder="🔍 ค้นหาประวัติ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-blue-800 outline-none"
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value as VerdictLevel | '')}
        >
          {VERDICT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400 mb-3">แสดง {filtered.length} รายการ</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <div className="text-lg font-semibold mb-2">ยังไม่มีประวัติการตรวจสอบ</div>
          <div className="text-sm text-slate-500 mb-6">เริ่มตรวจสอบข่าวแรกของคุณได้เลย</div>
          <Link href="/" className="px-6 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-medium no-underline hover:bg-blue-700 transition-colors">
            เริ่มตรวจสอบ
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-800 transition-colors">
              <span className="text-lg w-8 text-center flex-shrink-0">{TYPE_ICONS[item.queryType]}</span>
              <Link href={`/result/${item.analysisId}`} className="flex-1 min-w-0 no-underline">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.queryPreview}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {item.queryType} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: th })}
                </div>
              </Link>
              <VerdictBadge verdict={item.verdict} />
              <span className="text-xs text-slate-400 whitespace-nowrap">{item.score}/100</span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 transition-all text-sm"
                aria-label="ลบรายการ"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-7 max-w-sm w-[90%] shadow-2xl">
            <h2 className="text-lg font-semibold mb-3">ลบประวัติทั้งหมด?</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              การดำเนินการนี้จะลบประวัติการตรวจสอบทั้งหมด {items.length} รายการออกจากเครื่องของคุณ ไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium">
                ยกเลิก
              </button>
              <button
                onClick={() => { clearAll(); setShowConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                ลบทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
