/*
  Warnings:

  - You are about to drop the column `target120` on the `kpi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "kpi" DROP COLUMN "target120",
ADD COLUMN     "target60" TEXT;
