-- AlterTable
ALTER TABLE "Application" DROP COLUMN "institutionName",
DROP COLUMN "institutionType",
DROP COLUMN "registrationNumber",
ADD COLUMN     "institutionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_tinNumber_key" ON "Institution"("tinNumber");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
