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

-- CreateIndex
CREATE UNIQUE INDEX "approval_employeeId_key" ON "approval"("employeeId");

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
