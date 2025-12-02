import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'TEACHER' | 'STUDENT')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user's role is allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki akses ke halaman ini.
          </p>
          <p className="text-sm text-gray-500">
            Role Anda: <span className="font-semibold">{user.role}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
