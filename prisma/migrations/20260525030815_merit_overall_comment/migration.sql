-- CreateTable
CREATE TABLE "merit_overall_comment" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "commentOwner" TEXT,
    "commentChecker" TEXT,
    "commentApprover" TEXT,

    CONSTRAINT "merit_overall_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merit_overall_comment_formId_period_key" ON "merit_overall_comment"("formId", "period");

-- AddForeignKey
ALTER TABLE "merit_overall_comment" ADD CONSTRAINT "merit_overall_comment_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
