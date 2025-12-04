import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import type {
  StudentGrades,
  SubjectGrade,
  StudentProgress
} from '../../services/gradeService';
import {
  getStudentGrades,
  getStudentProgress,
  formatPercentage,
  formatScore,
  formatDate,
  getGradeColor,
  getLetterGradeBadgeColor,
  groupTimelineByMonth
} from '../../services/gradeService';
import {
  TrophyIcon,
  AcademicCapIcon as AcademicCapOutlineIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';

const StudentGradesPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [grades, setGrades] = useState<StudentGrades | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectGrade | null>(null);
  const [viewMode, setViewMode] = useState<'grades' | 'progress'>('grades');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/student/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/student/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/student/grades', icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchGrades();
    fetchProgress();
  }, [user]);

  const fetchGrades = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getStudentGrades(user.id);
      setGrades(data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const data = await getStudentProgress(user.id);
      setProgress(data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        <div className="lg:pl-80">
          <Header
            user={{
              name: user?.name || 'Student',
              role: 'STUDENT',
            }}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main className="p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <div className="lg:pl-80">
        <Header
          user={{
            name: user?.name || 'Student',
            role: 'STUDENT',
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nilai Saya 📊
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Pantau progress belajar dan nilai dari semua mata pelajaran
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('grades')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'grades'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              📊 Nilai
            </button>
            <button
              onClick={() => setViewMode('progress')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              📈 Progress
            </button>
          </div>

          {viewMode === 'grades' ? (
            <>
              {/* Statistics Cards */}
              {grades && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <TrophyIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata</p>
                        <p className={`text-2xl font-bold ${getGradeColor(grades.statistics.overallAverage)}`}>
                          {formatPercentage(grades.statistics.overallAverage)}
                        </p>
                      </div>
                    </div>
                    {grades.statistics.letterGrade && (
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLetterGradeBadgeColor(grades.statistics.letterGrade)}`}>
                        Grade: {grades.statistics.letterGrade}
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
                        <BookOpenIcon className="w-6 h-6 text-success-600 dark:text-success-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mata Pelajaran</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {grades.statistics.totalSubjects}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                        <ClipboardDocumentCheckIcon className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tugas Dinilai</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {grades.subjects.reduce((sum, s) => sum + s.assignments.count, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
                        <AcademicCapOutlineIcon className="w-6 h-6 text-info-600 dark:text-info-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quiz Lulus</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {grades.subjects.reduce((sum, s) => sum + s.quizzes.passed, 0)} /{' '}
                          {grades.subjects.reduce((sum, s) => sum + s.quizzes.count, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subjects Grades */}
              {grades && grades.subjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {grades.subjects.map((subject) => (
                    <div
                      key={subject.subject.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {subject.subject.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {subject.subject.class} • {subject.subject.teacher}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${getGradeColor(subject.overallGrade)}`}>
                            {subject.overallGrade !== null ? subject.overallGrade.toFixed(1) : '-'}
                          </p>
                          {subject.letterGrade && (
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getLetterGradeBadgeColor(subject.letterGrade)}`}>
                              {subject.letterGrade}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tugas</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(subject.assignments.average)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {subject.assignments.count} tugas
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quiz</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(subject.quizzes.average)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {subject.quizzes.passed}/{subject.quizzes.count} lulus
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-12 text-center">
                  <ChartBarSquareIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Belum ada nilai</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Kerjakan tugas dan quiz untuk mendapatkan nilai
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Progress View */}
              {progress && progress.timeline.length > 0 ? (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tugas Selesai</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.statistics.totalAssignments}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: {formatPercentage(progress.statistics.assignmentAverage)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Selesai</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress.statistics.totalQuizzes}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: {formatPercentage(progress.statistics.quizAverage)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Lulus</p>
                      <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                        {progress.statistics.quizzesPassed}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Tidak Lulus</p>
                      <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                        {progress.statistics.quizzesFailed}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      Timeline Nilai
                    </h3>
                    <div className="space-y-6">
                      {Object.entries(groupTimelineByMonth(progress.timeline)).map(([month, items]) => (
                        <div key={month}>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            {month}
                          </p>
                          <div className="space-y-3">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className={`p-2 rounded-lg ${item.type === 'assignment' ? 'bg-warning-100 dark:bg-warning-900/30' : 'bg-info-100 dark:bg-info-900/30'}`}>
                                  {item.type === 'assignment' ? (
                                    <DocumentTextIcon className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                  ) : (
                                    <AcademicCapIcon className="w-5 h-5 text-info-600 dark:text-info-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.subject} • {formatDate(item.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${getGradeColor(item.percentage)}`}>
                                    {item.percentage.toFixed(1)}%
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatScore(item.score, item.maxScore)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-12 text-center">
                  <ChartBarSquareIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Belum ada data progress</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Progress akan muncul setelah tugas dan quiz dinilai
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubject(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedSubject.subject.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedSubject.subject.class} • {selectedSubject.subject.teacher}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Assignments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tugas ({selectedSubject.assignments.count})
                </h3>
                {selectedSubject.assignments.details.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSubject.assignments.details.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {assignment.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Dinilai: {formatDate(assignment.gradedAt)}
                            </p>
                            {assignment.feedback && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                                <span className="font-medium">Feedback:</span> {assignment.feedback}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-2xl font-bold ${getGradeColor(assignment.percentage)}`}>
                              {assignment.percentage?.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatScore(assignment.score, assignment.maxScore)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Belum ada tugas yang dinilai
                  </p>
                )}
              </div>

              {/* Quizzes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quiz ({selectedSubject.quizzes.count})
                </h3>
                {selectedSubject.quizzes.details.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSubject.quizzes.details.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {quiz.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Dikerjakan: {formatDate(quiz.submittedAt)}
                            </p>
                            {quiz.isPassed !== undefined && quiz.isPassed !== null && (
                              <span
                                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                  quiz.isPassed
                                    ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                    : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                }`}
                              >
                                {quiz.isPassed ? 'Lulus' : 'Tidak Lulus'}
                              </span>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-2xl font-bold ${getGradeColor(quiz.percentage)}`}>
                              {quiz.percentage?.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatScore(quiz.score, quiz.maxScore)}
                            </p>
                            {quiz.timeSpent && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                ⏱️ {Math.floor(quiz.timeSpent / 60)}m {quiz.timeSpent % 60}s
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Belum ada quiz yang dinilai
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGradesPage;
