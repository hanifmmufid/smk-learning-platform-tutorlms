import { useAuthStore } from '../stores/authStore';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Route to appropriate dashboard based on role
  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  if (user?.role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Fallback - should not happen if auth is working correctly
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Loading Dashboard...
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Role: {user?.role || 'Unknown'}
        </p>
      </div>
    </div>
  );
}
