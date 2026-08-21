-- CreateTable
CREATE TABLE "evaluationWindow" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "formType" "FormType" NOT NULL,
    "period" "Period" NOT NULL,
    "openAt" TIMESTAMP(3) NOT NULL,
    "closeAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluationWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluationWindow_year_formType_period_key" ON "evaluationWindow"("year", "formType", "period");
