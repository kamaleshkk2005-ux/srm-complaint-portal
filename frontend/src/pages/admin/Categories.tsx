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

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/master/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/master/categories/${id}/toggle-status`, { isActive: !currentActive });
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setAdding(true);
      await api.post('/master/categories', {
        name,
        description
      });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Complaint Categories
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Define issue classification templates like Academic, Hostel, Utilities, or Fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Directory Listing */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories roster</CardTitle>
                <CardDescription>All defined complaint classifications</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchCategories}>
                <RefreshCw size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Slug</TableHead>
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
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No categories defined</TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-semibold">{cat.name}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">{cat.slug}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={cat.description}>
                          {cat.description}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            cat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                          )}>
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleStatus(cat.id, cat.isActive)}
                          >
                            <Power size={14} className={cat.isActive ? "text-red-500" : "text-emerald-500"} />
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

        {/* Categories form */}
        <Card>
          <form onSubmit={handleAdd}>
            <CardHeader>
              <CardTitle>Create Category</CardTitle>
              <CardDescription>Define a new issue classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Label *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Hostel Amenities, Academics" 
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
                  placeholder="Summarise types of issues mapped..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button type="submit" className="w-full gap-1.5" disabled={adding}>
                <PlusCircle size={16} /> {adding ? 'Creating...' : 'Create Category'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default CategoriesManagement;
