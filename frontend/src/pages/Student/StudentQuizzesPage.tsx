import { useState, useEffect, useRef } from 'react';
import type { Quiz, Question, QuizAttempt } from '../../services/quizService';
import {
  getAllQuizzes,
  getMyAttempts,
  startQuizAttempt,
  submitQuizAttempt,
  getAttemptResults,
  isQuizAvailable,
  formatTimeLimit,
  formatTimeRemaining,
  calculateTimeRemaining,
  formatPercentage,
  checkPassed,
} from '../../services/quizService';

export default function StudentQuizzesPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
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
              <h2 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h2>
              <p className="text-gray-600 mt-1">
                Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
              </p>
            </div>
            {currentQuiz.timeLimit && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Waktu Tersisa</div>
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
              <span className="text-sm text-gray-600">{currentQuestion.points} poin</span>
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
                  <span className="ml-3 text-gray-900">{option.text}</span>
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
                  <span className="ml-3 text-gray-900">{option.text}</span>
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

  // Results View
  if (showResults && attemptResults) {
    const passed = checkPassed(attemptResults.percentage, attemptResults.quiz?.passingScore);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Hasil Quiz: {attemptResults.quiz?.title}
            </h2>
            <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(attemptResults.percentage)}
            </div>
            <div className="flex justify-center gap-8 text-lg">
              <div>
                <span className="text-gray-600">Skor: </span>
                <span className="font-bold">{attemptResults.score}</span>
              </div>
              <div>
                <span className="text-gray-600">Status: </span>
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
                          <span className="text-sm text-gray-600">{question.points} poin</span>
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
                        <div className="text-sm text-gray-600">Poin Diperoleh</div>
                        <div className="text-lg font-bold text-gray-900">
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
                              <span className="text-gray-900">
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
                            <div className="text-sm font-medium text-gray-700 mb-1">Feedback Guru:</div>
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

  // Quiz List View
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Saya</h1>
        <p className="text-gray-600">Kerjakan quiz untuk mengukur pemahaman Anda</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalQuizzes}</div>
          <div className="text-gray-600">Total Quiz Tersedia</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.completed}</div>
          <div className="text-gray-600">Quiz Selesai</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pending}</div>
          <div className="text-gray-600">Sedang Dikerjakan</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.passed}</div>
          <div className="text-gray-600">Quiz Lulus</div>
        </div>
      </div>

      {/* Available Quizzes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Tersedia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableQuizzes.map((quiz) => {
            const attempt = myAttempts.find((a) => a.quizId === quiz.id);
            const isCompleted = attempt && attempt.status !== 'IN_PROGRESS';

            return (
              <div key={quiz.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                {isCompleted && (
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Sudah Dikerjakan
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Mata Pelajaran:</span>
                    <span className="font-semibold">{quiz.subject?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pertanyaan:</span>
                    <span className="font-semibold">{quiz.totalQuestions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span className="font-semibold">{formatTimeLimit(quiz.timeLimit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passing Score:</span>
                    <span className="font-semibold">{quiz.passingScore}%</span>
                  </div>
                </div>

                {isCompleted ? (
                  <button
                    onClick={() => attempt && handleViewResults(attempt)}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                  >
                    Lihat Hasil
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {attempt?.status === 'IN_PROGRESS' ? 'Lanjutkan Quiz' : 'Mulai Quiz'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {availableQuizzes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Belum ada quiz yang tersedia</p>
          </div>
        )}
      </div>

      {/* My Attempts History */}
      {myAttempts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Quiz</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Skor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Persentase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.quiz?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {attempt.quiz?.subject?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {attempt.score !== null ? attempt.score : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPercentage(attempt.percentage)}
                      </td>
                      <td className="px-6 py-4">
                        {attempt.isPassed !== null && (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              attempt.isPassed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {attempt.isPassed ? 'LULUS' : 'TIDAK LULUS'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleDateString('id-ID')
                          : 'Sedang Dikerjakan'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
