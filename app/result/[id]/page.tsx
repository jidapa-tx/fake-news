import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VerdictBadge } from '@/components/VerdictBadge';
import { VerdictLevel, Stance, SourceType } from '@/types';

const VERDICT_LABELS: Record<VerdictLevel, string> = {
  DANGEROUS: 'อันตราย',
  SUSPICIOUS: 'น่าสงสัย',
  UNCERTAIN: 'ไม่แน่ใจ',
  LIKELY_TRUE: 'ค่อนข้างจริง',
  VERIFIED: 'ยืนยันแล้ว',
};

const VERDICT_SUB: Record<VerdictLevel, string> = {
  DANGEROUS: 'ข้อมูลนี้ผิดพลาดและอาจเป็นอันตราย',
  SUSPICIOUS: 'ข้อมูลนี้มีแนวโน้มเป็นข้อมูลเท็จ',
  UNCERTAIN: 'ยังไม่สามารถยืนยันได้ในทิศทางใด',
  LIKELY_TRUE: 'ข้อมูลนี้น่าจะเป็นความจริง',
  VERIFIED: 'ข้อมูลนี้ได้รับการยืนยันแล้ว',
};

const STANCE_LABELS: Record<string, string> = {
  SUPPORTING: 'ยืนยัน',
  OPPOSING: 'คัดค้าน',
  NEUTRAL: 'เป็นกลาง',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  TRUSTED_MEDIA: 'สื่อน่าเชื่อถือ',
  FACT_CHECKER: 'Fact Checker',
  ACADEMIC: 'วิชาการ',
  GOV: 'องค์กรรัฐ',
  UNKNOWN: 'ไม่ทราบ',
};

const VERDICT_BORDER_COLOR: Record<VerdictLevel, string> = {
  DANGEROUS: '#B91C1C',
  SUSPICIOUS: '#B45309',
  UNCERTAIN: '#B45309',
  LIKELY_TRUE: '#047857',
  VERIFIED: '#047857',
};

const VERDICT_BG_COLOR: Record<VerdictLevel, string> = {
  DANGEROUS: 'rgba(185,28,28,0.06)',
  SUSPICIOUS: 'rgba(180,83,9,0.06)',
  UNCERTAIN: 'rgba(180,83,9,0.06)',
  LIKELY_TRUE: 'rgba(4,120,87,0.06)',
  VERIFIED: 'rgba(4,120,87,0.06)',
};

const SEGMENT_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

function verdictToSegment(verdict: VerdictLevel): number {
  return { DANGEROUS: 0, SUSPICIOUS: 1, UNCERTAIN: 2, LIKELY_TRUE: 3, VERIFIED: 4 }[verdict];
}

function VerdictIcon({ verdict, size = 48 }: { verdict: VerdictLevel; size?: number }) {
  const color = VERDICT_BORDER_COLOR[verdict];
  const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none' as const,
    viewBox: '0 0 24 24',
    strokeWidth: 1.5,
    stroke: color,
    width: size,
    height: size,
    'aria-hidden': true as const,
  };

  if (verdict === 'DANGEROUS') {
    return (
      <svg {...svgProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (verdict === 'SUSPICIOUS') {
    return (
      <svg {...svgProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    );
  }
  if (verdict === 'UNCERTAIN') {
    return (
      <svg {...svgProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    );
  }
  if (verdict === 'LIKELY_TRUE') {
    return (
      <svg {...svgProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }
  return (
    <svg {...svgProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: { references: { orderBy: { credibility: 'desc' } } },
  });

  if (!analysis) notFound();

  const verdict = analysis.verdict as VerdictLevel;
  const activeSegment = verdictToSegment(verdict);

  const supporting = analysis.references.filter((r) => r.stance === Stance.SUPPORTING).length;
  const opposing = analysis.references.filter((r) => r.stance === Stance.OPPOSING).length;
  const neutral = analysis.references.filter((r) => r.stance === Stance.NEUTRAL).length;
  const total = analysis.references.length || 1;

  return (
    <div id="main" className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Query strip */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4">
        <div className="text-xs text-slate-400 mb-1">ข้อความที่ตรวจสอบ</div>
        <div className="text-sm font-medium">{analysis.query.slice(0, 200)}</div>
        <div className="text-xs text-slate-400 mt-2 tabular-nums">
          ตรวจครั้งล่าสุด: {new Date(analysis.createdAt).toLocaleString('th-TH')}
        </div>
      </div>

      {/* Verdict banner */}
      <div
        className="rounded-xl p-5 border-l-4"
        style={{
          borderLeftColor: VERDICT_BORDER_COLOR[verdict],
          backgroundColor: VERDICT_BG_COLOR[verdict],
          borderColor: VERDICT_BORDER_COLOR[verdict],
        }}
      >
        <div className="flex items-start gap-5 flex-wrap">
          <VerdictIcon verdict={verdict} size={48} />
          <div className="flex-1 min-w-[180px]">
            <div className="text-2xl font-bold mb-1" style={{ color: VERDICT_BORDER_COLOR[verdict] }}>
              {VERDICT_LABELS[verdict]}
            </div>
            <div className="text-sm text-slate-500 mb-3">{VERDICT_SUB[verdict]}</div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-5xl font-bold tabular-nums" style={{ color: VERDICT_BORDER_COLOR[verdict] }}>
                {analysis.score}
              </span>
              <span className="text-xl text-slate-500">/100 คะแนน</span>
            </div>

            {/* 5-segment bar */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-2">
              {SEGMENT_COLORS.map((color, i) => (
                <div key={i} className={`flex-1 rounded-full ${color} ${i === activeSegment ? 'opacity-100' : 'opacity-20'}`} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              {['อันตราย', 'น่าสงสัย', 'ไม่แน่ใจ', 'ค่อนข้างจริง', 'ยืนยันแล้ว'].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium tabular-nums">
                AI confidence: {analysis.confidence}%
              </span>
              {analysis.confidence < 60 && (
                <span className="bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs">
                  ⚠ AI ยังไม่มั่นใจในผลนี้ กรุณาตรวจสอบเพิ่มเติม
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-600 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-emerald-600 tabular-nums">{Math.round((supporting / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">สนับสนุน ({supporting}/{total} แหล่ง)</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-700 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-red-700 tabular-nums">{Math.round((opposing / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">คัดค้าน ({opposing}/{total} แหล่ง)</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-400 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-slate-500 tabular-nums">{Math.round((neutral / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">ไม่แน่ใจ ({neutral}/{total} แหล่ง)</div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-yellow-50 dark:bg-zinc-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-base font-semibold mb-4">ทำไมถึงน่าสงสัย</h2>
        <div className="flex flex-col gap-2">
          {analysis.reasoning.map((r, i) => (
            <details key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 cursor-pointer">
              <summary className="flex items-start gap-2 text-sm list-none">
                <span className="flex-shrink-0">{r.startsWith('⚠') ? '⚠' : r.startsWith('!') ? '!' : '?'}</span>
                <span>{r.replace(/^[⚠!?]\s*/, '')}</span>
              </summary>
            </details>
          ))}
        </div>
        <p className="text-xs italic text-slate-400 mt-3">* ผลการวิเคราะห์นี้มาจาก AI และอาจมีข้อผิดพลาด โปรดใช้วิจารณญาณ</p>
      </div>

      {/* References */}
      {analysis.references.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">แหล่งอ้างอิง ({analysis.references.length} แหล่ง)</h2>
          <div className="flex flex-col gap-3">
            {analysis.references.map((ref) => (
              <div key={ref.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-700 transition-colors hover:shadow-md">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                    {ref.sourceName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{ref.sourceName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    ref.sourceType === SourceType.FACT_CHECKER ? 'bg-green-100 text-green-800' :
                    ref.sourceType === SourceType.GOV ? 'bg-slate-100 text-slate-700' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {SOURCE_TYPE_LABELS[ref.sourceType]}
                  </span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    ref.stance === Stance.OPPOSING ? 'bg-red-100 text-red-700' :
                    ref.stance === Stance.SUPPORTING ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {STANCE_LABELS[ref.stance]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">{ref.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {ref.publishedAt && <span className="tabular-nums">{new Date(ref.publishedAt).toLocaleDateString('th-TH')}</span>}
                  <span className="tabular-nums">ความน่าเชื่อถือ: {ref.credibility}/100</span>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 dark:text-blue-400 font-medium ml-auto flex items-center gap-1" aria-label={`อ่านต้นฉบับจาก ${ref.sourceName}`}>
                    อ่านต้นฉบับ
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={12} height={12} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <Link href="/" className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-blue-700 transition-colors no-underline text-slate-700 dark:text-slate-300 min-h-[44px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            ตรวจสอบใหม่
          </Link>
          <Link href={`/result/${id}`} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-blue-700 transition-colors no-underline text-slate-700 dark:text-slate-300 min-h-[44px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={16} height={16} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            ตรวจสอบอีกครั้ง
          </Link>
        </div>
        <VerdictBadge verdict={verdict} className="text-sm px-4 py-2" />
      </div>
    </div>
  );
}
