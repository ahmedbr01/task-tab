import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ============================================
// PAGES AUTH (SEULEMENT LOGIN)
// ============================================
import Login from './features/auth/Login';

// ============================================
// LAYOUT
// ============================================
import Layout from './components/Layout'; // <-- Import du Layout corrigé

// ============================================
// PAGES PRINCIPALES
// ============================================
import Dashboard from './features/dashboard/Dashboard';
import Projects from './features/projects/Projects';
import Kanban from './features/kanban/Kanban';
import Gantt from './features/gantt/Gantt';
import Messages from './features/messaging/Messages';
import Calendar from './features/calendar/Calendar';
import Documents from './features/documents/Documents';
import Correspondence from './features/correspondence/Correspondence';
import Axes from './features/axes/Axes';
import Search from './features/search/AdvancedSearch';
import Export from './features/export/Export';
import Profile from './features/profile/Profile';
import Notifications from './features/notifications/Notifications';

// ============================================
// PAGES ADMIN
// ============================================
import AdminDashboard from './features/admin/AdminDashboard';
import AdminUsers from './features/admin/AdminUsers';
import AdminCategories from './features/admin/AdminCategories';
import Logs from './features/logs/Logs';
// Note: Settings n'existe pas dans ta structure
// import Settings from './features/admin/Settings';

// ============================================
// PROTECTION DES ROUTES
// ============================================
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5b3e]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <BrowserRouter>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={true}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              <Routes>
                {/* ROUTE LOGIN UNIQUEMENT */}
                <Route path="/login" element={<Login />} />

                {/* ROUTES PROTÉGÉES */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="kanban" element={<Kanban />} />
                  <Route path="gantt" element={<Gantt />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="correspondence" element={<Correspondence />} />
                  <Route path="axes" element={<Axes />} />
                  <Route path="search" element={<Search />} />
                  <Route path="export" element={<Export />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="notifications" element={<Notifications />} />

                  {/* ROUTES ADMIN */}
                  <Route
                    path="admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/categories"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminCategories />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/logs"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Logs />
                      </ProtectedRoute>
                    }
                  />
                  {/* La route Settings est commentée car le fichier n'existe pas
                  <Route
                    path="admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  */}
                </Route>

                {/* ROUTE 404 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;