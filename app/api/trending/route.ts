import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return errorResponse('RATE_LIMITED', 429);

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? 'day';

  if (!['day', 'week', 'month'].includes(period)) {
    return errorResponse('VALIDATION_ERROR');
  }

  try {
    const entries = await prisma.trendingEntry.findMany({
      where: { period },
      orderBy: { count: 'desc' },
      take: 20,
      include: { analysis: { select: { query: true, createdAt: true } } },
    });

    const items = entries.map((e, i) => ({
      rank: i + 1,
      queryPreview: e.analysis?.query?.slice(0, 80) ?? 'ข้อมูลไม่พร้อมใช้งาน',
      checkCount: e.count,
      changePercent: Math.floor(Math.random() * 200) - 20, // mock delta
      lastVerdict: e.lastVerdict,
      analysisId: e.analysisId ?? '',
      lastCheckedAt: e.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      period,
      updatedAt: new Date().toISOString(),
      items,
    });
  } catch (e) {
    console.error('/api/trending error:', e);
    return errorResponse('INTERNAL_ERROR', 500);
  }
}
