import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashQuery } from '@/lib/hash';
import { errorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { analyzeText } from '@/services/text-analyzer';
import { analyzeSource } from '@/services/source-analyzer';
import { VerdictLevel } from '@/types';

const Schema = z.object({
  query: z.string().min(10).max(5000),
  queryType: z.enum(['text', 'url']),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return errorResponse('RATE_LIMITED', 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('VALIDATION_ERROR');
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === 'String must contain at most 5000 character(s)') {
      return errorResponse('TEXT_TOO_LONG');
    }
    if ((body as Record<string, unknown>)?.queryType === 'url') return errorResponse('INVALID_URL');
    return errorResponse('VALIDATION_ERROR');
  }

  const { query, queryType } = parsed.data;

  if (queryType === 'url') {
    try { new URL(query); } catch { return errorResponse('INVALID_URL'); }
  }

  try {
    const queryHash = hashQuery(query);

    // Check cache
    const cached = await prisma.analysis.findFirst({
      where: { queryHash },
      include: { references: true },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      const sourceAnalysis = queryType === 'url' ? await analyzeSource(query) : undefined;
      return NextResponse.json({
        analysisId: cached.id,
        verdict: cached.verdict,
        score: cached.score,
        confidence: cached.confidence,
        reasoning: cached.reasoning,
        references: cached.references,
        sourceAnalysis,
        cachedAt: cached.createdAt.toISOString(),
      });
    }

    const result = await analyzeText(query);
    const sourceAnalysis = queryType === 'url' ? await analyzeSource(query) : undefined;

    const analysis = await prisma.analysis.create({
      data: {
        query,
        queryType,
        queryHash,
        verdict: result.verdict as unknown as VerdictLevel,
        score: result.score,
        confidence: result.confidence,
        reasoning: result.reasoning,
        references: {
          create: result.references.map((r) => ({
            sourceName: r.sourceName,
            url: r.url,
            stance: r.stance as unknown as never,
            excerpt: r.excerpt,
            publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
            credibility: r.credibility,
            sourceType: r.sourceType as unknown as never,
          })),
        },
      },
      include: { references: true },
    });

    // Upsert trending
    await prisma.trendingEntry.upsert({
      where: { queryHash_period: { queryHash, period: 'day' } },
      update: { count: { increment: 1 }, lastVerdict: result.verdict as unknown as VerdictLevel, analysisId: analysis.id },
      create: { queryHash, period: 'day', count: 1, lastVerdict: result.verdict as unknown as VerdictLevel, analysisId: analysis.id },
    });

    return NextResponse.json({
      analysisId: analysis.id,
      verdict: analysis.verdict,
      score: analysis.score,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      references: analysis.references,
      sourceAnalysis,
    });
  } catch (e) {
    console.error('/api/analyze/text error:', e);
    return errorResponse('INTERNAL_ERROR', 500);
  }
}
