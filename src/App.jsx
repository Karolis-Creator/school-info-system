import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import CalendarPage from './pages/CalendarPage';
import ConsultationsPage from './pages/ConsultationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import TeachersPage from './pages/TeachersPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children, requireAdmin, requireSuperAdmin }) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  if (loading) return (
    <div className="full-loading">
      <div className="spinner large" />
      <p>Kraunama...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loading"><div className="spinner large" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<MapPage />} />
        <Route path="/kalendorius" element={<CalendarPage />} />
        <Route path="/konsultacijos" element={<ConsultationsPage />} />
        <Route path="/skelbimai" element={<AnnouncementsPage />} />
        <Route path="/mokytojai" element={<TeachersPage />} />
        <Route path="/superadmin" element={
          <ProtectedRoute requireSuperAdmin><SuperAdminPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
