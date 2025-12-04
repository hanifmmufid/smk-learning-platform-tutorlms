import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatCard from '../components/widgets/StatCard';
import ActivityFeed from '../components/widgets/ActivityFeed';
import type { Activity } from '../components/widgets/ActivityFeed';
import {
  UsersIcon,
  DocumentPlusIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Sample data - akan diganti dengan real API calls
  const activities: Activity[] = [
    {
      id: '1',
      type: 'assignment',
      title: 'Tugas Baru Dikumpulkan',
      description: 'Andi Pratama mengumpulkan "Tugas Membuat Website"',
      time: '1 jam yang lalu',
      status: 'info',
    },
    {
      id: '2',
      type: 'quiz',
      title: 'Quiz Diselesaikan',
      description: 'Budi Santoso menyelesaikan "Quiz HTML Basics" dengan nilai 90',
      time: '3 jam yang lalu',
      status: 'success',
    },
    {
      id: '3',
      type: 'material',
      title: 'Materi Dilihat',
      description: '15 siswa telah membuka materi "JavaScript Basics"',
      time: '5 jam yang lalu',
      status: 'info',
    },
  ];

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/teacher/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/teacher/assignments', icon: DocumentTextIcon, badge: '12' },
    { name: 'Quiz', href: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/teacher/grades', icon: ChartBarIcon },
    { name: 'Pengumuman', href: '/teacher/announcements', icon: MegaphoneIcon },
  ];

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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Selamat Datang, {user?.name}! 👨‍🏫
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Kelola kelas dan pantau progress siswa Anda hari ini
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Siswa"
              value="45"
              description="Di 3 kelas aktif"
              icon={<UsersIcon className="w-6 h-6" />}
              color="primary"
            />
            <StatCard
              title="Materi"
              value="24"
              trend={{
                value: 8,
                label: 'bulan ini',
                direction: 'up',
              }}
              icon={<BookOpenIcon className="w-6 h-6" />}
              color="info"
              onClick={() => navigate('/teacher/materials')}
            />
            <StatCard
              title="Tugas Aktif"
              value="8"
              description="12 perlu dinilai"
              icon={<DocumentTextIcon className="w-6 h-6" />}
              color="warning"
              onClick={() => navigate('/teacher/assignments')}
            />
            <StatCard
              title="Quiz Aktif"
              value="5"
              description="125 percobaan"
              icon={<AcademicCapIcon className="w-6 h-6" />}
              color="success"
              onClick={() => navigate('/teacher/quizzes')}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevated p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/teacher/materials/new')}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary-300 hover:border-primary-500 hover:bg-primary-50 transition-colors group"
              >
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <DocumentPlusIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Tambah Materi</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Upload materi baru</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/teacher/assignments/new')}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-warning-300 hover:border-warning-500 hover:bg-warning-50 transition-colors group"
              >
                <div className="p-2 bg-warning-100 rounded-lg group-hover:bg-warning-200 transition-colors">
                  <ClipboardDocumentCheckIcon className="w-6 h-6 text-warning-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Buat Tugas</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Buat tugas baru</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/teacher/quizzes/new')}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-success-300 hover:border-success-500 hover:bg-success-50 transition-colors group"
              >
                <div className="p-2 bg-success-100 rounded-lg group-hover:bg-success-200 transition-colors">
                  <AcademicCapIcon className="w-6 h-6 text-success-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Buat Quiz</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">Buat quiz baru</p>
                </div>
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={activities}
            title="Aktivitas Siswa Terbaru"
            maxItems={8}
          />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
