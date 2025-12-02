-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('FILE', 'VIDEO', 'LINK');

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterialType" NOT NULL,
    "fileUrl" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "subjectId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
