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
    <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow-lg p-6" style={{ maxWidth: "500px" }}>
        <h2 className="text-center text-2xl mb-6">Login</h2>
        
        <form onSubmit={handleSubmit}>
          {error && <p className="text-danger mb-4">{error}</p>}
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-muted">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full"
              placeholder="provider@medixpense.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-muted">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full"
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full py-3"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
