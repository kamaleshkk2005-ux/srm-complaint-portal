import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Sector
} from 'recharts';
import {
  BarChart2, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, Activity,
  Download, FileSpreadsheet, FileText, Image, Filter, RefreshCw, ChevronDown,
  ArrowUpRight, Layers, Target, Zap, XCircle, LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#6366f1',
  ASSIGNED: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  WAITING_FOR_STUDENT: '#8b5cf6',
  RESOLVED: '#10b981',
  REJECTED: '#ef4444',
  CLOSED: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#dc2626',
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

// ── Animated Counter ─────────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, subtitle, delay = 0 }: {
  title: string; value: number; icon: any; color: string; subtitle?: string; delay?: number;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:border-primary/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-opacity-15`} style={{ background: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <ArrowUpRight size={14} className="text-slate-400" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{animated.toLocaleString()}</p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5" style={{ background: color }} />
    </motion.div>
  );
}

// ── Chart Card Wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, description, children, delay = 0, chartRef }: {
  title: string; description?: string; children: React.ReactNode; delay?: number; chartRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/50"
    >
      <div className="px-6 pt-5 pb-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div ref={chartRef} className="px-2 pb-4">{children}</div>
    </motion.div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color || '#fff' }}>
          {entry.name}: <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Skeleton Loader ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 mb-3" />
      <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
      <div className="h-48 w-full rounded-lg bg-slate-100 dark:bg-slate-700/50" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <BarChart2 size={36} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No data for selected filters</h3>
      <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or date range.</p>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ReportsManagement = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);

  // ── Data State ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // ── Master Data ─────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // ── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    status: '', priority: '', departmentId: '', categoryId: '', dateFrom: '', dateTo: '',
  });
  const [filtersOpen, setFiltersOpen] = useState(true);

  // ── Pie active state ─────────────────────────────────────────────────────────
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);

  // ── Fetch Master Data ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.get('/master/departments'), api.get('/master/categories')])
      .then(([depRes, catRes]) => {
        setDepartments(depRes.data.data || []);
        setCategories(catRes.data.data || []);
      }).catch(console.error);
  }, []);

  // ── Fetch Dashboard Data ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/analytics/reports/dashboard?${params.toString()}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter change handler ────────────────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', departmentId: '', categoryId: '', dateFrom: '', dateTo: '' });
  };

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v !== '').length,
    [filters]
  );

  // ── Export helpers ────────────────────────────────────────────────────────────
  const getQueryString = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    return params.toString();
  }, [filters]);

  const handleExport = async (type: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const qs = getQueryString();
      const endpoint = type === 'csv' ? 'csv' : 'excel';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${baseUrl}/analytics/reports/${endpoint}?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `complaints_report.${type === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.setFontSize(18);
      pdf.setTextColor(79, 70, 229);
      pdf.text('SRM University - Analytics Dashboard', pdfWidth / 2, 14, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pdfWidth / 2, 20, { align: 'center' });
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      pdf.save('analytics_dashboard.pdf');
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPNG = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const link = document.createElement('a');
      link.download = 'analytics_dashboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error('PNG export failed', err); }
  };

  const summary = data?.summary;
  const hasData = summary && summary.total > 0;

  // ── Formatted Chart Data ──────────────────────────────────────────────────────
  const statusChartData = useMemo(() => {
    if (!data?.statusDist) return [];
    return data.statusDist.map((s: any) => ({
      name: s.status.replace(/_/g, ' '),
      value: s.count,
      fill: STATUS_COLORS[s.status] || '#6b7280',
    }));
  }, [data]);

  const departmentChartData = useMemo(() => {
    if (!data?.departments) return [];
    return data.departments.map((d: any) => ({ name: d.code || d.department, full: d.department, count: d.count }));
  }, [data]);

  const categoryChartData = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.slice(0, 8).map((c: any) => ({ name: c.category, count: c.count }));
  }, [data]);

  const priorityChartData = useMemo(() => {
    if (!data?.priorities) return [];
    return data.priorities.map((p: any) => ({
      name: p.priority,
      value: p.count,
      fill: PRIORITY_COLORS[p.priority] || '#6b7280',
    }));
  }, [data]);

  const trendChartData = useMemo(() => data?.trend || [], [data]);
  const staffChartData = useMemo(() => data?.staffPerformance?.slice(0, 6) || [], [data]);

  // ── Render Active Pie Sector ───────────────────────────────────────────────
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#1e293b" fontSize={13} fontWeight={600}>{payload.name}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6366f1" fontSize={20} fontWeight={700}>{value}</text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Real-time complaint metrics, charts & exports</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('csv')} disabled={exporting}>
            <FileText size={14} /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-emerald-400 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50" onClick={() => handleExport('excel')} disabled={exporting}>
            <FileSpreadsheet size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPNG}>
            <Image size={14} /> PNG
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={handleExportPDF} disabled={exportingPdf}>
            {exportingPdf ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            PDF
          </Button>
        </div>
      </motion.div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5">{activeFilterCount} active</span>
            )}
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                {/* Status */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</Label>
                  <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200">
                    <option value="">All</option>
                    {['SUBMITTED','ASSIGNED','IN_PROGRESS','WAITING_FOR_STUDENT','RESOLVED','REJECTED','CLOSED'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </div>
                {/* Priority */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Priority</Label>
                  <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200">
                    <option value="">All</option>
                    {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {/* Department */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Department</Label>
                  <select value={filters.departmentId} onChange={e => handleFilterChange('departmentId', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200">
                    <option value="">All</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {/* Category */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</Label>
                  <select value={filters.categoryId} onChange={e => handleFilterChange('categoryId', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200">
                    <option value="">All</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {/* Date From */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">From</Label>
                  <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200" />
                </div>
                {/* Date To */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">To</Label>
                  <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-2 text-slate-700 dark:text-slate-200" />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="px-5 pb-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-slate-500 hover:text-slate-900 h-8 text-xs">
                    <XCircle size={13} /> Clear all filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      <div ref={dashboardRef}>

        {/* ── Stat Cards ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total Complaints" value={summary?.total || 0} icon={Layers} color={COLORS.primary} delay={0} />
            <StatCard title="Pending" value={(summary?.submitted || 0) + (summary?.assigned || 0)} icon={Clock} color={COLORS.warning} delay={0.05} />
            <StatCard title="In Progress" value={summary?.inProgress || 0} icon={Activity} color={COLORS.info} delay={0.1} />
            <StatCard title="Resolved" value={summary?.resolved || 0} icon={CheckCircle2} color={COLORS.success} delay={0.15} />
            <StatCard title="Rejected" value={summary?.rejected || 0} icon={XCircle} color={COLORS.danger} delay={0.2} />
            <StatCard title="High Priority" value={summary?.highPriority || 0} icon={AlertTriangle} color="#ef4444" subtitle="+ Urgent" delay={0.25} />
            <StatCard title="Medium Priority" value={summary?.mediumPriority || 0} icon={Target} color={COLORS.warning} delay={0.3} />
            <StatCard title="Low Priority" value={summary?.lowPriority || 0} icon={CheckCircle2} color={COLORS.teal} delay={0.35} />
            <StatCard title="Avg Resolution" value={summary?.avgResolutionTime || 0} icon={Zap} color={COLORS.purple} subtitle="days" delay={0.4} />
          </div>
        )}

        {/* ── Charts Grid ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonChart key={i} />)}
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* A. Status Doughnut */}
            <ChartCard title="Complaint Status Distribution" description="Current status breakdown" delay={0.1}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    activeIndex={activeStatusIndex ?? undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveStatusIndex(index)}
                    onMouseLeave={() => setActiveStatusIndex(null)}
                    animationDuration={800}
                  >
                    {statusChartData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="text-xs text-slate-600 dark:text-slate-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* B. Dept Bar Chart */}
            <ChartCard title="Complaints by Department" description="Vertical bar chart" delay={0.15}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {departmentChartData.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* E. Priority Pie */}
            <ChartCard title="Priority Distribution" description="Complaints by priority level" delay={0.2}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={priorityChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    animationDuration={800}
                  >
                    {priorityChartData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* D. Monthly Trend Line Chart - spans 2 columns */}
            <div className="md:col-span-2">
              <ChartCard title="Monthly Complaint Trends" description="Registered vs Resolved over last 12 months" delay={0.25}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="registered" name="Registered" stroke={COLORS.primary}
                      strokeWidth={2.5} dot={{ r: 4, fill: COLORS.primary }} activeDot={{ r: 6 }} animationDuration={1000} />
                    <Line type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.success}
                      strokeWidth={2.5} dot={{ r: 4, fill: COLORS.success }} activeDot={{ r: 6 }} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* C. Category Horizontal Bar */}
            <ChartCard title="Complaints by Category" description="Horizontal bar chart" delay={0.3}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={categoryChartData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]} animationDuration={800}>
                    {categoryChartData.map((_: any, index: number) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* G. Staff Performance Bar - full width */}
            {staffChartData.length > 0 && (
              <div className="md:col-span-2 xl:col-span-3">
                <ChartCard title="Staff Performance" description="Assigned vs Resolved complaints per staff member" delay={0.35}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={staffChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="staffName" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="assigned" name="Assigned" fill={COLORS.primary} radius={[4, 4, 0, 0]} animationDuration={800} />
                      <Bar dataKey="resolved" name="Resolved" fill={COLORS.success} radius={[4, 4, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* F. Resolution Time Area Chart - spans 2 */}
            {trendChartData.length > 0 && (
              <div className="md:col-span-2">
                <ChartCard title="Resolution Trend (Area)" description="Cumulative complaint resolution over time" delay={0.4}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradRegistered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="registered" name="Registered" stroke={COLORS.primary} fill="url(#gradRegistered)" strokeWidth={2} animationDuration={1000} />
                      <Area type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.success} fill="url(#gradResolved)" strokeWidth={2} animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* Summary mini cards at bottom */}
            <ChartCard title="Quick Summary" description="Key performance indicators" delay={0.45}>
              <div className="space-y-3 px-2 py-2">
                {[
                  { label: 'Resolution Rate', value: summary?.total ? `${Math.round(((summary.resolved || 0) / summary.total) * 100)}%` : '0%', color: COLORS.success },
                  { label: 'Avg Resolution Time', value: `${summary?.avgResolutionTime || 0} days`, color: COLORS.purple },
                  { label: 'Unresolved', value: ((summary?.submitted || 0) + (summary?.assigned || 0) + (summary?.inProgress || 0)).toString(), color: COLORS.warning },
                ].map(({ label, value, color }, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

          </div>
        )}
      </div>

      {/* ── Export Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Download size={16} className="text-primary" /> Export Reports
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export filtered data in multiple formats.{' '}
              {activeFilterCount > 0 && <span className="text-primary font-medium">{activeFilterCount} filter(s) active.</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleExport('csv')} disabled={exporting} variant="outline" size="sm" className="gap-2 h-9">
              {exporting ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
              Export CSV
            </Button>
            <Button onClick={() => handleExport('excel')} disabled={exporting}
              className="gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
              {exporting ? <RefreshCw size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
              Export Excel (6 Sheets)
            </Button>
            <Button onClick={handleExportPNG} variant="outline" size="sm" className="gap-2 h-9">
              <Image size={13} /> Download PNG
            </Button>
            <Button onClick={handleExportPDF} disabled={exportingPdf}
              className="gap-2 h-9 bg-primary hover:bg-primary/90" size="sm">
              {exportingPdf ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              Export PDF
            </Button>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default ReportsManagement;
