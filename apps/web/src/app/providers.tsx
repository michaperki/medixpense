'use client';
import { ReactNode, useEffect } from 'react';
import { AuthProvider } from "@/app/context/AuthContext";
import { ToastProvider } from '@/hooks/useToast';
import { FocusVisibleProvider } from '@/components/FocusVisibleProvider';
import { configureLogger, LogLevel, LogContext, initializeLogger } from '@/lib/logger';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  // Initialize logger configuration on client-side only
  useEffect(() => {
    // Configure logging based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production logging - less verbose, focus on important events
      configureLogger({
        level: LogLevel.INFO,
        isProduction: true,
        // Only enable these contexts in production
        enabledContexts: new Set([
          LogContext.AUTH,
          LogContext.API,
          LogContext.DATA,
        ]),
        // Add additional redacted fields for the application
        redactedFields: new Set([
          'password', 
          'token', 
          'secret', 
          'key',
          'ssn',
          'socialSecurityNumber',
          'creditCard',
          'creditCardNumber'
        ]),
        // Disable grouped logs in production
        groupLogs: false,
        // Limited depth for production
        maxObjectDepth: 2,
        maxArrayLength: 10,
        // No deduplication in production
        deduplicate: false
      });
    } else {
      // Development logging - more verbose for debugging
      configureLogger({
        level: LogLevel.DEBUG,
        isProduction: false,
        // Enable all contexts in development
        enabledContexts: new Set(Object.values(LogContext)),
        // Enable grouped logs
        groupLogs: true,
        // Enable deduplication to reduce noise
        deduplicate: true
      });
    }
    
    // Initialize the logger with enhancements
    initializeLogger();
  }, []);

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
