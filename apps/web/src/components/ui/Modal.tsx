// Create a simple modal component without portals
// src/components/Modal.tsx
'use client';

import { useEffect, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  // Force client-side rendering by using useState
  const [isMounted, setIsMounted] = useState(false);

  // Enable scroll locking when modal is open
  useEffect(() => {
    setIsMounted(true);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Don't render anything on server or if modal is closed
  if (!isMounted || !isOpen) return null;

  // Prevent clicks inside the modal from closing it
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with high z-index */}
      <div 
        className="absolute inset-0 bg-gray-500 bg-opacity-75"
        style={{ zIndex: 9999 }}
      />
      
      {/* Modal content with even higher z-index */}
      <div 
        className="relative bg-white rounded-lg shadow-xl text-left overflow-hidden w-full max-w-lg mx-4"
        style={{ zIndex: 10000 }}
        onClick={handleModalContentClick}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            {title && (
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full border-b pb-2 mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {title}
                </h3>
              </div>
            )}
          </div>
          <div className="mt-2">
            {children}
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
