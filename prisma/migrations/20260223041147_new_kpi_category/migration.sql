/*
  Warnings:

  - The values [FP,CP,IP,L_G] on the enum `KpiCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KpiCategory_new" AS ENUM ('CS1', 'CS2', 'CS3', 'CS4', 'CS5');
ALTER TABLE "kpi" ALTER COLUMN "category" TYPE "KpiCategory_new" USING ("category"::text::"KpiCategory_new");
ALTER TYPE "KpiCategory" RENAME TO "KpiCategory_old";
ALTER TYPE "KpiCategory_new" RENAME TO "KpiCategory";
DROP TYPE "public"."KpiCategory_old";
COMMIT;
