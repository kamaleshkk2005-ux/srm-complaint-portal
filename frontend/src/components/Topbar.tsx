import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Menu,
  Moon,
  Sun,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface TopbarProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchFocused, setSearchFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch Notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/users/notifications?limit=20');
      return response.data.data;
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        return [notification, ...(old || [])];
      });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.patch('/users/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark single as read mutation
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/users/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
    
    if (notification.relatedId && notification.relatedType === 'COMPLAINT') {
       const basePath = user?.role === 'STUDENT' ? '/student/complaints' : 
                        user?.role === 'STAFF' ? '/staff/complaints' : 
                        '/admin/complaints';
       navigate(`${basePath}/${notification.relatedId}`);
    }
  };

  const profilePath = user?.role === 'ADMIN'
    ? '/admin/settings'
    : user?.role === 'STAFF'
    ? '/staff/profile'
    : '/student/profile';

  const displayName = user?.profile?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'SUCCESS': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'WARNING': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'ERROR': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm px-4 md:px-6">
      
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-slate-600"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <div className={cn(
          "relative hidden sm:flex items-center transition-all duration-200",
          searchFocused ? "w-80" : "w-56 md:w-72"
        )}>
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search complaints..."
            className="w-full h-9 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent pl-9 pr-4 text-sm focus-visible:ring-primary focus-visible:bg-white dark:focus-visible:bg-slate-900"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-400"
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5 text-amber-400" size={18} />
          ) : (
            <Moon className="h-4.5 w-4.5" size={18} />
          )}
          <span className="sr-only">Toggle Theme</span>
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full text-slate-600 dark:text-slate-400"
            >
              <Bell className="h-4.5 w-4.5" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary hover:text-primary hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead.mutate();
                  }}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[350px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                  <Bell className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1 text-slate-400">When you receive updates, they'll appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0",
                        !notif.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium leading-tight truncate",
                          !notif.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="shrink-0 flex items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs overflow-hidden">
                {user?.profile?.profileImage ? (
                  <img src={user.profile.profileImage} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={profilePath} className="cursor-pointer gap-2">
                <User className="h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            {user?.role === 'ADMIN' && (
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="cursor-pointer gap-2">
                  <Settings className="h-4 w-4" />
                  System Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2 cursor-pointer"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
