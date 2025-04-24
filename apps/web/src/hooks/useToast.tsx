// src/hooks/useToast.tsx
'use client';

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
    
    return id;
  }, []);
  
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-0 right-0 p-4 z-50 space-y-2 w-full sm:w-auto max-w-md">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-lg p-4 flex items-center justify-between shadow-lg transform transition-all duration-300 ease-in-out ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => hideToast(toast.id)}
              className="ml-4 inline-flex flex-shrink-0 text-white focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
