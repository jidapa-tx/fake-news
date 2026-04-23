import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { hashQuery } from '@/lib/hash';
import { analyzeImage } from '@/services/image-analyzer';
import { VerdictLevel } from '@/types';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CaptionSchema = z.string().max(1000).optional();

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) return errorResponse('RATE_LIMITED', 429);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse('VALIDATION_ERROR');
  }

  const file = formData.get('image');
  if (!(file instanceof File)) return errorResponse('VALIDATION_ERROR');
  if (file.size > MAX_SIZE) return errorResponse('FILE_TOO_LARGE');
  if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('UNSUPPORTED_TYPE');

  const captionRaw = formData.get('caption');
  const captionParsed = CaptionSchema.safeParse(
    captionRaw instanceof File ? undefined : (captionRaw ?? undefined)
  );
  if (!captionParsed.success) return errorResponse('VALIDATION_ERROR');
  const caption = captionParsed.data;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await analyzeImage(buffer, file.type, caption);
    const queryHash = hashQuery(`image:${file.name}:${file.size}`);

    const analysis = await prisma.analysis.create({
      data: {
        query: `image:${file.name}`,
        queryType: 'image',
        queryHash,
        verdict: result.verdict as unknown as VerdictLevel,
        score: result.score,
        confidence: result.confidence,
        reasoning: result.reasoning,
      },
    });

    return NextResponse.json({
      analysisId: analysis.id,
      verdict: result.verdict,
      score: result.score,
      confidence: result.confidence,
      aiDetection: result.aiDetection,
      metadata: result.metadata,
      reverseImageSearch: result.reverseImageSearch,
      reasoning: result.reasoning,
    });
  } catch (e) {
    console.error('/api/analyze/image error:', e);
    return errorResponse('INTERNAL_ERROR', 500);
  }
}
