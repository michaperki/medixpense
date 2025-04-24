// apps/web/src/components/ui/ErrorAlert.tsx
import React from 'react';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  className = '' 
}) => {
  return (
    <div className={`rounded-md bg-red-50 p-4 mx-6 my-4 ${className}`}>
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
        </div>
      </div>
    </div>
  );
};
