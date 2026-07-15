import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Building, AlertCircle, Clock, CheckCircle2,
  TrendingUp, PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/analytics/stats'),
          api.get('/complaints?limit=5')
        ]);
        setStats(statsRes.data.data);
        setRecentComplaints(complaintsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch admin dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Console
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Institution-wide overview of operations and resolving pipelines.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.total || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
              <Clock className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.pendingAssignment || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active (In-Progress)</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.active || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.resolved || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Complaints */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Actionable Tickets</CardTitle>
              <CardDescription>Latest issues registered by students</CardDescription>
            </CardHeader>
            <CardContent>
              {recentComplaints.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  No complaints found.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <p className="text-sm font-semibold">{complaint.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {complaint.complaintId} • Student: {complaint.student?.fullName} • {complaint.department?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusColor(complaint.status) && (
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusColor(complaint.status))}>
                            {complaint.status}
                          </span>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/admin/complaints/${complaint.id}`}>Process</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operational Breakdowns */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <PieChart size={16} /> Category Breakups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.categories?.length > 0 ? (
                stats.categories.map((c: any) => (
                  <div key={c.categoryId} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{c.name}</span>
                      <span>{c.count} ({c.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Building size={16} /> Department Load
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.departments?.length > 0 ? (
                stats.departments.map((d: any) => (
                  <div key={d.departmentId} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{d.name}</span>
                      <span>{d.count} ({d.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full" 
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
