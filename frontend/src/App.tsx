import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentComplaints from './pages/student/Complaints';
import NewComplaint from './pages/student/NewComplaint';
import ComplaintDetails from './pages/student/ComplaintDetails';
import Profile from './pages/student/Profile';
import Notifications from './pages/student/Notifications';

// Staff pages
import StaffDashboard from './pages/staff/Dashboard';
import StaffComplaints from './pages/staff/Complaints';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import UsersManagement from './pages/admin/Users';
import DepartmentsManagement from './pages/admin/Departments';
import CategoriesManagement from './pages/admin/Categories';
import AnnouncementsManagement from './pages/admin/Announcements';
import ReportsManagement from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Error pages
import NotFound from './pages/errors/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/auth/login" replace />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                </Route>

                {/* Authenticated Routes — protected by DashboardLayout */}
                <Route element={<DashboardLayout />}>

                  {/* Student Routes */}
                  <Route path="/student">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="complaints" element={<StudentComplaints />} />
                    <Route path="complaints/new" element={<NewComplaint />} />
                    <Route path="complaints/:id" element={<ComplaintDetails />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="notifications" element={<Notifications />} />
                  </Route>

                  {/* Staff Routes */}
                  <Route path="/staff">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route path="complaints" element={<StaffComplaints />} />
                    <Route path="complaints/:id" element={<ComplaintDetails />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="complaints" element={<AdminComplaints />} />
                    <Route path="complaints/:id" element={<ComplaintDetails />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="departments" element={<DepartmentsManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="announcements" element={<AnnouncementsManagement />} />
                    <Route path="reports" element={<ReportsManagement />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
