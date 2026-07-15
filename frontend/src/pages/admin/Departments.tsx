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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Power, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

const DepartmentsManagement = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/master/departments');
      setDepartments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/master/departments/${id}/toggle-status`, { isActive: !currentActive });
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    try {
      setAdding(true);
      await api.post('/master/departments', {
        name,
        code: code.toUpperCase(),
        description
      });
      setName('');
      setCode('');
      setDescription('');
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create department');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Departments Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Configure master departments for user classifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Listing */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departments Directory</CardTitle>
                <CardDescription>Academic and organizational blocks</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDepartments}>
                <RefreshCw size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No departments defined</TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-bold">{dept.code}</TableCell>
                        <TableCell className="font-semibold">{dept.name}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={dept.description}>
                          {dept.description}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            dept.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                          )}>
                            {dept.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleStatus(dept.id, dept.isActive)}
                          >
                            <Power size={14} className={dept.isActive ? "text-red-500" : "text-emerald-500"} />
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

        {/* Right: Creation form */}
        <Card>
          <form onSubmit={handleAdd}>
            <CardHeader>
              <CardTitle>Add Department</CardTitle>
              <CardDescription>Enter values to create a new branch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code (Uppercase) *</Label>
                <Input 
                  id="code" 
                  placeholder="e.g. CSE, MECH" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Computer Science Engineering" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <textarea 
                  id="desc" 
                  rows={3} 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Details about this department..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button type="submit" className="w-full gap-1.5" disabled={adding}>
                <PlusCircle size={16} /> {adding ? 'Creating...' : 'Create Department'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default DepartmentsManagement;
