-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_STARTED', 'IN_DRAFT', 'PENDING_CHECKER', 'REJECTED_BY_CHECKER', 'PENDING_APPROVER', 'REJECTED_BY_APPROVER', 'DONE');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('MERIT', 'KPI');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('IN_DRAFT', 'EVALUATION', 'EVALUATION_1ST', 'EVALUATION_2ND');

-- CreateEnum
CREATE TYPE "KpiCategory" AS ENUM ('FP', 'CP', 'IP', 'L_G');

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
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "context" JSONB DEFAULT '{}',
    "status" "Status" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkerId" TEXT,
    "checkedAt" TIMESTAMP(3),
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "formId" TEXT NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "type" "FormType" NOT NULL,
    "year" INTEGER NOT NULL,
    "period" "Period" NOT NULL DEFAULT 'IN_DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "category" "KpiCategory",
    "weight" INTEGER NOT NULL DEFAULT 0,
    "objective" TEXT,
    "strategy" TEXT,
    "method" TEXT,
    "target100" TEXT,
    "target120" TEXT,
    "target80" TEXT,
    "target90" TEXT,
    "target70" TEXT,
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
    "formId" TEXT NOT NULL,

    CONSTRAINT "kpi_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "kpi_id_key" ON "kpi"("id");

-- CreateIndex
CREATE INDEX "kpi_formId_idx" ON "kpi"("formId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_username_fkey" FOREIGN KEY ("username") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi" ADD CONSTRAINT "kpi_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
