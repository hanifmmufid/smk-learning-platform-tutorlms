import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
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

export default function AdminClassesPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
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

      setShowForm(false);
      setEditingClass(null);
      setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
      loadClasses();
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
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${name}"?`)) {
      return;
    }

    try {
      await deleteClass(id);
      setSuccess('Kelas berhasil dihapus');
      loadClasses();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kelas');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData({ name: '', grade: 10, academicYear: '2024/2025' });
    setError('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Kelola Kelas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Add Class Button */}
        {!showForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Tambah Kelas Baru
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: X TKJ 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tingkat <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>Kelas 10</option>
                  <option value={11}>Kelas 11</option>
                  <option value={12}>Kelas 12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024/2025"
                  pattern="\d{4}/\d{4}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY (contoh: 2024/2025)</p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  {editingClass ? 'Update Kelas' : 'Simpan Kelas'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classes List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Kelas</h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Memuat data...
            </div>
          ) : classes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Belum ada kelas. Klik tombol "Tambah Kelas Baru" untuk membuat kelas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tingkat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tahun Ajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa Terdaftar
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Kelas {classItem.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.academicYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem._count?.subjects || 0} mapel
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem._count?.enrollments || 0} siswa
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(classItem)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(classItem.id, classItem.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
