import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/widgets/StatCard';
import ActivityFeed from '../components/widgets/ActivityFeed';
import type { Activity } from '../components/widgets/ActivityFeed';
import {
  AcademicCapIcon,
  UsersIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Sample data - akan diganti dengan real API calls
  const activities: Activity[] = [
    {
      id: '1',
      type: 'announcement',
      title: 'Guru Baru Ditambahkan',
      description: 'Pak Ahmad bergabung sebagai guru Matematika',
      time: '2 jam yang lalu',
      status: 'success',
    },
    {
      id: '2',
      type: 'announcement',
      title: 'Kelas Baru Dibuat',
      description: 'Kelas XII RPL 1 telah dibuat dengan 30 siswa',
      time: '4 jam yang lalu',
      status: 'info',
    },
    {
      id: '3',
      type: 'announcement',
      title: 'Mata Pelajaran Diupdate',
      description: 'Pemrograman Web - Silabus diperbarui',
      time: '1 hari yang lalu',
      status: 'info',
    },
  ];

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Admin 🎯
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Kelola sistem dan monitor aktivitas platform
        </p>
      </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Pengguna"
              value="165"
              trend={{
                value: 12,
                label: 'dari bulan lalu',
                direction: 'up',
              }}
              icon={<UsersIcon className="w-6 h-6" />}
              color="primary"
            />
            <StatCard
              title="Total Kelas"
              value="12"
              description="4 kelas aktif"
              icon={<BuildingLibraryIcon className="w-6 h-6" />}
              color="info"
              onClick={() => navigate('/admin/classes')}
            />
            <StatCard
              title="Mata Pelajaran"
              value="8"
              description="Semua aktif"
              icon={<BookOpenIcon className="w-6 h-6" />}
              color="success"
              onClick={() => navigate('/admin/subjects')}
            />
            <StatCard
              title="Total Konten"
              value="156"
              description="Materi, Tugas, Quiz"
              icon={<AcademicCapIcon className="w-6 h-6" />}
              color="warning"
            />
          </div>

          {/* User Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Distribusi Pengguna
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-admin-100 rounded-xl">
                  <CogIcon className="w-8 h-8 text-admin-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Administrator</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-teacher-100 rounded-xl">
                  <UsersIcon className="w-8 h-8 text-teacher-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Guru</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-student-100 rounded-xl">
                  <AcademicCapIcon className="w-8 h-8 text-student-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">145</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Siswa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aksi Cepat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/admin/classes')}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary-300 hover:border-primary-500 hover:bg-primary-50 transition-colors group text-left"
              >
                <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <BuildingLibraryIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Kelola Kelas</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                    Tambah, edit, atau hapus kelas
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/subjects')}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-success-300 hover:border-success-500 hover:bg-success-50 transition-colors group text-left"
              >
                <div className="p-3 bg-success-100 rounded-lg group-hover:bg-success-200 transition-colors">
                  <BookOpenIcon className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Kelola Mata Pelajaran</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                    Tambah, edit, atau hapus mata pelajaran
                  </p>
                </div>
              </button>
            </div>
          </div>

      {/* Activity Feed */}
      <ActivityFeed
        activities={activities}
        title="Aktivitas Sistem Terbaru"
        maxItems={8}
      />
    </>
  );
};

export default AdminDashboard;
