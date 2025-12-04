import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import type { Quiz, Question, QuizAttempt } from '../../services/quizService';
import {
  getAllQuizzes,
  getMyAttempts,
  startQuizAttempt,
  submitQuizAttempt,
  getAttemptResults,
  isQuizAvailable,
  formatTimeRemaining,
  calculateTimeRemaining,
  formatPercentage,
  checkPassed,
} from '../../services/quizService';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Breadcrumb from '../../components/layout/Breadcrumb';
import QuizCard from '../../components/widgets/QuizCard';
import StatCard from '../../components/widgets/StatCard';
import FilterBar from '../../components/ui/FilterBar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function StudentQuizzesPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [myAttempts, setMyAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [attemptResults, setAttemptResults] = useState<QuizAttempt | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Start timer if taking quiz with time limit
    if (takingQuiz && currentAttempt && currentQuiz?.timeLimit) {
      const updateTimer = () => {
        const { remaining, isExpired } = calculateTimeRemaining(
          currentAttempt.startedAt,
          currentQuiz.timeLimit
        );

        setTimeRemaining(remaining);

        if (isExpired && !timerRef.current) {
          handleSubmitQuiz(true); // Auto-submit when time's up
        }
      };

      updateTimer(); // Initial update
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [takingQuiz, currentAttempt, currentQuiz]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizzesData, attemptsData] = await Promise.all([
        getAllQuizzes({ status: 'PUBLISHED' }),
        getMyAttempts(),
      ]);

      // Filter only available quizzes
      const available = quizzesData.filter(isQuizAvailable);

      setAvailableQuizzes(available);
      setMyAttempts(attemptsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    // Check if already attempted
    const existingAttempt = myAttempts.find((a) => a.quizId === quiz.id);
    if (existingAttempt && existingAttempt.status !== 'IN_PROGRESS') {
      alert('Anda sudah mengerjakan quiz ini');
      return;
    }

    if (!confirm(`Mulai mengerjakan "${quiz.title}"?`)) return;

    try {
      const { attempt, quiz: quizData } = await startQuizAttempt(quiz.id);

      setCurrentQuiz(quizData);
      setCurrentAttempt(attempt);
      setQuestions(quizData.questions || []);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTakingQuiz(true);
    } catch (error: any) {
      console.error('Failed to start quiz:', error);
      alert(error.response?.data?.message || 'Gagal memulai quiz');
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Yakin ingin submit quiz? Jawaban tidak bisa diubah lagi.')) {
      return;
    }

    if (!currentAttempt || !currentQuiz) return;

    try {
      // Calculate time spent
      const startTime = new Date(currentAttempt.startedAt).getTime();
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000); // seconds

      // Format answers
      const formattedAnswers = questions.map((q) => {
        const answer = answers[q.id];
        let answerData: any;

        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          answerData = { selectedOption: answer || '' };
        } else if (q.type === 'ESSAY') {
          answerData = { text: answer || '' };
        }

        return {
          questionId: q.id,
          answer: answerData,
        };
      });

      await submitQuizAttempt(currentAttempt.id, {
        answers: formattedAnswers,
        timeSpent,
      });

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Show results
      const resultsData = await getAttemptResults(currentAttempt.id);
      setAttemptResults(resultsData);
      setShowResults(true);
      setTakingQuiz(false);

      // Refresh attempts
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      alert(error.response?.data?.message || 'Gagal submit quiz');
    }
  };

  const handleViewResults = async (attempt: QuizAttempt) => {
    try {
      const resultsData = await getAttemptResults(attempt.id);
      setAttemptResults(resultsData);
      setCurrentQuiz(resultsData.quiz || null);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      alert('Gagal memuat hasil quiz');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasNextQuestion = currentQuestionIndex < questions.length - 1;
  const hasPrevQuestion = currentQuestionIndex > 0;

  // Calculate statistics
  const stats = {
    totalQuizzes: availableQuizzes.length,
    completed: myAttempts.filter((a) => a.status === 'GRADED').length,
    pending: myAttempts.filter((a) => a.status === 'IN_PROGRESS').length,
    passed: myAttempts.filter((a) => a.isPassed === true).length,
  };

  // Filter quizzes
  const filteredQuizzes = availableQuizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/student/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/student/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/student/grades', icon: ChartBarIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          user={{ name: user?.name || 'Student', role: 'STUDENT', email: user?.email }}
          navItems={navItems}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        darkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
        />
        <div className="lg:pl-80">
          <Header
            user={{ name: user?.name || 'Student', role: 'STUDENT' }}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} showImage={false} lines={4} />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Taking Quiz View
  if (takingQuiz && currentQuiz && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Timer & Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentQuiz.title}</h2>
              <p className="text-gray-600 mt-1">
                Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
              </p>
            </div>
            {currentQuiz.timeLimit && (
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-300">Waktu Tersisa</div>
                <div
                  className={`text-3xl font-bold ${
                    timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'
                  }`}
                >
                  {formatTimeRemaining(timeRemaining)}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                {currentQuestion.type}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{currentQuestion.points} poin</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{currentQuestion.question}</h3>
          </div>

          {/* Answer Input */}
          {currentQuestion.type === 'MCQ' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900 dark:text-white">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'TRUE_FALSE' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900 dark:text-white">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'ESSAY' && (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={8}
                placeholder="Tulis jawaban Anda di sini..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              {currentQuestion.maxWords && (
                <p className="text-sm text-gray-500 mt-2">
                  Maksimal {currentQuestion.maxWords} kata
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={!hasPrevQuestion}
            className={`px-6 py-3 rounded-lg font-medium ${
              hasPrevQuestion
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            ← Sebelumnya
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-lg font-medium ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[questions[idx].id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {hasNextQuestion ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Selanjutnya →
            </button>
          ) : (
            <button
              onClick={() => handleSubmitQuiz(false)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results View (keeping original design as it's already good)
  if (showResults && attemptResults) {
    const passed = checkPassed(attemptResults.percentage, attemptResults.quiz?.passingScore);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hasil Quiz: {attemptResults.quiz?.title}
            </h2>
            <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(attemptResults.percentage)}
            </div>
            <div className="flex justify-center gap-8 text-lg">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Skor: </span>
                <span className="font-bold">{attemptResults.score}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Status: </span>
                <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? 'LULUS' : 'TIDAK LULUS'}
                </span>
              </div>
            </div>
          </div>

          {/* Answer Review */}
          {attemptResults.answers && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review Jawaban</h3>
              {attemptResults.answers.map((ans, idx) => {
                const question = ans.question;
                if (!question) return null;

                const isCorrect = ans.isCorrect;
                const studentAnswer = ans.answer as any;

                return (
                  <div
                    key={ans.id}
                    className={`border-2 rounded-lg p-6 ${
                      isCorrect === true
                        ? 'border-green-200 bg-green-50'
                        : isCorrect === false
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {question.type}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{question.points} poin</span>
                          {isCorrect !== null && (
                            <span
                              className={`text-sm font-semibold ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isCorrect ? '✓ Benar' : '✗ Salah'}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 mb-3">
                          {idx + 1}. {question.question}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-300">Poin Diperoleh</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {ans.pointsAwarded !== null ? ans.pointsAwarded : '-'} / {question.points}
                        </div>
                      </div>
                    </div>

                    {/* Student Answer */}
                    {(question.type === 'MCQ' || question.type === 'TRUE_FALSE') && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Jawaban Anda:</div>
                        {question.options && question.options.map((opt: any) => {
                          const isSelected = studentAnswer?.selectedOption === opt.id;
                          const isCorrectOption = opt.isCorrect;

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded mb-2 ${
                                isSelected && isCorrectOption
                                  ? 'bg-green-100 border-2 border-green-500'
                                  : isSelected && !isCorrectOption
                                  ? 'bg-red-100 border-2 border-red-500'
                                  : isCorrectOption
                                  ? 'bg-green-50 border border-green-300'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className="text-gray-900 dark:text-white">
                                {opt.text}
                                {isSelected && ' (Jawaban Anda)'}
                                {isCorrectOption && ' ✓ (Jawaban Benar)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'ESSAY' && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Jawaban Anda:</div>
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          {studentAnswer?.text || '-'}
                        </div>
                        {ans.feedback && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback Guru:</div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              {ans.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-medium text-blue-900 mb-1">Penjelasan:</div>
                        <div className="text-sm text-blue-800">{question.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setShowResults(false);
                setAttemptResults(null);
                setCurrentQuiz(null);
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Kembali ke Daftar Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz List View - REDESIGNED
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        user={{
          name: user?.name || 'Student',
          role: 'STUDENT',
          email: user?.email,
        }}
        navItems={navItems}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        darkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
      />

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Header */}
        <Header
          user={{
            name: user?.name || 'Student',
            role: 'STUDENT',
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Quiz Saya', icon: AcademicCapIcon },
            ]}
            className="mb-6"
          />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Kerjakan quiz untuk mengukur pemahaman Anda
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Quiz"
              value={stats.totalQuizzes}
              color="primary"
              icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Selesai"
              value={stats.completed}
              color="success"
              icon={<CheckCircleIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Sedang Dikerjakan"
              value={stats.pending}
              color="warning"
              icon={<ClockIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Lulus"
              value={stats.passed}
              color="info"
              icon={<TrophyIcon className="w-8 h-8" />}
            />
          </div>

          {/* Filter Bar */}
          <div className="mb-6">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Cari quiz..."
            />
          </div>

          {/* Quizzes Grid */}
          {filteredQuizzes.length === 0 ? (
            <EmptyState
              icon={<ClipboardDocumentListIcon className="w-16 h-16 text-gray-300" />}
              title={searchQuery ? 'Tidak ada quiz yang sesuai' : 'Belum ada quiz tersedia'}
              description={
                searchQuery
                  ? 'Coba ubah kata kunci pencarian Anda'
                  : 'Quiz baru akan muncul di sini ketika guru membuat quiz untuk mata pelajaran yang kamu ikuti'
              }
              action={
                searchQuery
                  ? {
                      label: 'Hapus Pencarian',
                      onClick: () => setSearchQuery(''),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => {
                  const attempt = myAttempts.find((a) => a.quizId === quiz.id);

                  return (
                    <QuizCard
                      key={quiz.id}
                      id={quiz.id}
                      title={quiz.title}
                      description={quiz.description}
                      subject={{
                        name: quiz.subject?.name || 'Lainnya',
                        class: quiz.subject?.class,
                      }}
                      totalQuestions={quiz.totalQuestions}
                      timeLimit={quiz.timeLimit}
                      passingScore={quiz.passingScore}
                      myAttempt={attempt}
                      onStart={() => handleStartQuiz(quiz)}
                      onViewResults={() => attempt && handleViewResults(attempt)}
                      viewMode="student"
                    />
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    Menampilkan <strong>{filteredQuizzes.length}</strong> quiz
                  </span>
                  {searchQuery && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Hasil pencarian: "{searchQuery}"
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
