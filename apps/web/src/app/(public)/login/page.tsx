'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const redirect = params.get('redirect') || '/provider/dashboard';
      router.push(redirect);
    } catch (err: any) {
      if (err.response?.data?.errors?.length) {
        setError(err.response.data.errors[0].msg);
      } else {
        setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full shadow-md">
        <div className="card-header">
          <h2 className="text-center text-2xl font-bold">Login</h2>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              <p className="alert-message">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label text-muted">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input darker-placeholder"
                placeholder="provider@medixpense.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label text-muted">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input darker-placeholder"
                placeholder="••••••••"
              />
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
