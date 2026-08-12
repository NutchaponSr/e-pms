-- Rename table for shared Merit + KPI overall comments (preserve data)
ALTER TABLE "meritOverallComment" RENAME TO "overallComment";

ALTER INDEX "meritOverallComment_pkey" RENAME TO "overallComment_pkey";

ALTER INDEX "meritOverallComment_formId_period_key" RENAME TO "overallComment_formId_period_key";

ALTER TABLE "overallComment" RENAME CONSTRAINT "meritOverallComment_formId_fkey" TO "overallComment_formId_fkey";
