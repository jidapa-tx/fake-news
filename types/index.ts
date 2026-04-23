export enum VerdictLevel {
  DANGEROUS = 'DANGEROUS',
  SUSPICIOUS = 'SUSPICIOUS',
  UNCERTAIN = 'UNCERTAIN',
  LIKELY_TRUE = 'LIKELY_TRUE',
  VERIFIED = 'VERIFIED',
}

export enum Stance {
  SUPPORTING = 'SUPPORTING',
  OPPOSING = 'OPPOSING',
  NEUTRAL = 'NEUTRAL',
}

export enum SourceType {
  TRUSTED_MEDIA = 'TRUSTED_MEDIA',
  FACT_CHECKER = 'FACT_CHECKER',
  ACADEMIC = 'ACADEMIC',
  GOV = 'GOV',
  UNKNOWN = 'UNKNOWN',
}

export function scoreToVerdict(score: number): VerdictLevel {
  if (score <= 20) return VerdictLevel.DANGEROUS;
  if (score <= 40) return VerdictLevel.SUSPICIOUS;
  if (score <= 60) return VerdictLevel.UNCERTAIN;
  if (score <= 80) return VerdictLevel.LIKELY_TRUE;
  return VerdictLevel.VERIFIED;
}

export interface ApiError {
  error: {
    code: string;
    message_th: string;
    message_en: string;
  };
}

export interface HistoryItem {
  id: string;
  queryType: 'text' | 'url' | 'image';
  queryPreview: string;
  query: string;
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  analysisId: string;
  createdAt: string;
}

export interface HistoryExport {
  version: '1.0';
  exported_at: string;
  items: HistoryItem[];
}

export interface ReferenceItem {
  id: string;
  sourceName: string;
  url: string;
  stance: Stance;
  excerpt: string;
  publishedAt: string | null;
  credibility: number;
  sourceType: SourceType;
}

export interface SourceAnalysisResult {
  domain: string;
  domainAgeDays: number | null;
  sslStatus: 'valid' | 'invalid' | 'none';
  whoisPrivacy: boolean;
  isKnownPhishing: boolean;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  riskReasonsTh: string[];
}

export interface TextAnalyzeResponse {
  analysisId: string;
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  reasoning: string[];
  references: ReferenceItem[];
  sourceAnalysis?: SourceAnalysisResult;
  cachedAt?: string;
}

export interface TrendingItem {
  rank: number;
  queryPreview: string;
  checkCount: number;
  changePercent: number;
  lastVerdict: VerdictLevel;
  analysisId: string;
  lastCheckedAt: string;
}

export interface TrendingResponse {
  period: 'day' | 'week' | 'month';
  updatedAt: string;
  items: TrendingItem[];
}
