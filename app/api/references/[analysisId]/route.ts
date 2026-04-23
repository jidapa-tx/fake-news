import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return errorResponse('RATE_LIMITED', 429);

  const { analysisId } = await params;

  try {
    const references = await prisma.reference.findMany({
      where: { analysisId },
      orderBy: { credibility: 'desc' },
    });

    if (references.length === 0) {
      const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
      if (!analysis) return errorResponse('NOT_FOUND', 404);
    }

    return NextResponse.json(references);
  } catch (e) {
    console.error('/api/references error:', e);
    return errorResponse('INTERNAL_ERROR', 500);
  }
}
