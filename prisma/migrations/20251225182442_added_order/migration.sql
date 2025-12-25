/*
  Warnings:

  - Added the required column `employeeId` to the `Form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `competencyRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `cultureRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `kpi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "competencyRecord" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "cultureRecord" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "kpi" ADD COLUMN     "order" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
