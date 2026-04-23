import { prisma } from '@/lib/prisma';
import { hashQuery } from '@/lib/hash';
import { VerdictLevel, scoreToVerdict, ReferenceItem } from '@/types';
import { analyzeTextForFakeNews, GeminiTextResult } from '@/lib/gemini';

export interface TextAnalysisResult {
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  reasoning: string[];
  references: ReferenceItem[];
}

export async function analyzeText(query: string): Promise<TextAnalysisResult> {
  const queryHash = hashQuery(query);

  // Check known fake claims first
  const knownFake = await prisma.knownFakeClaim.findFirst({
    where: { claimHash: queryHash },
  });

  if (knownFake) {
    const geminiResult = await analyzeTextForFakeNews(query);
    const score = knownFake.verdict === VerdictLevel.DANGEROUS ? 5 : 25;
    return {
      verdict: knownFake.verdict as VerdictLevel,
      score,
      confidence: 99,
      reasoning: [
        `⚠ พบในฐานข้อมูลข่าวปลอมที่ยืนยันแล้ว`,
        `! ${knownFake.evidence}`,
        ...(geminiResult?.reasoning ?? [`? ข้อมูลนี้ถูกตรวจสอบโดยผู้เชี่ยวชาญและองค์กรที่น่าเชื่อถือ`]),
      ],
      references: toReferenceItems(geminiResult?.references ?? []),
    };
  }

  // Partial match check against known fakes
  const allFakeClaims = await prisma.knownFakeClaim.findMany();
  let partialMatchPenalty = 0;
  const dbReasoning: string[] = [];

  for (const claim of allFakeClaims) {
    const similarity = computeSimilarity(query.toLowerCase(), claim.claim.toLowerCase());
    if (similarity > 0.6) {
      partialMatchPenalty += 15;
      dbReasoning.push(`⚠ เนื้อหาคล้ายกับข่าวปลอมที่เคยถูกหักล้างแล้ว (ความคล้าย ${Math.round(similarity * 100)}%)`);
      break;
    }
  }

  // Call Gemini for real analysis
  const geminiResult = await analyzeTextForFakeNews(query);

  if (geminiResult) {
    const score = Math.max(0, Math.min(100, geminiResult.score - partialMatchPenalty));
    return {
      verdict: scoreToVerdict(score),
      score,
      confidence: geminiResult.confidence,
      reasoning: [...dbReasoning, ...geminiResult.reasoning],
      references: toReferenceItems(geminiResult.references),
    };
  }

  // Fallback if Gemini unavailable
  let score = 50 - partialMatchPenalty;
  score = Math.max(0, Math.min(100, score));
  const reasoning = dbReasoning.length > 0 ? dbReasoning : [
    '? ไม่พบข้อมูลในฐานข้อมูลข่าวปลอมที่ยืนยันแล้ว',
    '? ควรตรวจสอบเพิ่มเติมจากแหล่งข้อมูลที่เชื่อถือได้',
    '! ผลการวิเคราะห์เบื้องต้น — AI อาจไม่มีข้อมูลครบถ้วน',
  ];

  return {
    verdict: scoreToVerdict(score),
    score,
    confidence: 30,
    reasoning,
    references: [],
  };
}

function toReferenceItems(
  refs: GeminiTextResult['references']
): ReferenceItem[] {
  return refs.map((r, i) => ({ ...r, id: `ref-${i + 1}` }));
}

function computeSimilarity(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = new Set(b.split(/\s+/));
  const intersection = wordsA.filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...Array.from(wordsB)]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}
