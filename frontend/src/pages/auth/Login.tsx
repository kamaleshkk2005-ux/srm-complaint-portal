import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { Mail, Lock, GraduationCap, Building2, UserCog, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'STAFF', 'ADMIN'], {
    required_error: "Please select a role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  // Check for expired session from redirect
  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'STUDENT',
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
        role: data.role,  // ✅ Send selected role to backend for validation
      });
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;

        // ✅ Extra client-side guard: ensure returned role still matches
        if (user.role !== data.role) {
          setError('Selected role does not match this account. Please choose the correct role.');
          return;
        }

        login(accessToken, user);
        
        // Redirect based on role
        if (user.role === 'STUDENT') navigate('/student/dashboard');
        else if (user.role === 'STAFF') navigate('/staff/dashboard');
        else if (user.role === 'ADMIN') navigate('/admin/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to the server. Please ensure the backend API is running and the database is connected.');
      } else {
        setError(
          err.response?.data?.message || 'Failed to login. Please check your credentials.'
        );
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header / Logo Area */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
              <GraduationCap className="text-white" size={34} />
            </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">SRM University</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Complaint Management System</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Welcome Back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please sign in to your account</p>
      </div>

      {isExpired && (
        <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200 mb-6 flex items-start gap-2 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>Your session has expired. Please log in again.</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 border border-red-200 mb-6 flex items-start gap-2 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Role Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Select Role
          </Label>
          <div className="relative">
            <select
              {...register('role')}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-blue-600 appearance-none"
            >
              <option value="STUDENT">Student</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
            {/* Custom chevron for select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
        </div>

        {/* Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email Address
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`h-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-600'}`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={`h-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-blue-600'}`}
              placeholder="Enter your password"
            />
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] rounded-md transition-colors shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      
      {/* Demo Credentials Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>For demo purposes, use these test accounts:</p>
        <p className="mt-0.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Admin:</span> admin@college.edu / Admin@123</p>
        <p className="mt-0.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Student:</span> student1@college.edu / Student@123</p>
      </div>
    </div>
  );
};

export default Login;
