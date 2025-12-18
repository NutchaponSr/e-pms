/*
  Warnings:

  - Made the column `approverId` on table `task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `approvedAt` on table `task` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_approverId_fkey";

-- AlterTable
ALTER TABLE "task" ALTER COLUMN "approverId" SET NOT NULL,
ALTER COLUMN "approvedAt" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
