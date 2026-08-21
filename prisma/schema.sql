-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_STARTED', 'IN_DRAFT', 'WAITING_APPROVER_1', 'WAITING_APPROVER_2', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('MERIT', 'KPI');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('IN_DRAFT', 'EVALUATION', 'EVALUATION_1ST', 'EVALUATION_2ND');

-- CreateEnum
CREATE TYPE "KpiCategory" AS ENUM ('CS1', 'CS2', 'CS3', 'CS4', 'CS5');

-- CreateEnum
CREATE TYPE "CompetencyType" AS ENUM ('CC', 'FC', 'MC', 'TC');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "username" TEXT NOT NULL,
    "displayUsername" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "position" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "checkerId" TEXT,
    "approverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluationWindow" (
    "id" TEXT NOT NULL,
    "formType" "FormType" NOT NULL,
    "period" "Period" NOT NULL,
    "open" JSONB NOT NULL,
    "close" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluationWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "context" JSONB DEFAULT '{}',
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "ownerId" VARCHAR(10) NOT NULL,
    "approvalId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "FormType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL DEFAULT 'IN_DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overallComment" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "commentOwner" TEXT,
    "commentChecker" TEXT,
    "commentApprover" TEXT,

    CONSTRAINT "overallComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "connectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "category" "KpiCategory",
    "weight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "objective" TEXT,
    "strategy" TEXT,
    "method" TEXT,
    "target100" TEXT,
    "target80" TEXT,
    "target90" TEXT,
    "target70" TEXT,
    "target60" TEXT,
    "definition" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "result" TEXT,
    "actualOwner" TEXT,
    "achievementOwner" INTEGER,
    "actualChecker" TEXT,
    "achievementChecker" INTEGER,
    "actualApprover" TEXT,
    "achievementApprover" INTEGER,
    "fileUrl" TEXT,
    "order" INTEGER NOT NULL,
    "formId" TEXT NOT NULL,

    CONSTRAINT "kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultureRecord" (
    "id" TEXT NOT NULL,
    "cultureId" INTEGER NOT NULL,
    "meritFormId" TEXT NOT NULL,
    "evidence" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "cultureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultureEvaluation" (
    "id" TEXT NOT NULL,
    "cultureRecordId" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "result" TEXT,
    "levelBehaviorOwner" INTEGER,
    "levelBehaviorChecker" INTEGER,
    "levelBehaviorApprover" INTEGER,
    "actualOwner" TEXT,
    "actualChecker" TEXT,
    "actualApprover" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultureEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culture" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(1) NOT NULL,
    "description" TEXT NOT NULL,
    "belief" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "culture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT,
    "t5" TEXT,
    "t4" TEXT,
    "t3" TEXT,
    "t2" TEXT,
    "t1" TEXT,
    "type" "CompetencyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencyRecord" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT,
    "meritFormId" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expectedLevel" INTEGER,
    "input" TEXT,
    "output" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencyEvaluation" (
    "id" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "result" TEXT,
    "actualOwner" TEXT,
    "levelOwner" INTEGER,
    "actualChecker" TEXT,
    "levelChecker" INTEGER,
    "actualApprover" TEXT,
    "levelApprover" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "competencyRecordId" TEXT NOT NULL,

    CONSTRAINT "competencyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attach" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "attach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_employeeId_key" ON "approval"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluationWindow_formType_period_key" ON "evaluationWindow"("formType", "period");

-- CreateIndex
CREATE INDEX "task_ownerId_idx" ON "task"("ownerId");

-- CreateIndex
CREATE INDEX "task_approvalId_idx" ON "task"("approvalId");

-- CreateIndex
CREATE UNIQUE INDEX "overallComment_formId_period_key" ON "overallComment"("formId", "period");

-- CreateIndex
CREATE INDEX "comment_createdBy_idx" ON "comment"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_id_key" ON "kpi"("id");

-- CreateIndex
CREATE INDEX "kpi_formId_idx" ON "kpi"("formId");

-- CreateIndex
CREATE INDEX "cultureRecord_meritFormId_idx" ON "cultureRecord"("meritFormId");

-- CreateIndex
CREATE INDEX "cultureRecord_cultureId_idx" ON "cultureRecord"("cultureId");

-- CreateIndex
CREATE INDEX "cultureEvaluation_cultureRecordId_idx" ON "cultureEvaluation"("cultureRecordId");

-- CreateIndex
CREATE INDEX "competencyRecord_competencyId_idx" ON "competencyRecord"("competencyId");

-- CreateIndex
CREATE INDEX "competencyRecord_meritFormId_idx" ON "competencyRecord"("meritFormId");

-- CreateIndex
CREATE INDEX "competencyEvaluation_competencyRecordId_idx" ON "competencyEvaluation"("competencyRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "attach_url_key" ON "attach"("url");

-- CreateIndex
CREATE INDEX "attach_createdBy_idx" ON "attach"("createdBy");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_username_fkey" FOREIGN KEY ("username") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overallComment" ADD CONSTRAINT "overallComment_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi" ADD CONSTRAINT "kpi_fileUrl_fkey" FOREIGN KEY ("fileUrl") REFERENCES "attach"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi" ADD CONSTRAINT "kpi_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureRecord" ADD CONSTRAINT "cultureRecord_meritFormId_fkey" FOREIGN KEY ("meritFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureRecord" ADD CONSTRAINT "cultureRecord_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureEvaluation" ADD CONSTRAINT "cultureEvaluation_fileUrl_fkey" FOREIGN KEY ("fileUrl") REFERENCES "attach"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureEvaluation" ADD CONSTRAINT "cultureEvaluation_cultureRecordId_fkey" FOREIGN KEY ("cultureRecordId") REFERENCES "cultureRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyRecord" ADD CONSTRAINT "competencyRecord_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyRecord" ADD CONSTRAINT "competencyRecord_meritFormId_fkey" FOREIGN KEY ("meritFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyEvaluation" ADD CONSTRAINT "competencyEvaluation_fileUrl_fkey" FOREIGN KEY ("fileUrl") REFERENCES "attach"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyEvaluation" ADD CONSTRAINT "competencyEvaluation_competencyRecordId_fkey" FOREIGN KEY ("competencyRecordId") REFERENCES "competencyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attach" ADD CONSTRAINT "attach_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
