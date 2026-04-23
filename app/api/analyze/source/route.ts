import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { analyzeSource } from '@/services/source-analyzer';

const Schema = z.object({
  url: z.string().url(),
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
  if (!parsed.success) return errorResponse('INVALID_URL');

  try {
    const result = await analyzeSource(parsed.data.url);
    return NextResponse.json({
      ...result,
      socialAccountAnalysis: {
        isMock: true,
        accountAge: '2 ปี',
        postFrequency: '45 โพสต์/วัน',
        followerRatio: 0.02,
        coordinatedBehavior: false,
        coordinatedCount: null,
      },
    });
  } catch (e) {
    console.error('/api/analyze/source error:', e);
    return errorResponse('INTERNAL_ERROR', 500);
  }
}
