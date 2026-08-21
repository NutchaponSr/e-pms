-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_ownerId_fkey";
ALTER TABLE "task" DROP CONSTRAINT "task_checkerId_fkey";
ALTER TABLE "task" DROP CONSTRAINT "task_approverId_fkey";

-- AlterTable
ALTER TABLE "task" DROP COLUMN "ownerId",
DROP COLUMN "checkerId",
DROP COLUMN "approverId";
