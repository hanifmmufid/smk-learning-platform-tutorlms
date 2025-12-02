import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AdminSubjectsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
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

      setShowForm(false);
      setEditingSubject(null);
      setFormData({ name: '', classId: '', teacherId: '' });
      loadData();
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
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) {
      return;
    }

    try {
      await deleteSubject(id);
      setSuccess('Mata pelajaran berhasil dihapus');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus mata pelajaran');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFormData({ name: '', classId: '', teacherId: '' });
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
              <h1 className="text-2xl font-bold text-gray-900">Kelola Mata Pelajaran</h1>
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

        {/* Add Subject Button */}
        {!showForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Tambah Mata Pelajaran Baru
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pemrograman Web"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guru Pengajar <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  {editingSubject ? 'Update Mata Pelajaran' : 'Simpan Mata Pelajaran'}
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

        {/* Subjects List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Mata Pelajaran</h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Memuat data...
            </div>
          ) : subjects.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Belum ada mata pelajaran. Klik tombol "Tambah Mata Pelajaran Baru" untuk membuat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guru Pengajar
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
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.class?.name}</div>
                        <div className="text-xs text-gray-500">
                          Kelas {subject.class?.grade} - {subject.class?.academicYear}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject.teacher?.name}</div>
                        <div className="text-xs text-gray-500">{subject.teacher?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject._count?.enrollments || 0} siswa
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id, subject.name)}
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
