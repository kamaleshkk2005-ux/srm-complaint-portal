import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Check, CheckSquare, Megaphone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  createdAt: string;
}

const Notifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifRes, annouRes] = await Promise.all([
        api.get('/users/notifications'),
        api.get('/users/announcements')
      ]);
      setNotifications(notifRes.data.data);
      setAnnouncements(annouRes.data.data);
    } catch (err) {
      console.error('Failed to fetch notification data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time notifications via socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (newNotif: UserNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications & Announcements
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Stay up to date with resolution logs and broadcast announcements.
          </p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-1.5 self-start">
            <CheckSquare size={16} /> Mark all as read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts / Activity Log */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Bell size={18} /> Direct Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={cn("py-4 flex gap-4 items-start first:pt-0 last:pb-0", !notif.isRead && "bg-primary/5 -mx-4 px-4 rounded-md")}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{notif.title}</h4>
                        {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{notif.message}</p>
                      
                      {/* Context Link */}
                      {notif.referenceId && (
                        <div className="pt-2">
                          <Link 
                            to={`/student/complaints/${notif.referenceId}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            View Complaint Details &rarr;
                          </Link>
                        </div>
                      )}
                      
                      <span className="block text-[10px] text-slate-400 pt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {!notif.isRead && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleMarkAsRead(notif.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Megaphone size={18} /> Broadcast Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No announcements broadcasted.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                    <span className="block text-[9px] text-slate-400 pt-1">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
