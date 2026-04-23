import { VerdictLevel } from '@/types';

const LABELS: Record<VerdictLevel, string> = {
  [VerdictLevel.DANGEROUS]: 'อันตราย',
  [VerdictLevel.SUSPICIOUS]: 'น่าสงสัย',
  [VerdictLevel.UNCERTAIN]: 'ไม่แน่ใจ',
  [VerdictLevel.LIKELY_TRUE]: 'ค่อนข้างจริง',
  [VerdictLevel.VERIFIED]: 'ยืนยันแล้ว',
};

interface Props {
  verdict: VerdictLevel;
  className?: string;
}

export function VerdictBadge({ verdict, className = '' }: Props) {
  return (
    <span
      className={`badge-${verdict} px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}
    >
      {LABELS[verdict]}
    </span>
  );
}
