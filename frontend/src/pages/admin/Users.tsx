import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Power } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

const UsersManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [studRes, staffRes] = await Promise.all([
        api.get(`/admin/students?search=${search}`),
        api.get(`/admin/staff?search=${search}`)
      ]);
      setStudents(studRes.data.data);
      setStaff(staffRes.data.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentActive });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          User Directory Management
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Manage system accessibility for all Students and Staff.
        </p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by name or identifier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>
      </div>

      {/* Simple Custom Tabs since Radix Tabs isn't loaded completely or standard styled */}
      <Card>
        <CardHeader>
          <CardTitle>User Rosters</CardTitle>
          <CardDescription>Activate or deactivate student and staff credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex gap-4">
            <h3 className="font-semibold text-sm pb-2 border-b-2 border-primary">System Users</h3>
          </div>

          <h4 className="text-sm font-semibold mb-3">Students</h4>
          <Table className="mb-8">
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Register No</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No students found</TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.registerNumber}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{student.user?.email}</TableCell>
                    <TableCell>{student.department?.name}</TableCell>
                    <TableCell>{student.academicYear}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        student.user?.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {student.user?.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant={student.user?.isActive ? "destructive" : "outline"} 
                        size="sm"
                        onClick={() => handleToggleStatus(student.userId, student.user?.isActive)}
                        className="gap-1"
                      >
                        <Power size={14} /> {student.user?.isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <h4 className="text-sm font-semibold mb-3">Staff / Handlers</h4>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No staff found</TableCell>
                </TableRow>
              ) : (
                staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.employeeId}</TableCell>
                    <TableCell>{s.fullName}</TableCell>
                    <TableCell>{s.user?.email}</TableCell>
                    <TableCell>{s.department?.name}</TableCell>
                    <TableCell>{s.designation}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        s.user?.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {s.user?.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant={s.user?.isActive ? "destructive" : "outline"} 
                        size="sm"
                        onClick={() => handleToggleStatus(s.userId, s.user?.isActive)}
                        className="gap-1"
                      >
                        <Power size={14} /> {s.user?.isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;
