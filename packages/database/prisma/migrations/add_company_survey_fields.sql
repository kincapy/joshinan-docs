-- 企業アンケート機能: Company テーブルへのカラム追加 + 関連テーブル作成
-- 実行先: Supabase SQL Editor

-- Company テーブルへのカラム追加（アンケートで収集する追加情報）
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "businessDescription" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "capitalAmount" BIGINT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "fullTimeEmployees" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "faxNumber" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "surveyRespondedAt" TIMESTAMPTZ;

-- 企業の役員情報テーブル（アンケートから収集）
CREATE TABLE IF NOT EXISTS "company_officers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "nameKana" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "company_officers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_officers_companyId_idx" ON "company_officers"("companyId");
ALTER TABLE "company_officers" ADD CONSTRAINT "company_officers_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 企業の決算情報テーブル（アンケートから収集、直近3年分）
CREATE TABLE IF NOT EXISTS "company_financials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "revenue" BIGINT,
  "ordinaryIncome" BIGINT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "company_financials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_financials_companyId_fiscalYear_key"
  ON "company_financials"("companyId", "fiscalYear");
CREATE INDEX IF NOT EXISTS "company_financials_companyId_idx" ON "company_financials"("companyId");
ALTER TABLE "company_financials" ADD CONSTRAINT "company_financials_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
