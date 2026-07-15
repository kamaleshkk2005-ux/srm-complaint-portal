import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const AuthLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if document has dark class
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#eef2f9] dark:bg-slate-950">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600/20" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'STUDENT': return <Navigate to="/student/dashboard" replace />;
      case 'STAFF':   return <Navigate to="/staff/dashboard" replace />;
      case 'ADMIN':   return <Navigate to="/admin/dashboard" replace />;
      default:        return <Navigate to="/" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef2f9] dark:bg-slate-950 px-4 py-12 sm:px-8 relative">
      
      {/* Theme Toggle Button Top Right */}
      <div className="absolute top-6 right-6">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="bg-white/80 dark:bg-slate-800/80 shadow-sm border border-slate-200 dark:border-slate-700">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </Button>
      </div>

      <motion.div
        key={window.location.pathname}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/60 px-8 py-10 relative">
          <Outlet />
        </div>
      </motion.div>

      {/* Footer Text */}
      <div className="mt-8 text-center space-y-1 text-sm text-slate-500 dark:text-slate-400 z-10">
        <p>© 2024 SRM University. All rights reserved.</p>
        <p>Secure & Transparent Complaint Management</p>
      </div>
    </div>
  );
};

export default AuthLayout;
