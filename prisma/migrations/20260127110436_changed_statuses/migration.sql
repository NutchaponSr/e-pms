/*
  Warnings:

  - The values [PENDING_CHECKER,REJECTED_BY_CHECKER,PENDING_APPROVER,REJECTED_BY_APPROVER,DONE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('NOT_STARTED', 'IN_DRAFT', 'WAITING_APPROVER_1', 'WAITING_APPROVER_2', 'COMPLETED');
ALTER TABLE "public"."task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "task" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "task" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;
