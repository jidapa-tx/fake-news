'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { VerdictBadge } from '@/components/VerdictBadge';
import { TrendingResponse } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'วันนี้',
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้',
};

const RANK_BORDER: Record<number, string> = {
  1: 'border-l-[4px] border-l-amber-500',
  2: 'border-l-[4px] border-l-slate-400',
  3: 'border-l-[4px] border-l-amber-700',
};

const RANK_COLOR: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-slate-400',
  3: 'text-amber-700',
};

export default function TrendingPage() {
  const [period, setPeriod] = useState<Period>('day');

  const { data, isLoading } = useQuery<TrendingResponse>({
    queryKey: ['trending', period],
    queryFn: () => fetch(`/api/trending?period=${period}`).then((r) => r.json()),
  });

  return (
    <div id="main" className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={22} height={22} aria-hidden="true" className="text-orange-500 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          </svg>
          ข่าวที่ถูกตรวจสอบมากที่สุด
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">อัปเดตทุก 15 นาที — ข้อมูลรวมไม่ระบุตัวตน</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { num: data?.items.reduce((a, b) => a + b.checkCount, 0) ?? '...', label: 'ตรวจสอบช่วงนี้' },
          {
            num: data?.items.length
              ? `${Math.round((data.items.filter((i) => i.lastVerdict === 'DANGEROUS' || i.lastVerdict === 'SUSPICIOUS').length / data.items.length) * 100)}%`
              : '...',
            label: 'พบข้อมูลเท็จ/น่าสงสัย',
          },
          { num: data?.items.length ?? '...', label: 'หัวข้อกำลังติดตาม' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <div className="text-xl font-semibold text-blue-800 dark:text-blue-400 tabular-nums">{String(s.num)}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Period tabs — segmented control */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit mb-4" role="group" aria-label="ช่วงเวลา">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] focus-visible:outline-2 focus-visible:outline-blue-700 ${
              period === p ? 'bg-blue-800 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Privacy notice */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-500 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true" className="flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้ — เฉพาะจำนวนครั้งที่ตรวจสอบและผลลัพธ์เท่านั้น
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 text-slate-400">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.items.slice(0, 10).length > 0 && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide py-1">อันดับ 1–10</p>
          )}
          {data.items.slice(0, 10).map((item) => (
            <Link
              key={item.analysisId || item.rank}
              href={item.analysisId ? `/result/${item.analysisId}` : '#'}
              className={`flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-slate-800 border rounded-xl hover:border-blue-700 transition-colors no-underline text-slate-900 dark:text-slate-100 ${
                item.rank <= 3
                  ? `${RANK_BORDER[item.rank] ?? ''} border-t-slate-200 dark:border-t-slate-700 border-b-slate-200 dark:border-b-slate-700 border-r-slate-200 dark:border-r-slate-700`
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`text-2xl font-semibold w-8 text-center flex-shrink-0 tabular-nums ${RANK_COLOR[item.rank] ?? 'text-slate-400'}`}>
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold overflow-hidden line-clamp-2 mb-1">
                  {item.queryPreview}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="tabular-nums">{item.checkCount.toLocaleString()} ครั้ง</span>
                  <span className={item.changePercent > 0 ? 'text-emerald-600 flex items-center gap-0.5' : item.changePercent < 0 ? 'text-red-600 flex items-center gap-0.5' : ''}>
                    {item.changePercent > 0 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={12} height={12} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                        <span className="tabular-nums">+{item.changePercent}%</span>
                      </>
                    ) : item.changePercent < 0 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={12} height={12} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        <span className="tabular-nums">{item.changePercent}%</span>
                      </>
                    ) : (
                      '— ไม่เปลี่ยน'
                    )}
                  </span>
                  <span>{formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true, locale: th })}</span>
                </div>
              </div>
              <VerdictBadge verdict={item.lastVerdict} />
            </Link>
          ))}

        </div>
      )}
    </div>
  );
}
