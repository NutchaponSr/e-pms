-- CreateEnum
CREATE TYPE "CompetencyType" AS ENUM ('CC', 'FC', 'MC', 'TC');

-- CreateTable
CREATE TABLE "cultureRecord" (
    "id" TEXT NOT NULL,
    "cultureId" INTEGER NOT NULL,
    "meritFormId" TEXT NOT NULL,
    "evidence" TEXT,

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
    "weight" INTEGER NOT NULL DEFAULT 0,
    "expectedLevel" INTEGER,
    "input" TEXT,
    "output" TEXT,
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

-- AddForeignKey
ALTER TABLE "cultureRecord" ADD CONSTRAINT "cultureRecord_meritFormId_fkey" FOREIGN KEY ("meritFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureRecord" ADD CONSTRAINT "cultureRecord_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "culture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultureEvaluation" ADD CONSTRAINT "cultureEvaluation_cultureRecordId_fkey" FOREIGN KEY ("cultureRecordId") REFERENCES "cultureRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyRecord" ADD CONSTRAINT "competencyRecord_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyRecord" ADD CONSTRAINT "competencyRecord_meritFormId_fkey" FOREIGN KEY ("meritFormId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencyEvaluation" ADD CONSTRAINT "competencyEvaluation_competencyRecordId_fkey" FOREIGN KEY ("competencyRecordId") REFERENCES "competencyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
