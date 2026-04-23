import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VerdictBadge } from '@/components/VerdictBadge';
import { VerdictLevel, Stance, SourceType } from '@/types';

const VERDICT_LABELS: Record<VerdictLevel, string> = {
  DANGEROUS: '⚠ อันตราย',
  SUSPICIOUS: '🟠 น่าสงสัย',
  UNCERTAIN: '🟡 ไม่แน่ใจ',
  LIKELY_TRUE: '🟢 ค่อนข้างจริง',
  VERIFIED: '✅ ยืนยันแล้ว',
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

const SEGMENT_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

function verdictToSegment(verdict: VerdictLevel): number {
  return { DANGEROUS: 0, SUSPICIOUS: 1, UNCERTAIN: 2, LIKELY_TRUE: 3, VERIFIED: 4 }[verdict];
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
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
      {/* Query strip */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4">
        <div className="text-xs text-slate-400 mb-1">ข้อความที่ตรวจสอบ</div>
        <div className="text-sm font-medium">{analysis.query.slice(0, 200)}</div>
        <div className="text-xs text-slate-400 mt-2">
          ตรวจครั้งล่าสุด: {new Date(analysis.createdAt).toLocaleString('th-TH')}
        </div>
      </div>

      {/* Verdict card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Score circle */}
          <div
            className={`w-24 h-24 rounded-full border-[6px] verdict-${verdict} flex flex-col items-center justify-center flex-shrink-0`}
          >
            <span className={`text-3xl font-bold verdict-${verdict}`}>{analysis.score}</span>
            <span className={`text-[10px] verdict-${verdict}`}>คะแนน</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-[180px]">
            <div className={`text-2xl font-semibold verdict-${verdict} mb-1`}>
              {VERDICT_LABELS[verdict]}
            </div>
            <div className="text-sm text-slate-500 mb-4">{VERDICT_SUB[verdict]}</div>

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
              <span className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-emerald-600">{Math.round((supporting / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">สนับสนุน ({supporting}/{total} แหล่ง)</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-red-600">{Math.round((opposing / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">คัดค้าน ({opposing}/{total} แหล่ง)</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <div className="text-xl font-semibold text-slate-500">{Math.round((neutral / total) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">ไม่แน่ใจ ({neutral}/{total} แหล่ง)</div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
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
      </div>

      {/* References */}
      {analysis.references.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">แหล่งอ้างอิง ({analysis.references.length} แหล่ง)</h2>
          <div className="flex flex-col gap-3">
            {analysis.references.map((ref) => (
              <div key={ref.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-800 transition-colors">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  {ref.publishedAt && <span>{new Date(ref.publishedAt).toLocaleDateString('th-TH')}</span>}
                  <span>ความน่าเชื่อถือ: {ref.credibility}/100</span>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 dark:text-blue-400 font-medium ml-auto">
                    อ่านต้นฉบับ →
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
          <Link href="/" className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-blue-800 transition-colors no-underline text-slate-700 dark:text-slate-300">
            ← ตรวจสอบใหม่
          </Link>
          <Link href={`/result/${id}`} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-blue-800 transition-colors no-underline text-slate-700 dark:text-slate-300">
            🔄 ตรวจสอบอีกครั้ง
          </Link>
        </div>
        <VerdictBadge verdict={verdict} className="text-sm px-4 py-2" />
      </div>
    </div>
  );
}
