import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedLayout from './components/layout/RoleBasedLayout';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="mt-4 text-gray-600">Memuat halaman...</p>
    </div>
  </div>
);

// Lazy load all page components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Dashboard pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

// Admin pages
const AdminClassesPage = lazy(() => import('./pages/Admin/AdminClassesPage'));
const AdminSubjectsPage = lazy(() => import('./pages/Admin/AdminSubjectsPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));

// Teacher pages
const TeacherMaterialsPage = lazy(() => import('./pages/Teacher/TeacherMaterialsPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/Teacher/TeacherAssignmentsPage'));
const TeacherQuizzesPage = lazy(() => import('./pages/Teacher/TeacherQuizzesPage'));
const TeacherGradesPage = lazy(() => import('./pages/Teacher/TeacherGradesPage'));
const TeacherAnnouncementsPage = lazy(() => import('./pages/Teacher/TeacherAnnouncementsPage'));

// Student pages
const StudentMaterialsPage = lazy(() => import('./pages/Student/StudentMaterialsPage'));
const StudentAssignmentsPage = lazy(() => import('./pages/Student/StudentAssignmentsPage'));
const StudentQuizzesPage = lazy(() => import('./pages/Student/StudentQuizzesPage'));
const StudentGradesPage = lazy(() => import('./pages/Student/StudentGradesPage'));
const StudentAnnouncementsPage = lazy(() => import('./pages/Student/StudentAnnouncementsPage'));

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  // Load user from stored token on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <RoleBasedLayout />
              </ProtectedRoute>
            }
          >
            {/* Root Dashboard - redirects based on role */}
            <Route path="/" element={<DashboardPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminSubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/materials"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quizzes"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherQuizzesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/grades"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/announcements"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <TeacherAnnouncementsPage />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/materials"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentMaterialsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/quizzes"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentQuizzesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/announcements"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentAnnouncementsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect any unknown route to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
