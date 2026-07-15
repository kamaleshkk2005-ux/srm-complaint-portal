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
import { Trash2, Megaphone, PlusCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT' | 'STAFF'>('ALL');
  const [posting, setPosting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/announcements');
      setAnnouncements(response.data.data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setPosting(true);
      await api.post('/admin/announcements', {
        title,
        content,
        targetRole
      });
      setTitle('');
      setContent('');
      setTargetRole('ALL');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Broadcasts
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Post general announcements and bulletins directly to user dashboard queues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Directory Listing */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Broadcast History</CardTitle>
                <CardDescription>Review or delete previously transmitted alerts</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAnnouncements}>
                <RefreshCw size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Announcement Title</TableHead>
                    <TableHead>Date Posted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : announcements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No announcements broadcasted yet</TableCell>
                    </TableRow>
                  ) : (
                    announcements.map((ann) => (
                      <TableRow key={ann.id}>
                        <TableCell>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                            {ann.targetRole}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{ann.title}</div>
                          <p className="text-xs text-slate-500 max-w-[300px] truncate">{ann.content}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(ann.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 size={14} />
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
          <form onSubmit={handlePost}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-md">
                <Megaphone size={16} /> Broadcast New Update
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Headline *</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Server Maintenance, Hostel Registrations" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Audience Permissions *</Label>
                <select
                  id="target"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Bulletin Content *</Label>
                <textarea 
                  id="content" 
                  rows={4} 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Detailed notification body..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button type="submit" className="w-full gap-1.5" disabled={posting}>
                <PlusCircle size={16} /> {posting ? 'Broadcasting...' : 'Broadcast'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default AnnouncementsManagement;
