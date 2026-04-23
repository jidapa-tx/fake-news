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

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function TrendingPage() {
  const [period, setPeriod] = useState<Period>('day');

  const { data, isLoading } = useQuery<TrendingResponse>({
    queryKey: ['trending', period],
    queryFn: () => fetch(`/api/trending?period=${period}`).then((r) => r.json()),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">🔥 ข่าวที่ถูกตรวจสอบมากที่สุด</h1>
        <p className="text-sm text-slate-500 mt-0.5">อัปเดตทุก 15 นาที — ข้อมูลรวมไม่ระบุตัวตน</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { num: data?.items.reduce((a, b) => a + b.checkCount, 0) ?? '...', label: 'ตรวจสอบช่วงนี้' },
          { num: '68%', label: 'พบข้อมูลเท็จ/น่าสงสัย' },
          { num: data?.items.length ?? '...', label: 'หัวข้อกำลังติดตาม' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <div className="text-xl font-semibold text-blue-800 dark:text-blue-400">{String(s.num)}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit mb-4">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p ? 'bg-blue-800 text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Privacy notice */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-500 mb-4">
        🔐 ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้ — เฉพาะจำนวนครั้งที่ตรวจสอบและผลลัพธ์เท่านั้น
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">กำลังโหลด...</div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 text-slate-400">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.items.slice(0, 10).length > 0 && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide py-1">อันดับ 1–10</p>
          )}
          {data.items.map((item) => (
            <Link
              key={item.analysisId || item.rank}
              href={item.analysisId ? `/result/${item.analysisId}` : '#'}
              className={`flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-slate-800 border rounded-xl hover:border-blue-800 transition-colors no-underline text-slate-900 dark:text-slate-100 ${
                item.rank <= 3
                  ? 'border-l-[3px] border-blue-800 border-t-slate-200 dark:border-t-slate-700 border-b-slate-200 dark:border-b-slate-700 border-r-slate-200 dark:border-r-slate-700'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`text-base font-semibold w-7 text-center flex-shrink-0 ${
                item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-slate-400' : item.rank === 3 ? 'text-amber-700' : 'text-slate-400'
              }`}>
                {RANK_ICONS[item.rank] ?? item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                  {item.queryPreview}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>🔍 {item.checkCount.toLocaleString()} ครั้ง</span>
                  <span className={item.changePercent > 0 ? 'text-emerald-600' : item.changePercent < 0 ? 'text-red-600' : ''}>
                    {item.changePercent > 0 ? `▲ +${item.changePercent}%` : item.changePercent < 0 ? `▼ ${item.changePercent}%` : '— ไม่เปลี่ยน'}
                  </span>
                  <span>{formatDistanceToNow(new Date(item.lastCheckedAt), { addSuffix: true, locale: th })}</span>
                </div>
              </div>
              <VerdictBadge verdict={item.lastVerdict} />
            </Link>
          ))}

          {data.items.length > 10 && (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide py-1 mt-2">อันดับ 11–20</p>
              {data.items.slice(10).map((item) => (
                <Link
                  key={item.analysisId || item.rank}
                  href={item.analysisId ? `/result/${item.analysisId}` : '#'}
                  className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-800 transition-colors no-underline text-slate-900 dark:text-slate-100"
                >
                  <span className="text-base font-semibold w-7 text-center flex-shrink-0 text-slate-400">{item.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap mb-1">{item.queryPreview}</div>
                    <div className="text-xs text-slate-400">🔍 {item.checkCount.toLocaleString()} ครั้ง</div>
                  </div>
                  <VerdictBadge verdict={item.lastVerdict} />
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
