import { prisma } from '@/lib/prisma';
import { hashQuery } from '@/lib/hash';
import { VerdictLevel, Stance, SourceType, scoreToVerdict, ReferenceItem } from '@/types';

export interface TextAnalysisResult {
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  reasoning: string[];
  references: ReferenceItem[];
}

const MOCK_REFERENCES: ReferenceItem[] = [
  {
    id: 'ref-1',
    sourceName: 'WHO',
    url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
    stance: Stance.OPPOSING,
    excerpt: 'There is no evidence that drinking hot water or beverages kills the COVID-19 virus. The virus is transmitted through respiratory droplets.',
    publishedAt: '2020-03-16',
    credibility: 93,
    sourceType: SourceType.GOV,
  },
  {
    id: 'ref-2',
    sourceName: 'AFP Fact Check TH',
    url: 'https://factcheck.afp.com/th/hot-water-covid',
    stance: Stance.OPPOSING,
    excerpt: 'AFP ตรวจสอบข้อเท็จจริง: ไม่มีหลักฐานว่าการดื่มน้ำร้อนสามารถป้องกันหรือรักษาโรคโควิด-19 ได้',
    publishedAt: '2020-03-18',
    credibility: 95,
    sourceType: SourceType.FACT_CHECKER,
  },
  {
    id: 'ref-3',
    sourceName: 'ศูนย์ต่อต้านข่าวปลอม',
    url: 'https://antifakenewscenter.com/covid-hot-water',
    stance: Stance.OPPOSING,
    excerpt: 'กระทรวงสาธารณสุขยืนยัน: การดื่มน้ำร้อนไม่มีประสิทธิภาพในการป้องกันโควิด-19',
    publishedAt: '2020-03-20',
    credibility: 88,
    sourceType: SourceType.GOV,
  },
];

export async function analyzeText(query: string): Promise<TextAnalysisResult> {
  const queryHash = hashQuery(query);

  // Check known fake claims first
  const knownFake = await prisma.knownFakeClaim.findFirst({
    where: { claimHash: queryHash },
  });

  if (knownFake) {
    return {
      verdict: knownFake.verdict as VerdictLevel,
      score: knownFake.verdict === VerdictLevel.DANGEROUS ? 5 : 25,
      confidence: 99,
      reasoning: [
        `⚠ พบในฐานข้อมูลข่าวปลอมที่ยืนยันแล้ว`,
        `! ${knownFake.evidence}`,
        `? ข้อมูลนี้ถูกตรวจสอบโดยผู้เชี่ยวชาญและองค์กรที่น่าเชื่อถือ`,
      ],
      references: MOCK_REFERENCES,
    };
  }

  // Partial match scoring
  const allFakeClaims = await prisma.knownFakeClaim.findMany();
  let partialMatchPenalty = 0;
  const reasoning: string[] = [];

  for (const claim of allFakeClaims) {
    const similarity = computeSimilarity(query.toLowerCase(), claim.claim.toLowerCase());
    if (similarity > 0.6) {
      partialMatchPenalty += 15;
      reasoning.push(`⚠ เนื้อหาคล้ายกับข่าวปลอมที่เคยถูกหักล้างแล้ว (ความคล้าย ${Math.round(similarity * 100)}%)`);
      break;
    }
  }

  // Base score + modifiers
  let score = 50;
  score -= partialMatchPenalty;
  score = Math.max(0, Math.min(100, score));

  if (reasoning.length === 0) {
    reasoning.push('? ไม่พบข้อมูลในฐานข้อมูลข่าวปลอมที่ยืนยันแล้ว');
    reasoning.push('? ควรตรวจสอบเพิ่มเติมจากแหล่งข้อมูลที่เชื่อถือได้');
    reasoning.push('! ผลการวิเคราะห์เบื้องต้น — AI อาจไม่มีข้อมูลครบถ้วน');
  }

  return {
    verdict: scoreToVerdict(score),
    score,
    confidence: 65,
    reasoning,
    references: MOCK_REFERENCES,
  };
}

function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
