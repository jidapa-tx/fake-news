import { prisma } from '@/lib/prisma';
import { SourceAnalysisResult } from '@/types';

export async function analyzeSource(url: string): Promise<SourceAnalysisResult> {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    return buildResult('unknown', null, 'none', false, false, ['suspicious']);
  }

  // Check trusted sources
  const trustedSource = await prisma.trustedSource.findFirst({
    where: { domain: { contains: domain } },
  });

  if (trustedSource) {
    return {
      domain,
      domainAgeDays: 3650,
      sslStatus: 'valid',
      whoisPrivacy: false,
      isKnownPhishing: false,
      riskLevel: 'safe',
      riskReasonsTh: [],
    };
  }

  // Check suspicious domains
  const suspiciousDomain = await prisma.suspiciousDomain.findFirst({
    where: { domain: { contains: domain } },
  });

  if (suspiciousDomain) {
    return {
      domain,
      domainAgeDays: 30,
      sslStatus: 'none',
      whoisPrivacy: true,
      isKnownPhishing: true,
      riskLevel: suspiciousDomain.riskLevel === 'high' ? 'dangerous' : 'suspicious',
      riskReasonsTh: [suspiciousDomain.reason],
    };
  }

  // Unknown domain — heuristic assessment
  const riskReasons: string[] = [];
  const isXyzDomain = domain.endsWith('.xyz') || domain.endsWith('.info');

  if (isXyzDomain) riskReasons.push('โดเมนระดับบนที่ไม่น่าเชื่อถือ (.xyz, .info)');

  const riskLevel = riskReasons.length > 0 ? 'suspicious' : 'safe';

  return {
    domain,
    domainAgeDays: null,
    sslStatus: 'valid',
    whoisPrivacy: false,
    isKnownPhishing: false,
    riskLevel,
    riskReasonsTh: riskReasons,
  };
}

function buildResult(
  domain: string,
  domainAgeDays: number | null,
  sslStatus: 'valid' | 'invalid' | 'none',
  whoisPrivacy: boolean,
  isKnownPhishing: boolean,
  riskReasons: string[]
): SourceAnalysisResult {
  return {
    domain,
    domainAgeDays,
    sslStatus,
    whoisPrivacy,
    isKnownPhishing,
    riskLevel: 'suspicious',
    riskReasonsTh: riskReasons,
  };
}
