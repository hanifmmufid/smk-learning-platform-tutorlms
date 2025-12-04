import { useState, useEffect } from 'react';
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
} from '../../services/classService';
import type {
  ClassType,
  CreateClassRequest,
} from '../../services/classService';
import Header from '../../components/layout/Breadcrumb';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  BookOpenIcon,
  AcademicCapIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export default function AdminClassesPage() {

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: '',
    grade: 10,
    academicYear: '2024/2025',
  });

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getAllClasses();
      setClasses(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingClass) {
        await updateClass(editingClass.id, formData);
        setSuccess('Kelas berhasil diupdate');
      } else {
        await createClass(formData);
        setSuccess('Kelas berhasil dibuat');
      }

      setShowModal(false);
      setEditingClass(null);
      setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
      loadClasses();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kelas');
    }
  };

  const handleEdit = (classItem: ClassType) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      academicYear: classItem.academicYear,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${name}"?`)) {
      return;
    }

    try {
      await deleteClass(id);
      setSuccess('Kelas berhasil dihapus');
      loadClasses();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kelas');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
    setError('');
  };

  // Filter classes by search query
  const filteredClasses = classes.filter((classItem) => {
    const query = searchQuery.toLowerCase();
    return (
      classItem.name.toLowerCase().includes(query) ||
      classItem.academicYear.toLowerCase().includes(query) ||
      `kelas ${classItem.grade}`.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Header */}
      <Header
        items={[
          { label: 'Kelola Kelas', icon: AcademicCapIcon },
        ]}
        className="mb-6"
      />
          {/* Page Header */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Kelola Kelas
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Kelola semua kelas di sistem
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingClass(null);
                setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
                setShowModal(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Tambah Kelas
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
                placeholder="Cari kelas, tahun ajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daftar Kelas ({filteredClasses.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonCard key={i} lines={2} />
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'Kelas tidak ditemukan' : 'Belum ada kelas'}
                description={
                  searchQuery
                    ? `Tidak ada kelas yang cocok dengan pencarian "${searchQuery}"`
                    : 'Klik tombol "Tambah Kelas" untuk membuat kelas baru'
                }
                action={
                  searchQuery ? {
                    label: 'Hapus Filter',
                    onClick: () => setSearchQuery(''),
                  } : {
                    label: 'Tambah Kelas',
                    onClick: () => {
                      setEditingClass(null);
                      setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
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
                        Nama Kelas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tingkat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tahun Ajaran
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mata Pelajaran
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
                    {filteredClasses.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="h-6 w-6 text-danger-600 dark:text-danger-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{classItem.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400">
                            Kelas {classItem.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {classItem.academicYear}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <BookOpenIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                            {classItem._count?.subjects || 0} mapel
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <UsersIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                            {classItem._count?.enrollments || 0} siswa
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id, classItem.name)}
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
        title={editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Kelas <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: X TKJ 1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tingkat <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <select
              required
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={10}>Kelas 10</option>
              <option value={11}>Kelas 11</option>
              <option value={12}>Kelas 12</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahun Ajaran <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="2024/2025"
              pattern="\d{4}/\d{4}"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: YYYY/YYYY (contoh: 2024/2025)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {editingClass ? 'Update Kelas' : 'Simpan Kelas'}
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
