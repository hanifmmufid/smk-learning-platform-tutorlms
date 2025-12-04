import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import type { Assignment } from '../../services/assignmentService';
import {
  getAllAssignments,
} from '../../services/assignmentService';
import type { Submission } from '../../services/submissionService';
import {
  getAllSubmissions,
  submitAssignment,
} from '../../services/submissionService';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Breadcrumb from '../../components/layout/Breadcrumb';
import AssignmentCard from '../../components/widgets/AssignmentCard';
import StatCard from '../../components/widgets/StatCard';
import FilterBar from '../../components/ui/FilterBar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface AssignmentWithSubmission extends Assignment {
  mySubmission?: Submission;
}

export default function StudentAssignmentsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Get all published assignments from enrolled subjects
      const assignmentsRes = await getAllAssignments({ status: 'PUBLISHED' });

      // Get my submissions
      const submissionsRes = await getAllSubmissions({ studentId: user?.id });

      if (assignmentsRes.success && submissionsRes.success) {
        const assignmentsData: Assignment[] = assignmentsRes.data;
        const submissionsData: Submission[] = submissionsRes.data;

        // Merge assignments with submissions
        const merged: AssignmentWithSubmission[] = assignmentsData.map((assignment) => {
          const mySubmission = submissionsData.find(
            (sub) => sub.assignmentId === assignment.id
          );
          return { ...assignment, mySubmission };
        });

        setAssignments(merged);
        setError('');
      }
    } catch (err: any) {
      console.error('Error loading assignments:', err);
      setError(err.response?.data?.error || 'Gagal memuat tugas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setSubmitContent('');
    setSubmitFile(null);
    setError('');
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedAssignment(null);
    setSubmitContent('');
    setSubmitFile(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!submitContent && !submitFile) {
      setError('Minimal isi jawaban teks atau upload file');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await submitAssignment(selectedAssignment.id, {
        content: submitContent,
        file: submitFile || undefined,
      });

      if (res.success) {
        setSuccess('Tugas berhasil dikumpulkan!');
        closeSubmitModal();
        loadAssignments(); // Reload to update submission status
      }
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.error || 'Gagal mengumpulkan tugas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmitFile(e.target.files[0]);
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = (() => {
      if (!filterStatus) return true;
      const now = new Date();
      const deadline = new Date(assignment.dueDate);
      const isOverdue = now > deadline;

      if (filterStatus === 'not-submitted') return !assignment.mySubmission && !isOverdue;
      if (filterStatus === 'submitted') return assignment.mySubmission?.status === 'SUBMITTED';
      if (filterStatus === 'graded') return assignment.mySubmission?.status === 'GRADED';
      if (filterStatus === 'overdue') return !assignment.mySubmission && isOverdue;
      return true;
    })();

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    notSubmitted: assignments.filter((a) => !a.mySubmission).length,
    graded: assignments.filter((a) => a.mySubmission?.status === 'GRADED').length,
    overdue: assignments.filter((a) => {
      const now = new Date();
      const deadline = new Date(a.dueDate);
      return !a.mySubmission && now > deadline;
    }).length,
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/student/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/student/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/student/grades', icon: ChartBarIcon },
  ];

  const filterOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'not-submitted', label: 'Belum Dikerjakan' },
    { value: 'submitted', label: 'Menunggu Penilaian' },
    { value: 'graded', label: 'Sudah Dinilai' },
    { value: 'overdue', label: 'Terlambat' },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isOverdue = (dueDate: string): boolean => {
    return new Date() > new Date(dueDate);
  };

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
              { label: 'Tugas Saya', icon: DocumentTextIcon },
            ]}
            className="mb-6"
          />

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tugas Saya
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Lihat dan kerjakan tugas dari guru
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 text-success-800 dark:text-success-300 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && !showSubmitModal && (
            <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Tugas"
              value={stats.total}
              color="primary"
              icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Belum Dikerjakan"
              value={stats.notSubmitted}
              color="warning"
              icon={<ClockIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Sudah Dinilai"
              value={stats.graded}
              color="success"
              icon={<CheckCircleIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Terlambat"
              value={stats.overdue}
              color="danger"
              icon={<XCircleIcon className="w-8 h-8" />}
            />
          </div>

          {/* Filter Bar */}
          <div className="mb-6">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterValue={filterStatus}
              onFilterChange={setFilterStatus}
              filterOptions={filterOptions}
              filterLabel="Semua Status"
              placeholder="Cari tugas..."
            />
          </div>

          {/* Assignments Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} showImage={false} lines={4} />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={<ClipboardDocumentListIcon className="w-16 h-16 text-gray-300" />}
              title={searchQuery || filterStatus ? 'Tidak ada tugas yang sesuai' : 'Belum ada tugas tersedia'}
              description={
                searchQuery || filterStatus
                  ? 'Coba ubah filter atau kata kunci pencarian Anda'
                  : 'Tugas baru akan muncul di sini ketika guru membuat tugas untuk mata pelajaran yang kamu ikuti'
              }
              action={
                searchQuery || filterStatus
                  ? {
                      label: 'Hapus Filter',
                      onClick: () => {
                        setSearchQuery('');
                        setFilterStatus('');
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    id={assignment.id}
                    title={assignment.title}
                    description={assignment.description}
                    instructions={assignment.instructions}
                    subject={{
                      name: assignment.subject?.name || 'Lainnya',
                      class: assignment.subject?.class,
                    }}
                    teacher={{ name: assignment.teacher?.name || 'Unknown' }}
                    dueDate={assignment.dueDate}
                    maxScore={assignment.maxScore}
                    status={assignment.status}
                    allowLateSubmission={assignment.allowLateSubmission}
                    mySubmission={assignment.mySubmission}
                    onSubmit={() => openSubmitModal(assignment)}
                    viewMode="student"
                  />
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    Menampilkan <strong>{filteredAssignments.length}</strong> tugas
                    {filterStatus && ' dengan status yang dipilih'}
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

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={closeSubmitModal}
        title="Kumpulkan Tugas"
        size="lg"
      >
        {selectedAssignment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assignment Info */}
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <h3 className="font-semibold text-primary-900 mb-1">{selectedAssignment.title}</h3>
              <p className="text-sm text-primary-700">{selectedAssignment.subject?.name}</p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Instruksi Tugas:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedAssignment.instructions}
              </p>
            </div>

            {/* Deadline Warning */}
            <div
              className={
                'rounded-lg p-3 border ' +
                (isOverdue(selectedAssignment.dueDate)
                  ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200'
                  : 'bg-warning-50 border-warning-200')
              }
            >
              <p className="text-sm">
                <span
                  className={
                    isOverdue(selectedAssignment.dueDate)
                      ? 'text-danger-900 font-semibold'
                      : 'text-warning-900 font-semibold'
                  }
                >
                  Deadline: {new Date(selectedAssignment.dueDate).toLocaleString('id-ID')}
                </span>
              </p>
              {isOverdue(selectedAssignment.dueDate) && (
                <p className="text-xs text-danger-600 mt-1">
                  {selectedAssignment.allowLateSubmission
                    ? 'Tugas sudah melewati deadline (pengumpulan terlambat diperbolehkan)'
                    : 'Tugas sudah melewati deadline!'}
                </p>
              )}
            </div>

            {/* Error Message in Modal */}
            {error && (
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Text Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jawaban (Opsional)
              </label>
              <textarea
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tulis jawaban atau catatan di sini..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload File (Opsional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar"
              />
              {submitFile && (
                <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-sm text-primary-900 font-medium">
                    {submitFile.name}
                  </p>
                  <p className="text-xs text-primary-600 mt-1">
                    {formatFileSize(submitFile.size)}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format yang didukung: PDF, DOC, PPT, XLS, TXT, Gambar, ZIP (Max 100MB)
              </p>
            </div>

            {/* Note */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">Catatan:</span> Anda bisa mengisi
                jawaban teks, upload file, atau keduanya. Minimal salah satu harus
                diisi.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={(!submitContent && !submitFile) || submitting}
                fullWidth
                leftIcon={<CloudArrowUpIcon className="w-5 h-5" />}
              >
                {submitting ? 'Mengumpulkan...' : 'Kumpulkan Tugas'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={closeSubmitModal}
                disabled={submitting}
              >
                Batal
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
