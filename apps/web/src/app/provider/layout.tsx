'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getLogger, LogContext } from '@/lib/logger';
import {
  UserIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Create a layout-specific logger
const layoutLogger = getLogger(LogContext.RENDER);

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get the current path

  const firstRender = useRef(true);

  // Redirect if not authenticated
  useEffect(() => {
    layoutLogger.debug('Checking authentication status', { 
      isAuthenticated, 
      loading,
      pathname
    });

    if (!loading && !isAuthenticated) {
      layoutLogger.info('User not authenticated, redirecting to login', {
        redirectTarget: '/provider/dashboard'
      });
      router.push('/login?redirect=/provider/dashboard');
    } else if (!loading && isAuthenticated) {
      layoutLogger.debug('User authenticated', { 
        userId: user?.id,
        role: user?.role
      });
    }
  }, [isAuthenticated, loading, router, pathname, user]);

  // Handle logout action
  const handleLogout = () => {
    layoutLogger.info('User initiated logout');
    logout();
  };

  if (loading) {
    layoutLogger.debug('Provider layout in loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Function to get the appropriate class based on active state
  const getLinkClass = (path: string) => {
    const baseClasses = "flex items-center px-6 py-3";
    return isActive(path) 
      ? `${baseClasses} bg-blue-700 text-white font-medium` 
      : `${baseClasses} text-blue-100 hover:bg-blue-700`;
  };

  if (firstRender.current) {
    firstRender.current = false;
    layoutLogger.info('Rendering provider layout', { pathname, userHasProvider: !!user?.provider });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-blue-800 text-white w-64 flex-shrink-0">
        <div className="p-4 flex items-center">
          <Link href="/" className="text-xl font-bold text-white hover:text-white">Medixpense</Link>
          <span className="ml-2 px-2 py-1 text-xs bg-blue-600 rounded">Provider</span>
        </div>
        <nav className="mt-8">
          <div className="px-4 pb-2">
            <p className="text-xs uppercase tracking-wider text-blue-300">Main</p>
          </div>
          <Link href="/provider/dashboard" className={getLinkClass('/provider/dashboard')}>
            <ChartBarIcon className="h-5 w-5" />
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link href="/provider/locations" className={getLinkClass('/provider/locations')}>
            <MapPinIcon className="h-5 w-5" />
            <span className="ml-3">Locations</span>
          </Link>
          <Link href="/provider/procedures" className={getLinkClass('/provider/procedures')}>
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <span className="ml-3">Procedures</span>
          </Link>
          
          <div className="px-4 pb-2 mt-8">
            <p className="text-xs uppercase tracking-wider text-blue-300">Account</p>
          </div>
          <Link href="/provider/profile" className={getLinkClass('/provider/profile')}>
            <UserIcon className="h-5 w-5" />
            <span className="ml-3">Profile</span>
          </Link>
          <Link href="/provider/settings" className={getLinkClass('/provider/settings')}>
            <Cog6ToothIcon className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
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
