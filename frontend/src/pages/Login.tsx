import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const checkSession = useAuthStore((state) => state.checkSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('');
      await api.post('/auth/login', data);
      await checkSession();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Welcome Back</h1>
          <p className="text-[var(--text-muted)]">Log in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--text)]">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--text)]">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
