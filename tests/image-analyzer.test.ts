import { describe, it, expect, vi } from 'vitest';
import { VerdictLevel } from '@/types';

vi.mock('@/lib/gemini', () => ({
  analyzeImageForAI: vi.fn(),
}));

describe('analyzeImage', () => {
  it('returns low score for high AI probability', async () => {
    const { analyzeImageForAI } = await import('@/lib/gemini');
    vi.mocked(analyzeImageForAI).mockResolvedValueOnce({
      aiProbability: 95,
      detectedModel: 'Midjourney',
      reasoning: ['ตรวจพบลักษณะของ AI'],
      confidence: 90,
    });

    const { analyzeImage } = await import('@/services/image-analyzer');
    const buffer = Buffer.alloc(100);
    const result = await analyzeImage(buffer, 'image/png', 'test.png');
    expect(result.score).toBeLessThan(20);
    expect([VerdictLevel.DANGEROUS, VerdictLevel.SUSPICIOUS]).toContain(result.verdict);
  });

  it('returns fallback data on Gemini API failure', async () => {
    const { analyzeImageForAI } = await import('@/lib/gemini');
    vi.mocked(analyzeImageForAI).mockResolvedValueOnce({
      aiProbability: 50,
      detectedModel: 'unknown',
      reasoning: ['ไม่สามารถวิเคราะห์ได้ในขณะนี้'],
      confidence: 0,
    });

    const { analyzeImage } = await import('@/services/image-analyzer');
    const buffer = Buffer.alloc(100);
    const result = await analyzeImage(buffer, 'image/jpeg', 'test.jpg');
    expect(result.aiDetection.confidence).toBe(0);
    expect(result.metadata).toBeDefined();
  });

  it('flags missing EXIF as suspicious signal for PNG', async () => {
    const { analyzeImageForAI } = await import('@/lib/gemini');
    vi.mocked(analyzeImageForAI).mockResolvedValueOnce({
      aiProbability: 30,
      detectedModel: 'unknown',
      reasoning: ['ดูเป็นธรรมชาติ'],
      confidence: 70,
    });

    const { analyzeImage } = await import('@/services/image-analyzer');
    const buffer = Buffer.alloc(200);
    const result = await analyzeImage(buffer, 'image/png', 'test.png');
    expect(result.metadata.suspiciousSignals.length).toBeGreaterThan(0);
  });

  it('includes mock reverse image search result', async () => {
    const { analyzeImageForAI } = await import('@/lib/gemini');
    vi.mocked(analyzeImageForAI).mockResolvedValueOnce({
      aiProbability: 20,
      detectedModel: 'unknown',
      reasoning: ['ดูเป็นรูปถ่ายจริง'],
      confidence: 80,
    });

    const { analyzeImage } = await import('@/services/image-analyzer');
    const buffer = Buffer.alloc(500);
    const result = await analyzeImage(buffer, 'image/webp', 'test.webp');
    expect(result.reverseImageSearch.isMock).toBe(true);
  });

  it('normalizes score to 0-100 range', async () => {
    const { analyzeImageForAI } = await import('@/lib/gemini');
    vi.mocked(analyzeImageForAI).mockResolvedValueOnce({
      aiProbability: 100,
      detectedModel: 'DALL-E',
      reasoning: ['สร้างโดย AI ชัดเจน'],
      confidence: 98,
    });

    const { analyzeImage } = await import('@/services/image-analyzer');
    const buffer = Buffer.alloc(100);
    const result = await analyzeImage(buffer, 'image/jpeg', 'ai.jpg');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
