-- Recurring windows: drop year, store month/day only

-- Keep one row per (formType, period) — latest year wins
DELETE FROM "evaluationWindow" a
USING "evaluationWindow" b
WHERE a."formType" = b."formType"
  AND a."period" = b."period"
  AND a."year" < b."year";

ALTER TABLE "evaluationWindow" ADD COLUMN "openMonth" INTEGER;
ALTER TABLE "evaluationWindow" ADD COLUMN "openDay" INTEGER;
ALTER TABLE "evaluationWindow" ADD COLUMN "closeMonth" INTEGER;
ALTER TABLE "evaluationWindow" ADD COLUMN "closeDay" INTEGER;

-- Stored timestamps are UTC; cycle dates were saved as Asia/Bangkok
UPDATE "evaluationWindow"
SET
  "openMonth" = EXTRACT(MONTH FROM ("openAt" + INTERVAL '7 hours'))::INTEGER,
  "openDay" = EXTRACT(DAY FROM ("openAt" + INTERVAL '7 hours'))::INTEGER,
  "closeMonth" = EXTRACT(MONTH FROM ("closeAt" + INTERVAL '7 hours'))::INTEGER,
  "closeDay" = EXTRACT(DAY FROM ("closeAt" + INTERVAL '7 hours'))::INTEGER;

ALTER TABLE "evaluationWindow" ALTER COLUMN "openMonth" SET NOT NULL;
ALTER TABLE "evaluationWindow" ALTER COLUMN "openDay" SET NOT NULL;
ALTER TABLE "evaluationWindow" ALTER COLUMN "closeMonth" SET NOT NULL;
ALTER TABLE "evaluationWindow" ALTER COLUMN "closeDay" SET NOT NULL;

DROP INDEX "evaluationWindow_year_formType_period_key";

ALTER TABLE "evaluationWindow" DROP COLUMN "year";
ALTER TABLE "evaluationWindow" DROP COLUMN "openAt";
ALTER TABLE "evaluationWindow" DROP COLUMN "closeAt";

CREATE UNIQUE INDEX "evaluationWindow_formType_period_key" ON "evaluationWindow"("formType", "period");
