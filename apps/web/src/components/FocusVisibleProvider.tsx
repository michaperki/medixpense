
// components/FocusVisibleProvider.tsx
'use client';
import { useEffect } from 'react';

export function FocusVisibleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('focus-visible');
  }, []);
  return <>{children}</>;
}

