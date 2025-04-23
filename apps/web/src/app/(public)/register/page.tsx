
// src/app/(public)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      router.push('/provider/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6 p-8 bg-white rounded shadow">
        <h2 className="text-center text-2xl font-bold">Register</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium">First Name</label>
            <input
              id="firstName" name="firstName" type="text" required
              value={form.firstName} onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium">Last Name</label>
            <input
              id="lastName" name="lastName" type="text" required
              value={form.lastName} onChange={handleChange}
              className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password" name="password" type="password" required
            value={form.password} onChange={handleChange}
            className="mt-1 w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
          Create Account
        </button>
      </form>
    </div>
  );
}

