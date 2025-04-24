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
      <div className="card max-w-md w-full shadow-md">
        <div className="card-header">
          <h2 className="text-center text-2xl font-bold">Register</h2>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              <p className="alert-message">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-col form-group">
                <label htmlFor="firstName" className="form-label text-muted">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="form-input darker-placeholder"
                />
              </div>
              
              <div className="form-col form-group">
                <label htmlFor="lastName" className="form-label text-muted">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="form-input darker-placeholder"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label text-muted">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="form-input darker-placeholder"
                placeholder="you@medixpense.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label text-muted">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="form-input darker-placeholder"
                placeholder="••••••••"
              />
              <p className="form-help-text text-primary-500">Must be at least 8 characters</p>
            </div>

            <div className="mt-6">
              <button type="submit" className="btn btn-primary w-full">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
