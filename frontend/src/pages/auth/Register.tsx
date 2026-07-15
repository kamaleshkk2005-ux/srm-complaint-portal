import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';
import { Department } from '@/types';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    registerNumber: z
      .string()
      .min(5, 'Register number must be at least 5 characters')
      .max(20)
      .regex(/^[A-Z0-9]+$/i, 'Register number must be alphanumeric'),
    email: z.string().email('Please enter a valid email'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6-9'),
    departmentId: z.string().min(1, 'Please select your department'),
    academicYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year'], {
      errorMap: () => ({ message: 'Please select your academic year' }),
    }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/master/departments');
        setDepartments(response.data.data);
      } catch (err) {
        console.error('Failed to load departments', err);
        setError('Failed to load departments. Please reload the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', data);
      
      if (response.data.success) {
        // Redirect to login page upon success
        navigate('/auth/login?registered=true');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check details and try again.'
      );
    }
  };

  if (loading) {
    return <div className="text-center py-6">Loading registration form...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            {...register('fullName')}
            className={errors.fullName ? 'border-red-500' : ''}
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="registerNumber">Register / Roll Number</Label>
            <Input
              id="registerNumber"
              type="text"
              {...register('registerNumber')}
              className={errors.registerNumber ? 'border-red-500' : ''}
              placeholder="e.g. 21CS001"
            />
            {errors.registerNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.registerNumber.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="text"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="9876543210"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">College Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="johndoe@college.edu"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departmentId">Department</Label>
            <select
              id="departmentId"
              {...register('departmentId')}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.departmentId ? 'border-red-500' : ''
              )}
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="academicYear">Academic Year</Label>
            <select
              id="academicYear"
              {...register('academicYear')}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.academicYear ? 'border-red-500' : ''
              )}
            >
              <option value="">Select Year...</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            {errors.academicYear && (
              <p className="mt-1 text-sm text-red-500">{errors.academicYear.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-500">Already have an account? </span>
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
