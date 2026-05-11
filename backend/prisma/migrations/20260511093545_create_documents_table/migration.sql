-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "supersededBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
