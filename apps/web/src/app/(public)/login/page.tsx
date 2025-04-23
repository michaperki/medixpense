
// src/app/(public)/login/page.tsx
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
    try {
      await login(email, password);
      const redirect = params.get('redirect') || '/provider/dashboard';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6 p-8 bg-white rounded shadow">
        <h2 className="text-center text-2xl font-bold">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email" name="email" type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password" name="password" type="password" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}
