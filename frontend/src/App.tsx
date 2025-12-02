import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminClassesPage from './pages/Admin/AdminClassesPage';
import AdminSubjectsPage from './pages/Admin/AdminSubjectsPage';
import TeacherMaterialsPage from './pages/Teacher/TeacherMaterialsPage';
import TeacherAssignmentsPage from './pages/Teacher/TeacherAssignmentsPage';
import TeacherQuizzesPage from './pages/Teacher/TeacherQuizzesPage';
import StudentMaterialsPage from './pages/Student/StudentMaterialsPage';
import StudentAssignmentsPage from './pages/Student/StudentAssignmentsPage';
import StudentQuizzesPage from './pages/Student/StudentQuizzesPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  // Load user from stored token on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
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

        {/* Teacher Routes */}
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

        {/* Student Routes */}
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

        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
