// src/app/provider/layout.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  UserIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/provider/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-blue-800 text-white w-64 flex-shrink-0 hidden md:block">
        <div className="p-4 flex items-center">
          <Link href="/" className="text-xl font-bold">Medixpense</Link>
          <span className="ml-2 px-2 py-1 text-xs bg-blue-600 rounded">Provider</span>
        </div>
        <nav className="mt-8">
          <div className="px-4 pb-2">
            <p className="text-xs uppercase tracking-wider text-blue-300">Main</p>
          </div>
          <Link href="/provider/dashboard" className="flex items-center px-6 py-3 text-white hover:bg-blue-700">
            <ChartBarIcon className="h-5 w-5" />
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link href="/provider/locations" className="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700">
            <MapPinIcon className="h-5 w-5" />
            <span className="ml-3">Locations</span>
          </Link>
          <Link href="/provider/procedures" className="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700">
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <span className="ml-3">Procedures</span>
          </Link>
          
          <div className="px-4 pb-2 mt-8">
            <p className="text-xs uppercase tracking-wider text-blue-300">Account</p>
          </div>
          <Link href="/provider/profile" className="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700">
            <UserIcon className="h-5 w-5" />
            <span className="ml-3">Profile</span>
          </Link>
          <Link href="/provider/settings" className="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700">
            <Cog6ToothIcon className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="ml-3">Logout</span>
          </button>
        </nav>
        {user && (
          <div className="absolute bottom-0 w-64 p-4 bg-blue-900">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {(user.firstName?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate">
                  {user.provider?.organizationName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}
                </p>
                <p className="text-xs text-blue-300 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar + content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="bg-white shadow md:hidden">
          <div className="px-4 py-2 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">Medixpense</Link>
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
