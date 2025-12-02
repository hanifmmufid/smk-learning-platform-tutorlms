import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                SMK Learning Platform
              </h1>
              <span className="ml-4 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Selamat Datang, {user?.name}!
              </h2>
              <p className="text-gray-600 mb-8">
                Anda login sebagai <span className="font-semibold">{user?.role}</span>
              </p>

              {/* Role-specific content */}
              {user?.role === 'ADMIN' && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">
                    Admin Dashboard
                  </h3>
                  <p className="text-blue-700 mb-6">
                    Kelola user, kelas, mata pelajaran, dan konten pembelajaran
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => navigate('/admin/classes')}
                      className="bg-white hover:bg-blue-100 text-blue-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-blue-200 transition-colors text-left"
                    >
                      <div className="text-lg">🏫 Kelola Kelas</div>
                      <div className="text-sm text-blue-700 mt-1">Tambah, edit, hapus kelas</div>
                    </button>
                    <button
                      onClick={() => navigate('/admin/subjects')}
                      className="bg-white hover:bg-blue-100 text-blue-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-blue-200 transition-colors text-left"
                    >
                      <div className="text-lg">📚 Kelola Mata Pelajaran</div>
                      <div className="text-sm text-blue-700 mt-1">Tambah, edit, hapus mata pelajaran</div>
                    </button>
                  </div>
                </div>
              )}

              {user?.role === 'TEACHER' && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">
                    Teacher Dashboard
                  </h3>
                  <p className="text-green-700 mb-6">
                    Kelola kelas, buat konten pembelajaran, dan lihat progress siswa
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => navigate('/teacher/materials')}
                      className="bg-white hover:bg-green-100 text-green-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-green-200 transition-colors text-left"
                    >
                      <div className="text-lg">📁 Kelola Materi</div>
                      <div className="text-sm text-green-700 mt-1">Upload dan kelola materi pembelajaran</div>
                    </button>
                    <button
                      onClick={() => navigate('/teacher/assignments')}
                      className="bg-white hover:bg-green-100 text-green-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-green-200 transition-colors text-left"
                    >
                      <div className="text-lg">📝 Kelola Tugas</div>
                      <div className="text-sm text-green-700 mt-1">Buat dan kelola tugas untuk siswa</div>
                    </button>
                    <button
                      onClick={() => navigate('/teacher/quizzes')}
                      className="bg-white hover:bg-green-100 text-green-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-green-200 transition-colors text-left"
                    >
                      <div className="text-lg">🎯 Kelola Quiz</div>
                      <div className="text-sm text-green-700 mt-1">Buat dan kelola quiz untuk siswa</div>
                    </button>
                  </div>
                </div>
              )}

              {user?.role === 'STUDENT' && (
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-purple-900 mb-4">
                    Student Dashboard
                  </h3>
                  <p className="text-purple-700 mb-6">
                    Lihat kelas, pelajari materi, dan kerjakan latihan
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => navigate('/student/materials')}
                      className="bg-white hover:bg-purple-100 text-purple-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-purple-200 transition-colors text-left"
                    >
                      <div className="text-lg">📚 Materi Pembelajaran</div>
                      <div className="text-sm text-purple-700 mt-1">Akses materi dari guru</div>
                    </button>
                    <button
                      onClick={() => navigate('/student/assignments')}
                      className="bg-white hover:bg-purple-100 text-purple-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-purple-200 transition-colors text-left"
                    >
                      <div className="text-lg">📝 Tugas Saya</div>
                      <div className="text-sm text-purple-700 mt-1">Lihat dan kerjakan tugas</div>
                    </button>
                    <button
                      onClick={() => navigate('/student/quizzes')}
                      className="bg-white hover:bg-purple-100 text-purple-900 font-semibold py-3 px-4 rounded-lg shadow-sm border border-purple-200 transition-colors text-left"
                    >
                      <div className="text-lg">🎯 Quiz Saya</div>
                      <div className="text-sm text-purple-700 mt-1">Kerjakan quiz dan lihat hasil</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Authentication Info */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Session Info
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>User ID: {user?.id}</p>
                  <p>Login sejak: {user?.createdAt ? new Date(user.createdAt).toLocaleString('id-ID') : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
