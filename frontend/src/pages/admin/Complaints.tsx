import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { Complaint, PaginationMeta } from '@/types';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/complaints?search=${search}`);
      setComplaints(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching complaints', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const getStatusBadge = (status: string) => {
    let classes = "px-2.5 py-0.5 rounded-full text-xs font-semibold ";
    switch (status) {
      case 'SUBMITTED': classes += 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'; break;
      case 'ASSIGNED': classes += 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'; break;
      case 'IN_PROGRESS': classes += 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'; break;
      case 'RESOLVED': classes += 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'; break;
      case 'REJECTED': classes += 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'; break;
      default: classes += 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
    return <span className={classes}>{status.replace(/_/g, ' ')}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    let classes = "px-2.5 py-0.5 rounded-md text-xs font-medium border ";
    switch (priority) {
      case 'LOW': classes += 'border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'; break;
      case 'MEDIUM': classes += 'border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'; break;
      case 'HIGH': classes += 'border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20'; break;
      case 'URGENT': classes += 'border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/20'; break;
    }
    return <span className={classes}>{priority}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          All Registered Complaints
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Monitor and track all student tickets institutional-wide.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search by ID or title..." 
              className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Button variant="outline" className="w-full sm:w-auto gap-2 text-slate-600 dark:text-slate-300">
            <Filter size={16} /> Filters
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div></div>
                </TableCell>
              </TableRow>
            ) : complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  No complaints found in the system.
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {complaint.complaintId}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={complaint.title}>
                    {complaint.title}
                  </TableCell>
                  <TableCell>{complaint.department?.name}</TableCell>
                  <TableCell>{complaint.student?.fullName}</TableCell>
                  <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                  <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/complaints/${complaint.id}`}>Process</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{complaints.length}</span> of <span className="font-medium">{pagination.total}</span> results
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPreviousPage}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!pagination.hasNextPage}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaints;
