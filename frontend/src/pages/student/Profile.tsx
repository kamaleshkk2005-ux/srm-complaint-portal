import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Camera, Mail, Shield, Award, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  academicYear: z.string().optional(),
  personalEmail: z.string().email('Please enter a valid email address').or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.profile?.fullName || '',
      phone: (user?.profile as any)?.phone || '',
      academicYear: (user?.profile as any)?.academicYear || '',
      personalEmail: user?.personalEmail || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setError(null);
      setSuccess(null);
      await api.put('/users/profile', data);
      
      // Update local state
      updateUser({
        profile: {
          ...user?.profile,
          fullName: data.fullName,
          academicYear: data.academicYear,
        } as any,
        personalEmail: data.personalEmail || null,
      });

      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const imageUrl = response.data.data.url;
        updateUser({
          profile: {
            ...user?.profile,
            profileImage: imageUrl,
          } as any,
        });
        setSuccess('Profile image updated successfully.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your profile information and picture.
        </p>
      </div>

      {success && (
        <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200">
          <p className="text-sm text-emerald-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!user?.personalEmail && !success && !error && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">Please add your personal email address to receive complaint notifications.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Image & Metadata */}
        <Card className="flex flex-col items-center p-6 text-center">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary text-3xl font-bold uppercase border-2 overflow-hidden">
              {user?.profile?.profileImage ? (
                <img src={user.profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.email.charAt(0)
              )}
            </div>
            <label 
              htmlFor="profile-pic" 
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity",
                uploadingImage && "opacity-100"
              )}
            >
              <Camera className="text-white h-6 w-6 animate-pulse" />
            </label>
            <input
              type="file"
              id="profile-pic"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-lg">{user?.profile?.fullName || 'User'}</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              <Shield size={12} /> {user?.role}
            </span>
          </div>

          <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Mail size={14} /> <span>{user?.email}</span>
            </div>
            {user?.profile?.identifier && (
              <div className="flex items-center gap-2">
                <Award size={14} /> <span>ID: {user.profile.identifier}</span>
              </div>
            )}
            {user?.department && (
              <div className="flex items-center gap-2">
                <Calendar size={14} /> <span>Dept: {user.department.name}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  {...register('fullName')} 
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  {...register('phone')} 
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail">Personal Email Address</Label>
                <Input 
                  id="personalEmail" 
                  type="email"
                  placeholder="Enter your personal email address"
                  {...register('personalEmail')} 
                  className={errors.personalEmail ? 'border-red-500' : ''}
                />
                {errors.personalEmail && <p className="text-xs text-red-500">{errors.personalEmail.message}</p>}
              </div>

              {user?.role === 'STUDENT' && (
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <select
                    id="academicYear"
                    {...register('academicYear')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default Profile;
