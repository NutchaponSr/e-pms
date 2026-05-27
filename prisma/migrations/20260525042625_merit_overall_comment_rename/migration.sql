/*
  Warnings:

  - You are about to drop the `merit_overall_comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "merit_overall_comment" DROP CONSTRAINT "merit_overall_comment_formId_fkey";

-- DropTable
DROP TABLE "merit_overall_comment";

-- CreateTable
CREATE TABLE "meritOverallComment" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "commentOwner" TEXT,
    "commentChecker" TEXT,
    "commentApprover" TEXT,

    CONSTRAINT "meritOverallComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meritOverallComment_formId_period_key" ON "meritOverallComment"("formId", "period");

-- AddForeignKey
ALTER TABLE "meritOverallComment" ADD CONSTRAINT "meritOverallComment_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
