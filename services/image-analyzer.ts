import { analyzeImageForAI, GeminiImageResult } from '@/lib/gemini';
import { VerdictLevel, scoreToVerdict } from '@/types';

export interface ImageMetadata {
  hasExif: boolean;
  dimensions: { width: number; height: number } | null;
  fileFormat: string;
  fileSizeKb: number;
  suspiciousSignals: string[];
}

export interface ImageAnalysisResult {
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  reasoning: string[];
  aiDetection: GeminiImageResult;
  metadata: ImageMetadata;
  reverseImageSearch: {
    isMock: true;
    firstSeenAt: string | null;
    appearances: number;
    topUrls: string[];
  };
}

export async function analyzeImage(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ImageAnalysisResult> {
  const base64 = buffer.toString('base64');
  const fileSizeKb = Math.round(buffer.length / 1024);

  // Extract EXIF (basic check for JPEG)
  const hasExif = mimeType === 'image/jpeg' && buffer.length > 100 &&
    buffer[0] === 0xFF && buffer[1] === 0xD8;

  // Suspicious signals
  const suspiciousSignals: string[] = [];
  if (!hasExif) suspiciousSignals.push('ไม่พบข้อมูล EXIF — อาจเป็นภาพที่ถูกสร้างหรือแก้ไข');
  if (fileSizeKb < 50) suspiciousSignals.push('ขนาดไฟล์เล็กผิดปกติสำหรับรูปภาพ');

  const metadata: ImageMetadata = {
    hasExif,
    dimensions: null,
    fileFormat: mimeType.split('/')[1]?.toUpperCase() ?? 'UNKNOWN',
    fileSizeKb,
    suspiciousSignals,
  };

  const aiDetection = await analyzeImageForAI(base64, mimeType);

  // Score: high AI probability → low credibility score
  let score = 100 - aiDetection.aiProbability;
  score = Math.max(0, Math.min(100, score));
  if (suspiciousSignals.length > 0) score -= 10 * suspiciousSignals.length;
  score = Math.max(0, score);

  const reasoning = [
    `⚠ โอกาสที่สร้างโดย AI: ${aiDetection.aiProbability}%`,
    ...aiDetection.reasoning,
    ...(suspiciousSignals.length > 0 ? [`! ${suspiciousSignals[0]}`] : []),
  ];

  return {
    verdict: scoreToVerdict(score),
    score,
    confidence: aiDetection.confidence,
    reasoning,
    aiDetection,
    metadata,
    reverseImageSearch: {
      isMock: true,
      firstSeenAt: null,
      appearances: 0,
      topUrls: [],
    },
  };
}
