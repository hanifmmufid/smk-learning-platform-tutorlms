-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'GRADED', 'LATE');

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "attachmentUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "feedback" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "submissions"("assignmentId", "studentId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
