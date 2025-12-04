import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role-specific dashboard
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user?.role === 'TEACHER') {
      navigate('/teacher/dashboard', { replace: true });
    } else if (user?.role === 'STUDENT') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Loading state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Loading Dashboard...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to {user?.role?.toLowerCase()} dashboard...
        </p>
      </div>
    </div>
  );
}
