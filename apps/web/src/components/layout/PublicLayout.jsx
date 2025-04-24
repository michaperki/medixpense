// apps/web/src/components/layout/PublicLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-blue-600 font-bold text-2xl">Medixpense</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/search" className="border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Find Procedures
                </Link>
                <Link to="/providers" className="border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Providers
                </Link>
                <Link to="/about" className="border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <>
                  <Link to="/provider/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium mr-2">
                    Dashboard
                  </Link>
                  <button onClick={logout} className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium mr-2">
                    Login
                  </Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2 space-x-6">
              <Link to="/about" className="text-gray-400 hover:text-gray-300">About</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-gray-300">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-gray-300">Terms</Link>
              <Link to="/contact" className="text-gray-400 hover:text-gray-300">Contact</Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Medixpense. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
