import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import type {
  Assignment,
  CreateAssignmentData,
} from '../../services/assignmentService';
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../../services/assignmentService';
import { getAllSubjects, type SubjectType } from '../../services/subjectService';
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
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function TeacherAssignmentsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    instructions: '',
    subjectId: '',
    dueDate: '',
    maxScore: 100,
    allowLateSubmission: false,
    status: 'DRAFT',
  });

  useEffect(() => {
    loadData();
  }, [filterSubject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, subjectsData] = await Promise.all([
        getAllAssignments(filterSubject ? { subjectId: filterSubject } : {}),
        getAllSubjects(),
      ]);

      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data);
      }

      setSubjects(subjectsData);
      setError('');
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAssignment(formData);
      if (res.success) {
        setSuccess('Tugas berhasil dibuat!');
        closeModal();
        loadData();
      }
    } catch (err: any) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.error || 'Gagal membuat tugas');
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    try {
      const res = await updateAssignment(editingAssignment.id, formData);
      if (res.success) {
        setSuccess('Tugas berhasil diperbarui!');
        closeModal();
        loadData();
      }
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError(err.response?.data?.error || 'Gagal memperbarui tugas');
    }
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus tugas "${title}"?`)) return;

    try {
      const res = await deleteAssignment(id);
      if (res.success) {
        setSuccess('Tugas berhasil dihapus!');
        loadData();
      }
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.response?.data?.error || 'Gagal menghapus tugas');
    }
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      subjectId: '',
      dueDate: '',
      maxScore: 100,
      allowLateSubmission: false,
      status: 'DRAFT',
    });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions,
      subjectId: assignment.subjectId,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      maxScore: assignment.maxScore,
      allowLateSubmission: assignment.allowLateSubmission,
      status: assignment.status,
    });
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setError('');
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: assignments.length,
    published: assignments.filter((a) => a.status === 'PUBLISHED').length,
    draft: assignments.filter((a) => a.status === 'DRAFT').length,
    closed: assignments.filter((a) => a.status === 'CLOSED').length,
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/teacher/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/teacher/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/teacher/grades', icon: ChartBarIcon },
  ];

  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} - ${subject.class?.name}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Header */}
        <Header
          user={{
            name: user?.name || 'Teacher',
            role: 'TEACHER',
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Kelola Tugas', icon: DocumentTextIcon },
            ]}
            className="mb-6"
          />

          {/* Page Header */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Kelola Tugas
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Buat dan kelola tugas untuk siswa
              </p>
            </div>
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Buat Tugas Baru
            </Button>
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
          {error && !showModal && (
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
              title="Dipublikasikan"
              value={stats.published}
              color="success"
              icon={<CheckCircleIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Draft"
              value={stats.draft}
              color="warning"
              icon={<ClockIcon className="w-8 h-8" />}
            />
            <StatCard
              title="Ditutup"
              value={stats.closed}
              color="danger"
              icon={<XCircleIcon className="w-8 h-8" />}
            />
          </div>

          {/* Filter Bar */}
          <div className="mb-6">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterValue={filterSubject}
              onFilterChange={setFilterSubject}
              filterOptions={subjectOptions}
              filterLabel="Semua Mata Pelajaran"
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
              title={searchQuery || filterSubject ? 'Tidak ada tugas yang sesuai' : 'Belum ada tugas'}
              description={
                searchQuery || filterSubject
                  ? 'Coba ubah filter atau kata kunci pencarian Anda'
                  : 'Klik tombol "Buat Tugas Baru" untuk membuat tugas pertama Anda'
              }
              action={
                searchQuery || filterSubject
                  ? {
                      label: 'Hapus Filter',
                      onClick: () => {
                        setSearchQuery('');
                        setFilterSubject('');
                      },
                    }
                  : {
                      label: 'Buat Tugas Baru',
                      onClick: openCreateModal,
                    }
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
                    dueDate={assignment.dueDate}
                    maxScore={assignment.maxScore}
                    status={assignment.status}
                    allowLateSubmission={assignment.allowLateSubmission}
                    submissionCount={assignment._count?.submissions || 0}
                    onEdit={() => openEditModal(assignment)}
                    onDelete={() => handleDeleteAssignment(assignment.id, assignment.title)}
                    onViewSubmissions={() => navigate(`/teacher/assignments/${assignment.id}/grading`)}
                    viewMode="teacher"
                  />
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    Menampilkan <strong>{filteredAssignments.length}</strong> tugas
                    {filterSubject && ' untuk mata pelajaran ini'}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingAssignment ? 'Edit Tugas' : 'Buat Tugas Baru'}
        size="xl"
      >
        <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment} className="space-y-4">
          {/* Error Message in Modal */}
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Judul Tugas <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Tugas HTML & CSS Dasar"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mata Pelajaran <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.class?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi Singkat
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Membuat halaman web sederhana"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instruksi Lengkap <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <textarea
              required
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tulis instruksi lengkap untuk siswa..."
            />
          </div>

          {/* Due Date & Max Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline <span className="text-danger-500 dark:text-danger-400">**</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nilai Maksimal <span className="text-danger-500 dark:text-danger-400">**</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="1000"
                value={formData.maxScore}
                onChange={(e) =>
                  setFormData({ ...formData, maxScore: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status & Allow Late Submission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span className="text-danger-500 dark:text-danger-400">**</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Dipublikasikan</option>
                <option value="CLOSED">Ditutup</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowLateSubmission}
                  onChange={(e) =>
                    setFormData({ ...formData, allowLateSubmission: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Izinkan pengumpulan terlambat
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              {editingAssignment ? 'Perbarui Tugas' : 'Buat Tugas'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
