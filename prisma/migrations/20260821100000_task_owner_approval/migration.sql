-- AlterTable
ALTER TABLE "task" ADD COLUMN "ownerId" VARCHAR(10),
ADD COLUMN "approvalId" TEXT;

-- Backfill owner from form
UPDATE "task" AS t
SET "ownerId" = f."employeeId"
FROM "Form" AS f
WHERE t."formId" = f."id";

-- Backfill approval from owner's current chain
UPDATE "task" AS t
SET "approvalId" = a."id"
FROM "approval" AS a
WHERE t."ownerId" = a."employeeId";

ALTER TABLE "task" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "task" ALTER COLUMN "approvalId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "task_ownerId_idx" ON "task"("ownerId");
CREATE INDEX "task_approvalId_idx" ON "task"("approvalId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task" ADD CONSTRAINT "task_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
