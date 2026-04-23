import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Stance, SourceType } from '@/types';

const generateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: (...args: unknown[]) => generateContent(...args) };
  },
}));

describe('lib/gemini', () => {
  beforeEach(() => {
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeTextForFakeNews', () => {
    it('returns null when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      const res = await analyzeTextForFakeNews('claim');
      expect(res).toBeNull();
    });

    it('parses a valid JSON response and merges grounding URLs', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({
          score: 20,
          confidence: 85,
          reasoning: ['r1', 'r2'],
          references: [
            { sourceName: 'BBC', stance: 'OPPOSING', excerpt: 'x', sourceType: 'TRUSTED_MEDIA', credibility: 90, publishedAt: '2024-01-01' },
          ],
        }),
        candidates: [
          { groundingMetadata: { groundingChunks: [{ web: { uri: 'https://bbc.com/a', title: 'BBC Story' } }] } },
        ],
      });
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      const res = await analyzeTextForFakeNews('claim');
      expect(res).not.toBeNull();
      expect(res!.score).toBe(20);
      expect(res!.references[0].url).toBe('https://bbc.com/a');
      expect(res!.references[0].stance).toBe(Stance.OPPOSING);
      expect(res!.references[0].sourceType).toBe(SourceType.TRUSTED_MEDIA);
    });

    it('defaults invalid stance/sourceType to NEUTRAL/UNKNOWN', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({
          score: 50,
          confidence: 50,
          reasoning: ['r'],
          references: [
            { sourceName: 'X', stance: 'BOGUS', excerpt: '', sourceType: 'NOPE', credibility: 'bad', publishedAt: null },
          ],
        }),
        candidates: [],
      });
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      const res = await analyzeTextForFakeNews('claim');
      expect(res!.references[0].stance).toBe(Stance.NEUTRAL);
      expect(res!.references[0].sourceType).toBe(SourceType.UNKNOWN);
      expect(res!.references[0].credibility).toBe(50);
      expect(res!.references[0].url).toBe('');
    });

    it('appends leftover grounding URLs beyond parsed references (cap 4)', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({ score: 60, confidence: 60, reasoning: [], references: [] }),
        candidates: [
          { groundingMetadata: { groundingChunks: Array.from({ length: 6 }, (_, i) => ({ web: { uri: `https://x/${i}`, title: `T${i}` } })) } },
        ],
      });
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      const res = await analyzeTextForFakeNews('claim');
      expect(res!.references.length).toBe(4);
      expect(res!.references[0].url).toBe('https://x/0');
    });

    it('returns null when response contains no JSON object', async () => {
      generateContent.mockResolvedValue({ text: 'no json here', candidates: [] });
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      expect(await analyzeTextForFakeNews('claim')).toBeNull();
    });

    it('returns null when the SDK throws', async () => {
      generateContent.mockRejectedValue(new Error('network'));
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      expect(await analyzeTextForFakeNews('claim')).toBeNull();
    });

    it('clamps score/confidence to 0-100', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({ score: 999, confidence: -5, reasoning: ['x'], references: [] }),
        candidates: [],
      });
      const { analyzeTextForFakeNews } = await import('@/lib/gemini');
      const res = await analyzeTextForFakeNews('claim');
      expect(res!.score).toBeLessThanOrEqual(100);
      expect(res!.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeImageForAI', () => {
    it('returns FALLBACK when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      const { analyzeImageForAI } = await import('@/lib/gemini');
      const res = await analyzeImageForAI('base64', 'image/png');
      expect(res.aiProbability).toBe(50);
      expect(res.confidence).toBe(0);
    });

    it('parses a valid JSON image response', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({ aiProbability: 80, detectedModel: 'Midjourney', reasoning: ['a', 'b'], confidence: 90 }),
      });
      const { analyzeImageForAI } = await import('@/lib/gemini');
      const res = await analyzeImageForAI('b64', 'image/png');
      expect(res.aiProbability).toBe(80);
      expect(res.detectedModel).toBe('Midjourney');
    });

    it('includes caption text when provided', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({ aiProbability: 10, detectedModel: 'unknown', reasoning: ['ok'], confidence: 50 }),
      });
      const { analyzeImageForAI } = await import('@/lib/gemini');
      await analyzeImageForAI('b64', 'image/jpeg', 'my caption');
      const call = generateContent.mock.calls[0][0] as { contents: Array<{ text?: string }> };
      expect(call.contents.some((p) => p.text?.includes('my caption'))).toBe(true);
    });

    it('returns FALLBACK when no JSON is in the response', async () => {
      generateContent.mockResolvedValue({ text: 'garbage' });
      const { analyzeImageForAI } = await import('@/lib/gemini');
      const res = await analyzeImageForAI('b64', 'image/png');
      expect(res.aiProbability).toBe(50);
      expect(res.detectedModel).toBe('unknown');
    });

    it('returns FALLBACK when the SDK throws', async () => {
      generateContent.mockRejectedValue(new Error('boom'));
      const { analyzeImageForAI } = await import('@/lib/gemini');
      const res = await analyzeImageForAI('b64', 'image/png');
      expect(res.aiProbability).toBe(50);
    });

    it('coerces non-array reasoning into an array', async () => {
      generateContent.mockResolvedValue({
        text: JSON.stringify({ aiProbability: 40, detectedModel: 'unknown', reasoning: 'single string', confidence: 30 }),
      });
      const { analyzeImageForAI } = await import('@/lib/gemini');
      const res = await analyzeImageForAI('b64', 'image/png');
      expect(Array.isArray(res.reasoning)).toBe(true);
      expect(res.reasoning[0]).toBe('single string');
    });
  });
});
