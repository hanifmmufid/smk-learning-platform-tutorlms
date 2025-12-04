import { useState, useEffect } from 'react';
import type { Quiz, QuestionType, QuizOption, QuizAttempt } from '../../services/quizService';
import {
  getAllQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  deleteQuestion,
  getQuizAttempts,
  getAttemptStatusColor,
  getAttemptStatusLabel,
  formatPercentage,
} from '../../services/quizService';
import { getAllSubjects } from '../../services/subjectService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { StatCard } from '../../components/widgets';
import { QuizCard } from '../../components/widgets';
import FilterBar from '../../components/ui/FilterBar';
import EmptyState from '../../components/ui/EmptyState';
import {
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Subject {
  id: string;
  name: string;
  class: { name: string };
}

export default function TeacherQuizzesPage() {
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useThemeStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    timeLimit: '',
    passingScore: 70,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showResults: true,
    status: 'DRAFT' as const,
  });

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    type: 'MCQ' as QuestionType,
    question: '',
    points: 10,
    order: 1,
    explanation: '',
    options: [
      { id: 'a', text: '', isCorrect: false },
      { id: 'b', text: '', isCorrect: false },
      { id: 'c', text: '', isCorrect: false },
      { id: 'd', text: '', isCorrect: false },
    ] as QuizOption[],
    maxWords: 100,
  });

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizzesData, subjectsData] = await Promise.all([
        getAllQuizzes(selectedSubject ? { subjectId: selectedSubject } : {}),
        getAllSubjects(),
      ]);

      // Filter subjects taught by this teacher
      const allSubjects: any[] = Array.isArray(subjectsData)
        ? subjectsData
        : (subjectsData as any).data || [];
      const teacherSubjects = allSubjects.filter(
        (s: any) => s.teacherId === user?.id
      );

      setQuizzes(quizzesData);
      setSubjects(teacherSubjects);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQuiz({
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Gagal membuat quiz');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Yakin ingin menghapus quiz ini?')) return;
    try {
      await deleteQuiz(id);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete quiz:', error);
      alert(error.response?.data?.message || 'Gagal menghapus quiz');
    }
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      alert('Tambahkan pertanyaan terlebih dahulu sebelum publish');
      return;
    }
    try {
      await updateQuiz(quiz.id, { status: 'PUBLISHED' });
      fetchData();
    } catch (error) {
      console.error('Failed to publish quiz:', error);
      alert('Gagal publish quiz');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    try {
      // Validate
      if (questionForm.type === 'MCQ' || questionForm.type === 'TRUE_FALSE') {
        const hasCorrect = questionForm.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          alert('Pilih minimal satu jawaban yang benar');
          return;
        }
      }

      await addQuestion(selectedQuiz.id, {
        ...questionForm,
        options: questionForm.type === 'ESSAY' ? undefined : questionForm.options,
        maxWords: questionForm.type === 'ESSAY' ? questionForm.maxWords : undefined,
      });

      // Refresh quiz questions
      const updatedQuizzes = await getAllQuizzes();
      setQuizzes(updatedQuizzes);
      const updatedQuiz = updatedQuizzes.find((q) => q.id === selectedQuiz.id);
      if (updatedQuiz) setSelectedQuiz(updatedQuiz);

      // Reset question form
      resetQuestionForm();
    } catch (error: any) {
      console.error('Failed to add question:', error);
      alert(error.response?.data?.message || 'Gagal menambah pertanyaan');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Yakin ingin menghapus pertanyaan ini?')) return;
    try {
      await deleteQuestion(questionId);

      // Refresh quiz questions
      const updatedQuizzes = await getAllQuizzes();
      setQuizzes(updatedQuizzes);
      if (selectedQuiz) {
        const updatedQuiz = updatedQuizzes.find((q) => q.id === selectedQuiz.id);
        if (updatedQuiz) setSelectedQuiz(updatedQuiz);
      }
    } catch (error: any) {
      console.error('Failed to delete question:', error);
      alert(error.response?.data?.message || 'Gagal menghapus pertanyaan');
    }
  };

  const handleViewAttempts = async (quiz: Quiz) => {
    try {
      const attemptsData = await getQuizAttempts(quiz.id);
      setAttempts(attemptsData);
      setSelectedQuiz(quiz);
      setShowAttemptsModal(true);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
      alert('Gagal memuat data attempts');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      timeLimit: '',
      passingScore: 70,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showResults: true,
      status: 'DRAFT',
    });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      type: 'MCQ',
      question: '',
      points: 10,
      order: (selectedQuiz?.questions?.length || 0) + 1,
      explanation: '',
      options: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false },
        { id: 'c', text: '', isCorrect: false },
        { id: 'd', text: '', isCorrect: false },
      ],
      maxWords: 100,
    });
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    if (type === 'TRUE_FALSE') {
      setQuestionForm({
        ...questionForm,
        type,
        options: [
          { id: 'true', text: 'Benar', isCorrect: false },
          { id: 'false', text: 'Salah', isCorrect: false },
        ],
      });
    } else if (type === 'MCQ') {
      setQuestionForm({
        ...questionForm,
        type,
        options: [
          { id: 'a', text: '', isCorrect: false },
          { id: 'b', text: '', isCorrect: false },
          { id: 'c', text: '', isCorrect: false },
          { id: 'd', text: '', isCorrect: false },
        ],
      });
    } else {
      setQuestionForm({ ...questionForm, type });
    }
  };

  // Filter quizzes based on search query
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: quizzes.length,
    draft: quizzes.filter((q) => q.status === 'DRAFT').length,
    published: quizzes.filter((q) => q.status === 'PUBLISHED').length,
    closed: quizzes.filter((q) => q.status === 'CLOSED').length,
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Sidebar
        user={{
          name: user?.name || 'Teacher',
          role: user?.role || 'TEACHER',
          email: user?.email,
        }}
        navItems={[]}
        isOpen={false}
        onToggle={() => {}}
        onLogout={() => {}}
        darkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
      />

      <div className="lg:pl-64">
        <Header
          user={{
            name: user?.name || 'Teacher',
            role: user?.role || 'TEACHER',
          }}
        />

        <main className="p-4 sm:p-6 lg:p-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
                  Kelola Quiz
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Buat dan kelola quiz untuk siswa Anda
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Buat Quiz Baru
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard
              title="Total Quiz"
              value={stats.total}
              icon={<DocumentTextIcon className="w-6 h-6" />}
              color="primary"
            />
            <StatCard
              title="Draft"
              value={stats.draft}
              icon={<PencilSquareIcon className="w-6 h-6" />}
              color="warning"
            />
            <StatCard
              title="Dipublikasikan"
              value={stats.published}
              icon={<CheckCircleIcon className="w-6 h-6" />}
              color="success"
            />
            <StatCard
              title="Ditutup"
              value={stats.closed}
              icon={<XCircleIcon className="w-6 h-6" />}
              color="danger"
            />
          </div>

          {/* Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Cari quiz..."
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            >
              <option value="">Semua Mata Pelajaran</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.class.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quiz Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon className="w-12 h-12" />}
              title="Belum ada quiz"
              description={
                searchQuery
                  ? 'Tidak ada quiz yang cocok dengan pencarian Anda'
                  : 'Mulai buat quiz pertama Anda untuk siswa'
              }
              action={{
                label: 'Buat Quiz Baru',
                onClick: () => setShowCreateModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  id={quiz.id}
                  title={quiz.title}
                  description={quiz.description}
                  subject={{
                    name: quiz.subject?.name || '',
                    class: quiz.subject?.class,
                  }}
                  totalQuestions={quiz.totalQuestions}
                  timeLimit={quiz.timeLimit}
                  passingScore={quiz.passingScore}
                  totalAttempts={quiz.totalAttempts}
                  status={quiz.status}
                  viewMode="teacher"
                  onManageQuestions={() => {
                    setSelectedQuiz(quiz);
                    setShowQuestionsModal(true);
                    resetQuestionForm();
                  }}
                  onPublish={() => handlePublishQuiz(quiz)}
                  onViewAttempts={() => handleViewAttempts(quiz)}
                  onDelete={() => handleDeleteQuiz(quiz.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Buat Quiz Baru</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Quiz *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran *
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.class.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batas Waktu (menit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    placeholder="Kosongkan untuk unlimited"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Acak urutan pertanyaan</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shuffleAnswers}
                    onChange={(e) => setFormData({ ...formData, shuffleAnswers: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Acak urutan jawaban</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showResults}
                    onChange={(e) => setFormData({ ...formData, showResults: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Tampilkan hasil ke siswa</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Buat Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQuestionsModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Kelola Pertanyaan - {selectedQuiz.title}</h2>
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Existing Questions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Pertanyaan ({selectedQuiz.questions?.length || 0})</h3>
              <div className="space-y-4">
                {selectedQuiz.questions?.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {q.type}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{q.points} poin</span>
                        </div>
                        <p className="font-medium">{idx + 1}. {q.question}</p>
                        {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && q.options && (
                          <div className="mt-2 ml-4 space-y-1">
                            {q.options.map((opt: any) => (
                              <div key={opt.id} className="flex items-center gap-2 text-sm">
                                <span className={opt.isCorrect ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                  {opt.id}. {opt.text}
                                  {opt.isCorrect && ' ✓'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Question Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Tambah Pertanyaan Baru</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pertanyaan</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">Benar/Salah</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pertanyaan *</label>
                  <textarea
                    required
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poin</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                    />
                  </div>

                  {questionForm.type === 'ESSAY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Kata</label>
                      <input
                        type="number"
                        min="10"
                        value={questionForm.maxWords}
                        onChange={(e) => setQuestionForm({ ...questionForm, maxWords: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* MCQ Options */}
                {(questionForm.type === 'MCQ' || questionForm.type === 'TRUE_FALSE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilihan Jawaban (centang yang benar)
                    </label>
                    <div className="space-y-2">
                      {questionForm.options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options];
                              newOptions[idx].isCorrect = e.target.checked;
                              setQuestionForm({ ...questionForm, options: newOptions });
                            }}
                            className="w-5 h-5"
                          />
                          <span className="w-8 text-center font-medium">{opt.id}.</span>
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options];
                              newOptions[idx].text = e.target.value;
                              setQuestionForm({ ...questionForm, options: newOptions });
                            }}
                            placeholder={`Pilihan ${opt.id.toUpperCase()}`}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                            disabled={questionForm.type === 'TRUE_FALSE'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penjelasan (opsional)
                  </label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    rows={2}
                    placeholder="Penjelasan akan ditampilkan setelah siswa submit"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Tambah Pertanyaan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Attempts Modal */}
      {showAttemptsModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Student Attempts - {selectedQuiz.title}</h2>
              <button
                onClick={() => setShowAttemptsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Skor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Persentase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Waktu Submit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {attempt.student?.name}
                        </div>
                        <div className="text-sm text-gray-500">{attempt.student?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAttemptStatusColor(attempt.status)}`}>
                          {getAttemptStatusLabel(attempt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {attempt.score !== null && attempt.score !== undefined ? attempt.score : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatPercentage(attempt.percentage)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleString('id-ID')
                          : 'Belum submit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {attempts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada siswa yang mengerjakan quiz ini
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
