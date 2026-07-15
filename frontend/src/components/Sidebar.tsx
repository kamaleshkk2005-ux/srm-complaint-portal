import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Building2,
  Tags,
  Megaphone,
  BarChart3,
  LogOut,
  Bell,
  X,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const Sidebar = ({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) => {
  const { user, logout } = useAuth();

  const getLinks = (): NavItem[] => {
    switch (user?.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
          { name: 'My Complaints', path: '/student/complaints', icon: <MessageSquare size={18} /> },
          { name: 'Notifications', path: '/student/notifications', icon: <Bell size={18} /> },
          { name: 'Profile', path: '/student/profile', icon: <Settings size={18} /> },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard size={18} /> },
          { name: 'Complaints', path: '/staff/complaints', icon: <MessageSquare size={18} /> },
          { name: 'Profile', path: '/staff/profile', icon: <Settings size={18} /> },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
          { name: 'All Complaints', path: '/admin/complaints', icon: <MessageSquare size={18} /> },
          { name: 'Users', path: '/admin/users', icon: <Users size={18} /> },
          { name: 'Departments', path: '/admin/departments', icon: <Building2 size={18} /> },
          { name: 'Categories', path: '/admin/categories', icon: <Tags size={18} /> },
          { name: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={18} /> },
          { name: 'Reports', path: '/admin/reports', icon: <BarChart3 size={18} /> },
          { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();
  const displayName = user?.profile?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user?.role === 'STUDENT' ? 'Student' : user?.role === 'STAFF' ? 'Staff Member' : 'Administrator';

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-[15px]">SRM University</span>
            <span className="block text-[10px] text-slate-400 leading-none -mt-0.5">Complaint Portal</span>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-3 pt-4 pb-1">
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
          user?.role === 'STUDENT' && "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
          user?.role === 'STAFF' && "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
          user?.role === 'ADMIN' && "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
        )}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {roleLabel} Portal
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out border-l-4",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/25 border-primary"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:border-primary hover:text-primary dark:hover:text-primary hover:scale-[1.02] hover:translate-x-1"
              )
            }
          >
            <span className="flex items-center gap-3 [&>svg]:transition-transform [&>svg]:duration-300 group-hover:[&>svg]:scale-110">
              {link.icon}
              {link.name}
            </span>
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-50 transition-opacity"
            />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 mb-2">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm overflow-hidden">
            {user?.profile?.profileImage ? (
              <img src={user.profile.profileImage} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 text-sm"
          onClick={logout}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
