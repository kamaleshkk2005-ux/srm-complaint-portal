import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token || !userId) {
      setError('Invalid or expired password reset link.');
      return;
    }

    try {
      setError(null);
      const response = await api.post(`/auth/reset-password?id=${userId}`, {
        token,
        password: data.password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Link may have expired.'
      );
    }
  };

  if (!token || !userId) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium text-red-600">Invalid Link</h3>
        <p className="text-sm text-slate-500">
          This password reset link is invalid or expired. Please request a new one.
        </p>
        <Button asChild className="w-full">
          <Link to="/auth/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Reset Password</h3>
        <p className="text-xs text-slate-500 mt-1">
          Enter your new password below.
        </p>
      </div>

      {success && (
        <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200">
          <p className="text-sm text-emerald-800 font-medium">
            Password reset successful! Redirecting to login page...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
      )}

      <div className="text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
