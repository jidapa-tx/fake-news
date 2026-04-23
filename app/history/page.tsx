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

const VERDICT_BORDER: Record<VerdictLevel, string> = {
  DANGEROUS: 'border-l-red-700',
  SUSPICIOUS: 'border-l-amber-700',
  UNCERTAIN: 'border-l-yellow-700',
  LIKELY_TRUE: 'border-l-lime-700',
  VERIFIED: 'border-l-emerald-700',
};

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369.64.05 1.084.69.858 1.295l-.17.454a2.25 2.25 0 001.955 3.024h.087c1.207 0 2.332-.557 3.081-1.516a9.002 9.002 0 00-2.573-12.508 9.015 9.015 0 00-9.23 1.15A9.002 9.002 0 002.25 12.76z" />
  </svg>
);

const UrlIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={20} height={20} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  text: <TextIcon />,
  url: <UrlIcon />,
  image: <ImageIcon />,
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
    <div id="main" className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">ประวัติการตรวจสอบ</h1>
          <p className="text-sm text-slate-500 mt-0.5">เก็บไว้ในเครื่องของคุณเท่านั้น • สูงสุด 100 รายการ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            aria-label="Export JSON"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-700 transition-colors min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export JSON
          </button>
          <label className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-blue-700 transition-colors cursor-pointer min-h-[44px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import JSON
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label="ลบทั้งหมด"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            ลบทั้งหมด
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={18} height={18} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </span>
        <input
          type="search"
          className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-blue-700 outline-none min-h-[44px] focus:ring-2 focus:ring-blue-700/20"
          placeholder="ค้นหาประวัติ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="ค้นหาประวัติ"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {VERDICT_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setVerdictFilter(o.value)}
            className={`rounded-full px-3.5 py-1 text-sm font-medium border min-h-[36px] whitespace-nowrap transition-colors flex-shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              verdictFilter === o.value
                ? 'bg-blue-700 text-white border-blue-700'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-3 tabular-nums">แสดง {filtered.length} รายการ</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <div className="text-lg font-semibold mb-2">ยังไม่มีประวัติ</div>
          <div className="text-sm text-slate-500 mb-6">ลองตรวจสอบข่าวสักชิ้น</div>
          <Link href="/" className="px-6 py-2.5 bg-blue-800 text-white rounded-xl text-sm font-medium no-underline hover:bg-blue-700 transition-colors">
            เริ่มตรวจสอบ
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 ${VERDICT_BORDER[item.verdict as VerdictLevel] ?? 'border-l-slate-300'} rounded-xl hover:border-blue-700 transition-colors`}
            >
              <span className="text-slate-500 dark:text-slate-400 w-8 flex justify-center flex-shrink-0">
                {TYPE_ICON_MAP[item.queryType] ?? <TextIcon />}
              </span>
              <Link href={`/result/${item.analysisId}`} className="flex-1 min-w-0 no-underline">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.queryPreview}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  {item.queryType} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: th })}
                </div>
              </Link>
              <VerdictBadge verdict={item.verdict} />
              <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">{item.score}/100</span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ลบรายการ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-7 max-w-sm w-[90%] shadow-2xl">
            <h2 id="confirm-title" className="text-lg font-semibold mb-3">ลบประวัติทั้งหมด?</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              การดำเนินการนี้จะลบประวัติการตรวจสอบทั้งหมด {items.length} รายการออกจากเครื่องของคุณ ไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium min-h-[44px]">
                ยกเลิก
              </button>
              <button
                onClick={() => { clearAll(); setShowConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px]"
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
