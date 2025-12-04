import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import ProgressCard from '../components/widgets/ProgressCard';
import DeadlineCard from '../components/widgets/DeadlineCard';
import type { DeadlineItem } from '../components/widgets/DeadlineCard';
import StatCard from '../components/widgets/StatCard';
import ActivityFeed from '../components/widgets/ActivityFeed';
import type { Activity } from '../components/widgets/ActivityFeed';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Sample data - akan diganti dengan real API calls
  const deadlines: DeadlineItem[] = [
    {
      id: '1',
      title: 'Tugas Membuat Website',
      type: 'assignment',
      subject: 'Pemrograman Web',
      dueDate: '15 Des 2025',
      daysLeft: 3,
      status: 'soon',
      href: '/student/assignments',
    },
    {
      id: '2',
      title: 'Quiz HTML & CSS',
      type: 'quiz',
      subject: 'Pemrograman Web',
      dueDate: '20 Des 2025',
      daysLeft: 8,
      status: 'upcoming',
      href: '/student/quizzes',
    },
  ];

  const activities: Activity[] = [
    {
      id: '1',
      type: 'grade',
      title: 'Nilai Tugas Diterima',
      description: 'Tugas "Membuat Landing Page" - Nilai: 85/100',
      time: '2 jam yang lalu',
      status: 'success',
    },
    {
      id: '2',
      type: 'material',
      title: 'Materi Baru Tersedia',
      description: 'Pak Budi menambahkan materi "JavaScript Basics"',
      time: '5 jam yang lalu',
      status: 'info',
    },
  ];

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Selamat Datang, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Yuk lanjutkan belajar dan selesaikan tugasmu hari ini
        </p>
      </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Materi"
              value="24"
              description="8 materi baru bulan ini"
              icon={<BookOpenIcon className="w-6 h-6" />}
              color="primary"
              onClick={() => navigate('/student/materials')}
            />
            <StatCard
              title="Tugas Aktif"
              value="3"
              description="2 deadline minggu ini"
              icon={<ClockIcon className="w-6 h-6" />}
              color="warning"
              onClick={() => navigate('/student/assignments')}
            />
            <StatCard
              title="Tugas Selesai"
              value="18"
              trend={{
                value: 12,
                label: 'dari bulan lalu',
                direction: 'up',
              }}
              icon={<CheckCircleIcon className="w-6 h-6" />}
              color="success"
            />
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ProgressCard
              title="Progress Pembelajaran"
              description="Materi yang sudah dipelajari"
              completed={18}
              total={24}
              color="primary"
              icon={<BookOpenIcon className="w-6 h-6" />}
            />
            <ProgressCard
              title="Penyelesaian Tugas"
              description="Tugas yang sudah dikumpulkan"
              completed={18}
              total={21}
              color="success"
              icon={<CheckCircleIcon className="w-6 h-6" />}
            />
          </div>

      {/* Deadline & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadlineCard
          deadlines={deadlines}
          onViewAll={() => navigate('/student/assignments')}
        />
        <ActivityFeed
          activities={activities}
          maxItems={5}
          onViewAll={() => navigate('/student/activities')}
        />
      </div>
    </>
  );
};

export default StudentDashboard;
