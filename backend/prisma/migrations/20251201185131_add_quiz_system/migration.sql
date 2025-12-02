-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'ESSAY', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "timeLimit" INTEGER,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "explanation" TEXT,
    "options" JSONB,
    "maxWords" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "percentage" DOUBLE PRECISION,
    "isPassed" BOOLEAN,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "timeSpent" INTEGER,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsAwarded" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quizId_studentId_key" ON "quiz_attempts"("quizId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_attemptId_questionId_key" ON "answers"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
