import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from './Sidebar';
import Header from './Header';
import type { SidebarNavItem } from './Sidebar';
import {
  UsersIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

const RoleBasedLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define nav items based on role
  const getNavItems = (): SidebarNavItem[] => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
        { name: 'Kelola Kelas', href: '/admin/classes', icon: BuildingOfficeIcon },
        { name: 'Kelola Mata Pelajaran', href: '/admin/subjects', icon: BookOpenIcon },
        { name: 'Kelola Users', href: '/admin/users', icon: UsersIcon },
      ];
    }

    if (user?.role === 'TEACHER') {
      return [
        { name: 'Dashboard', href: '/teacher/dashboard', icon: HomeIcon },
        { name: 'Materi', href: '/teacher/materials', icon: BookOpenIcon },
        { name: 'Tugas', href: '/teacher/assignments', icon: DocumentTextIcon },
        { name: 'Quiz', href: '/teacher/quizzes', icon: AcademicCapIcon },
        { name: 'Nilai', href: '/teacher/grades', icon: ChartBarIcon },
        { name: 'Pengumuman', href: '/teacher/announcements', icon: MegaphoneIcon },
      ];
    }

    if (user?.role === 'STUDENT') {
      return [
        { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
        { name: 'Materi', href: '/student/materials', icon: BookOpenIcon },
        { name: 'Tugas', href: '/student/assignments', icon: DocumentTextIcon },
        { name: 'Quiz', href: '/student/quizzes', icon: AcademicCapIcon },
        { name: 'Nilai', href: '/student/grades', icon: ChartBarIcon },
        { name: 'Pengumuman', href: '/student/announcements', icon: MegaphoneIcon },
      ];
    }

    return [];
  };

  if (!user) {
    return null;
  }

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - rendered ONCE for entire app */}
      <Sidebar
        user={{
          name: user.name,
          role: user.role,
          email: user.email,
        }}
        navItems={navItems}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        darkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Header */}
        <Header
          user={{
            name: user.name,
            role: user.role,
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content - this is where child routes render */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;
