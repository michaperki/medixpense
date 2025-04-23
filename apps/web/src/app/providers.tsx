// src/app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from '@/hooks/useToast';
import { FocusVisibleProvider } from '@/components/FocusVisibleProvider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <FocusVisibleProvider>
          {children}
        </FocusVisibleProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
