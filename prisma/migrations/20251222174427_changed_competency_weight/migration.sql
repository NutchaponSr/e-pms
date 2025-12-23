/*
  Warnings:

  - You are about to alter the column `weight` on the `competencyRecord` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "competencyRecord" ALTER COLUMN "weight" SET DEFAULT 0,
ALTER COLUMN "weight" SET DATA TYPE DECIMAL(10,2);
