'use client';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="navbar-brand">Medixpense</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/search" className="nav-link">
                  Find Procedures
                </Link>
                <Link href="/providers" className="nav-link">
                  Providers
                </Link>
                <Link href="/about" className="nav-link">
                  About
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <>
                  <Link href="/provider/dashboard" className="btn btn-primary mr-2">
                    Dashboard
                  </Link>
                  <button onClick={logout} className="btn btn-outline">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-outline mr-2">
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-primary">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow bg-white">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2 space-x-6">
              <Link href="/about" className="text-gray-300 hover:text-white text-sm">About</Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white text-sm">Privacy</Link>
              <Link href="/terms" className="text-gray-300 hover:text-white text-sm">Terms</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white text-sm">Contact</Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Medixpense. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
