-- CreateEnum
CREATE TYPE "VerdictLevel" AS ENUM ('DANGEROUS', 'SUSPICIOUS', 'UNCERTAIN', 'LIKELY_TRUE', 'VERIFIED');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('SUPPORTING', 'OPPOSING', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TRUSTED_MEDIA', 'FACT_CHECKER', 'ACADEMIC', 'GOV', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "verdict" "VerdictLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reasoning" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "stance" "Stance" NOT NULL,
    "excerpt" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "credibility" INTEGER NOT NULL,
    "sourceType" "SourceType" NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTh" TEXT,
    "domain" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "credibility" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnownFakeClaim" (
    "id" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "claimHash" TEXT NOT NULL,
    "verdict" "VerdictLevel" NOT NULL,
    "evidence" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnownFakeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspiciousDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspiciousDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingEntry" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastVerdict" "VerdictLevel" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "analysisId" TEXT,

    CONSTRAINT "TrendingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_queryHash_idx" ON "Analysis"("queryHash");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "Reference_analysisId_idx" ON "Reference"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedSource_domain_key" ON "TrustedSource"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "KnownFakeClaim_claimHash_key" ON "KnownFakeClaim"("claimHash");

-- CreateIndex
CREATE INDEX "KnownFakeClaim_claimHash_idx" ON "KnownFakeClaim"("claimHash");

-- CreateIndex
CREATE UNIQUE INDEX "SuspiciousDomain_domain_key" ON "SuspiciousDomain"("domain");

-- CreateIndex
CREATE INDEX "TrendingEntry_period_count_idx" ON "TrendingEntry"("period", "count");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingEntry_queryHash_period_key" ON "TrendingEntry"("queryHash", "period");

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingEntry" ADD CONSTRAINT "TrendingEntry_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
