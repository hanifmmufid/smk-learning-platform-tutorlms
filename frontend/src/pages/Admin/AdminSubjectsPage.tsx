import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../../services/subjectService';
import type {
  SubjectType,
  CreateSubjectRequest,
} from '../../services/subjectService';
import { getAllClasses } from '../../services/classService';
import type { ClassType } from '../../services/classService';
import type { User } from '../../services/authService';
import axios from 'axios';
import Header from '../../components/layout/Breadcrumb';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';
import {
  BookOpenIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export default function AdminSubjectsPage() {

  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectType | null>(null);
  const [formData, setFormData] = useState<CreateSubjectRequest>({
    name: '',
    classId: '',
    teacherId: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, classesData, teachersData] = await Promise.all([
        getAllSubjects(),
        getAllClasses(),
        getTeachers(),
      ]);
      setSubjects(subjectsData);
      setClasses(classesData);
      setTeachers(teachersData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const getTeachers = async (): Promise<User[]> => {
    const token = useAuthStore.getState().token;
    const response = await axios.get('/api/users?role=TEACHER', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
        setSuccess('Mata pelajaran berhasil diupdate');
      } else {
        await createSubject(formData);
        setSuccess('Mata pelajaran berhasil dibuat');
      }

      setShowModal(false);
      setEditingSubject(null);
      setFormData({ name: '', classId: '', teacherId: '' });
      loadData();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan mata pelajaran');
    }
  };

  const handleEdit = (subject: SubjectType) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      classId: subject.classId,
      teacherId: subject.teacherId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) {
      return;
    }

    try {
      await deleteSubject(id);
      setSuccess('Mata pelajaran berhasil dihapus');
      loadData();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus mata pelajaran');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ name: '', classId: '', teacherId: '' });
    setError('');
  };

  // Filter subjects by search query
  const filteredSubjects = subjects.filter((subject) => {
    const query = searchQuery.toLowerCase();
    return (
      subject.name.toLowerCase().includes(query) ||
      subject.class?.name.toLowerCase().includes(query) ||
      subject.teacher?.name.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Header */}
      <Header
        items={[
          { label: 'Kelola Mata Pelajaran', icon: BookOpenIcon },
        ]}
        className="mb-6"
      />
          {/* Page Header */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Kelola Mata Pelajaran
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Kelola semua mata pelajaran di sistem
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingSubject(null);
                setFormData({ name: '', classId: '', teacherId: '' });
                setShowModal(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Tambah Mata Pelajaran
            </Button>
          </div>

          {/* Success/Error Messages */}
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
          {error && (
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

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Cari mata pelajaran, kelas, guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daftar Mata Pelajaran ({filteredSubjects.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonCard key={i} lines={2} />
                ))}
              </div>
            ) : filteredSubjects.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'Mata pelajaran tidak ditemukan' : 'Belum ada mata pelajaran'}
                description={
                  searchQuery
                    ? `Tidak ada mata pelajaran yang cocok dengan pencarian "${searchQuery}"`
                    : 'Klik tombol "Tambah Mata Pelajaran" untuk membuat mata pelajaran baru'
                }
                action={
                  searchQuery ? {
                    label: 'Hapus Filter',
                    onClick: () => setSearchQuery(''),
                  } : {
                    label: 'Tambah Mata Pelajaran',
                    onClick: () => {
                      setEditingSubject(null);
                      setFormData({ name: '', classId: '', teacherId: '' });
                      setShowModal(true);
                    },
                  }
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mata Pelajaran
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kelas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Guru Pengajar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Siswa Terdaftar
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{subject.class?.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Kelas {subject.class?.grade} • {subject.class?.academicYear}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar
                              name={subject.teacher?.name || ''}
                              role="teacher"
                              size="sm"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{subject.teacher?.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{subject.teacher?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <UsersIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                            {subject._count?.enrollments || 0} siswa
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject.id, subject.name)}
                            className="text-danger-600 dark:text-danger-400 hover:text-danger-900 dark:hover:text-danger-300"
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Mata Pelajaran <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Pemrograman Web"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kelas <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <select
              required
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - Kelas {classItem.grade} ({classItem.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guru Pengajar <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <select
              required
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Pilih Guru --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {editingSubject ? 'Update Mata Pelajaran' : 'Simpan Mata Pelajaran'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
