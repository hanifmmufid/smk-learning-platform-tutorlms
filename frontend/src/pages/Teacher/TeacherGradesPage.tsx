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
import type { SubjectGradebook, GradebookStudent } from '../../services/gradeService';
import {
  getSubjectGradebook,
  exportGradebookCSV,
  formatPercentage,
  formatScore,
  getGradeColor,
  getLetterGradeBadgeColor
} from '../../services/gradeService';
import { getAllSubjects, type SubjectType } from '../../services/subjectService';
import {
  ArrowDownTrayIcon,
  ChartBarIcon as ChartBarOutlineIcon,
  UsersIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

const TeacherGradesPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [gradebook, setGradebook] = useState<SubjectGradebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<GradebookStudent | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/teacher/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/teacher/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/teacher/grades', icon: ChartBarIcon },
  ];

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchGradebook();
    }
  }, [selectedSubjectId]);

  const fetchSubjects = async () => {
    try {
      const data = await getAllSubjects();
      // Filter to only show teacher's own subjects
      const mySubjects = data.filter((s: SubjectType) => s.teacherId === user?.id);
      setSubjects(mySubjects);

      // Auto-select first subject
      if (mySubjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(mySubjects[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchGradebook = async () => {
    if (!selectedSubjectId) return;

    try {
      setLoading(true);
      const data = await getSubjectGradebook(selectedSubjectId);
      setGradebook(data);
    } catch (error) {
      console.error('Failed to fetch gradebook:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedSubjectId) return;

    try {
      setExporting(true);
      await exportGradebookCSV(selectedSubjectId);
    } catch (error) {
      console.error('Failed to export gradebook:', error);
      alert('Gagal mengeksport gradebook. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        user={{
          name: user?.name || 'Teacher',
          role: 'TEACHER',
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
            name: user?.name || 'Teacher',
            role: 'TEACHER',
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Buku Nilai 📊
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Lihat dan kelola nilai siswa per mata pelajaran
            </p>
          </div>

          {/* Subject Selector & Export */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Mata Pelajaran
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih Mata Pelajaran...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} - {subject.class?.name || 'Unknown Class'}
                  </option>
                ))}
              </select>
            </div>
            {gradebook && (
              <div className="flex items-end">
                <button
                  onClick={handleExportCSV}
                  disabled={exporting || !gradebook}
                  className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  {exporting ? 'Mengeksport...' : 'Export CSV'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : gradebook ? (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Siswa</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {gradebook.students.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                      <DocumentTextIcon className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {gradebook.assignments.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
                      <AcademicCapIcon className="w-6 h-6 text-info-600 dark:text-info-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Quiz</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {gradebook.quizzes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gradebook Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Siswa
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Rata-rata Tugas
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Rata-rata Quiz
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Nilai Akhir
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Detail
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {gradebook.students.map((student) => (
                        <tr
                          key={student.student.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                  {student.student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {student.student.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {student.student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-semibold ${getGradeColor(student.averages.assignments)}`}>
                              {formatPercentage(student.averages.assignments)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-semibold ${getGradeColor(student.averages.quizzes)}`}>
                              {formatPercentage(student.averages.quizzes)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-lg font-bold ${getGradeColor(student.averages.overall)}`}>
                              {student.averages.overall !== null
                                ? student.averages.overall.toFixed(1)
                                : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {student.averages.letterGrade && (
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLetterGradeBadgeColor(student.averages.letterGrade)}`}
                              >
                                {student.averages.letterGrade}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
                            >
                              Lihat Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {gradebook.students.length === 0 && (
                  <div className="py-12 text-center">
                    <DocumentChartBarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Belum ada siswa terdaftar</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-12 text-center">
              <ChartBarOutlineIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Pilih mata pelajaran untuk melihat buku nilai
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && gradebook && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedStudent.student.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedStudent.student.email}
              </p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Tugas</p>
                  <p className={`text-xl font-bold ${getGradeColor(selectedStudent.averages.assignments)}`}>
                    {formatPercentage(selectedStudent.averages.assignments)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Quiz</p>
                  <p className={`text-xl font-bold ${getGradeColor(selectedStudent.averages.quizzes)}`}>
                    {formatPercentage(selectedStudent.averages.quizzes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nilai Akhir</p>
                  <p className={`text-xl font-bold ${getGradeColor(selectedStudent.averages.overall)}`}>
                    {selectedStudent.averages.overall !== null
                      ? selectedStudent.averages.overall.toFixed(1)
                      : '-'}
                  </p>
                </div>
                {selectedStudent.averages.letterGrade && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grade</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLetterGradeBadgeColor(selectedStudent.averages.letterGrade)}`}
                    >
                      {selectedStudent.averages.letterGrade}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Assignments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tugas
                </h3>
                <div className="space-y-3">
                  {selectedStudent.assignments.map((assignment) => {
                    return (
                      <div
                        key={assignment.assignmentId}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {assignment.assignmentTitle}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Status: {assignment.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getGradeColor(assignment.percentage)}`}>
                              {formatPercentage(assignment.percentage)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatScore(assignment.score, assignment.maxScore)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quizzes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quiz
                </h3>
                <div className="space-y-3">
                  {selectedStudent.quizzes.map((quiz) => {
                    return (
                      <div
                        key={quiz.quizId}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {quiz.quizTitle}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Status: {quiz.status}
                              </span>
                              {quiz.isPassed !== null && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    quiz.isPassed
                                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                      : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                  }`}
                                >
                                  {quiz.isPassed ? 'Lulus' : 'Tidak Lulus'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getGradeColor(quiz.percentage)}`}>
                              {formatPercentage(quiz.percentage)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatScore(quiz.score, quiz.maxScore)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
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

export default TeacherGradesPage;
