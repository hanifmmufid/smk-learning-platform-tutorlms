import { useState, useEffect } from 'react';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../../services/userService';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../services/userService';
import Header from '../../components/layout/Breadcrumb';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  BookOpenIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [showPassword, setShowPassword] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers(roleFilter === 'ALL' ? undefined : roleFilter);
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update user - only send fields that changed
        const updateData: UpdateUserRequest = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateUser(editingUser.id, updateData);
        setSuccess('Pengguna berhasil diupdate');
      } else {
        // Create new user
        await createUser(formData);
        setSuccess('Pengguna berhasil dibuat');
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
      loadUsers();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengguna');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role as 'TEACHER' | 'STUDENT',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"?\n\nPeringatan: Semua data terkait (tugas, quiz, nilai) akan ikut terhapus.`)) {
      return;
    }

    try {
      await deleteUser(id);
      setSuccess('Pengguna berhasil dihapus');
      loadUsers();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus pengguna');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
    setError('');
    setShowPassword(false);
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const stats = {
    total: filteredUsers.length,
    teachers: filteredUsers.filter(u => u.role === 'TEACHER').length,
    students: filteredUsers.filter(u => u.role === 'STUDENT').length,
  };

  return (
    <>
      {/* Header */}
      <Header
        items={[
          { label: 'Kelola Pengguna', icon: UsersIcon },
        ]}
        className="mb-6"
      />

      {/* Page Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kelola Pengguna
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kelola akun guru dan siswa
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
            setShowModal(true);
          }}
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          Tambah Pengguna
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pengguna</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <UsersIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Guru</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.teachers}</p>
            </div>
            <div className="p-3 bg-teacher-100 dark:bg-teacher-900/30 rounded-lg">
              <AcademicCapIcon className="w-8 h-8 text-teacher-600 dark:text-teacher-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Siswa</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.students}</p>
            </div>
            <div className="p-3 bg-student-100 dark:bg-student-900/30 rounded-lg">
              <UsersIcon className="w-8 h-8 text-student-600 dark:text-student-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Cari nama, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'TEACHER' | 'STUDENT')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="ALL">Semua Role</option>
          <option value="TEACHER">Guru</option>
          <option value="STUDENT">Siswa</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daftar Pengguna ({filteredUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}
            description={
              searchQuery
                ? `Tidak ada pengguna yang cocok dengan pencarian "${searchQuery}"`
                : 'Klik tombol "Tambah Pengguna" untuk membuat pengguna baru'
            }
            action={
              searchQuery ? {
                label: 'Hapus Filter',
                onClick: () => setSearchQuery(''),
              } : {
                label: 'Tambah Pengguna',
                onClick: () => {
                  setEditingUser(null);
                  setFormData({ name: '', email: '', password: '', role: 'STUDENT' });
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
                    Pengguna
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Info
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          name={user.name}
                          role={user.role === 'TEACHER' ? 'teacher' : user.role === 'STUDENT' ? 'student' : 'admin'}
                          size="md"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Dibuat: {new Date(user.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          user.role === 'TEACHER' ? 'warning' :
                          user.role === 'STUDENT' ? 'info' : 'gray'
                        }
                      >
                        {user.role === 'TEACHER' ? '👨‍🏫 Guru' :
                         user.role === 'STUDENT' ? '👨‍🎓 Siswa' : 'Admin'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'TEACHER' && (
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <BookOpenIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                          {user._count?.taughtSubjects || 0} mata pelajaran
                        </div>
                      )}
                      {user.role === 'STUDENT' && (
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <AcademicCapIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                          {user._count?.enrollments || 0} kelas
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
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
        title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Lengkap <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contoh@sekolah.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password {editingUser && <span className="text-gray-500 dark:text-gray-400 text-xs">(kosongkan jika tidak ingin mengubah)</span>}
              {!editingUser && <span className="text-danger-500 dark:text-danger-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? '••••••••' : 'Minimal 6 karakter'}
                minLength={editingUser ? undefined : 6}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {!editingUser && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password minimal 6 karakter
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role <span className="text-danger-500 dark:text-danger-400">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'TEACHER' | 'STUDENT' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="STUDENT">👨‍🎓 Siswa</option>
              <option value="TEACHER">👨‍🏫 Guru</option>
            </select>
          </div>

          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {editingUser ? 'Update Pengguna' : 'Simpan Pengguna'}
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
