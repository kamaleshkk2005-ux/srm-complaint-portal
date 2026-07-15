import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { Category, Department } from '@/types';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Please provide more details (min 20 chars)').max(1000),
  departmentId: z.string().min(1, 'Please select a department'),
  categoryId: z.string().min(1, 'Please select a category'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  location: z.string().optional(),
  attachments: z.any()
    .refine((files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

const NewComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  });

  const attachments = watch('attachments');
  const filePreview = attachments && attachments.length > 0 ? attachments[0].name : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, depRes] = await Promise.all([
          api.get('/master/categories'),
          api.get('/master/departments')
        ]);
        setCategories(catRes.data.data);
        setDepartments(depRes.data.data);
      } catch (err) {
        console.error('Failed to load form data', err);
        setError('Failed to load departments and categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: ComplaintFormValues) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('departmentId', data.departmentId);
      formData.append('categoryId', data.categoryId);
      formData.append('priority', data.priority);
      if (data.location) formData.append('location', data.location);
      
      if (data.attachments && data.attachments.length > 0) {
        formData.append('attachments', data.attachments[0]);
      }

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate('/student/complaints', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading form...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/student/complaints">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Submit New Complaint
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Please provide detailed information about your issue.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input 
                id="title" 
                placeholder="Brief summary of the issue" 
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Related Department *</Label>
                <select
                  id="departmentId"
                  {...register('departmentId')}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    errors.departmentId ? 'border-red-500' : ''
                  )}
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    errors.categoryId ? 'border-red-500' : ''
                  )}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <textarea
                id="description"
                rows={5}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.description ? 'border-red-500' : ''
                )}
                placeholder="Provide as much detail as possible to help us resolve the issue quickly..."
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location / Room No (Optional)</Label>
                <Input 
                  id="location" 
                  placeholder="e.g. Main Block, Room 302" 
                  {...register('location')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachment (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="file"
                    id="attachments"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    {...register('attachments')}
                  />
                  <Label 
                    htmlFor="attachments" 
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Image or PDF</span>
                  </Label>
                </div>
                {filePreview && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md max-w-[200px]">
                    <span className="text-xs truncate">{filePreview}</span>
                  </div>
                )}
              </div>
              {errors.attachments && <p className="text-sm text-red-500">{errors.attachments?.message?.toString()}</p>}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-4 border-t pt-6">
            <Button variant="outline" type="button" onClick={() => navigate('/student/complaints')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewComplaint;
