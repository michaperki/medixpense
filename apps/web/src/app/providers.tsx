
// src/app/AppProviders.tsx – updated for logger v2

'use client';
import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/app/context/AuthContext';
import { ToastProvider } from '@/hooks/useToast';
import { FocusVisibleProvider } from '@/components/FocusVisibleProvider';
import { configureLogger, LogLevel, LogContext } from '@/lib/logger';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    // Configure MedXpense logger
    if (process.env.NODE_ENV === 'production') {
      configureLogger({
        level: LogLevel.INFO,
        isProd: true,
        enabledContexts: new Set([LogContext.AUTH, LogContext.API, LogContext.DATA]),
        redactedFields: new Set([
          'password',
          'token',
          'secret',
          'key',
          'ssn',
          'socialSecurityNumber',
          'creditCard',
          'creditCardNumber',
        ]),
        group: false,
        maxDepth: 2,
        maxArray: 10,
        dedupe: false,
      });
    } else {
      configureLogger({
        level: LogLevel.DEBUG,
        isProd: false,
        enabledContexts: new Set(Object.values(LogContext)),
        group: true,
        dedupe: true,
      });
    }
    // logger v2 auto‑initialises in the browser – no explicit call required.
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <FocusVisibleProvider>{children}</FocusVisibleProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

