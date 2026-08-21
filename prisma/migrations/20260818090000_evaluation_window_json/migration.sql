ALTER TABLE "evaluationWindow" ADD COLUMN "open" JSONB;
ALTER TABLE "evaluationWindow" ADD COLUMN "close" JSONB;

UPDATE "evaluationWindow"
SET
  "open" = jsonb_build_object('month', "openMonth", 'day', "openDay"),
  "close" = jsonb_build_object('month', "closeMonth", 'day', "closeDay");

ALTER TABLE "evaluationWindow" ALTER COLUMN "open" SET NOT NULL;
ALTER TABLE "evaluationWindow" ALTER COLUMN "close" SET NOT NULL;

ALTER TABLE "evaluationWindow" DROP COLUMN "openMonth";
ALTER TABLE "evaluationWindow" DROP COLUMN "openDay";
ALTER TABLE "evaluationWindow" DROP COLUMN "closeMonth";
ALTER TABLE "evaluationWindow" DROP COLUMN "closeDay";
