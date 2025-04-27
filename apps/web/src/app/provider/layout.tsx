
// --- Cleaned ProviderLayout.tsx ---
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getLogger, LogContext, cfg } from '@/lib/logger';
import {
  UserIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const log = getLogger(LogContext.RENDER);

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (!firstRender.current) return;
    firstRender.current = false;

    const timer = log.timer(`ProviderLayout Boot (${pathname})`);

    if (cfg.group) console.groupCollapsed?.(`[RENDER] 🚀 ProviderLayout (${pathname})`);

    log.info('Rendering ProviderLayout', { pathname, userHasProvider: !!user?.provider });

    if (!loading) {
      if (!isAuthenticated) {
        log.warn('User not authenticated, redirecting', { target: '/login?redirect=/provider/dashboard' });
        router.push('/login?redirect=/provider/dashboard');
      } else {
        log.info('User authenticated', { userId: user?.id, role: user?.role });
      }
    }

    timer.done();

    if (cfg.group) console.groupEnd?.();
  }, [isAuthenticated, loading, pathname, router, user]);

  const handleLogout = () => {
    log.info('User clicked logout');
    logout();
  };

  const isActive = (path: string) => pathname === path;
  const getLinkClass = (path: string) =>
    `flex items-center px-6 py-3 ${isActive(path) ? 'bg-blue-700 text-white font-medium' : 'text-blue-100 hover:bg-blue-700'}`;

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
      <div className="bg-blue-800 text-white w-64 flex-shrink-0">
        <div className="p-4 flex items-center">
          <Link href="/" className="text-xl font-bold text-white hover:text-white">
            Medixpense
          </Link>
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
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-grow bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}

