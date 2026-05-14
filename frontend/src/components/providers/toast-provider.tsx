'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right" 
      richColors 
      closeButton 
      theme="system"
      toastOptions={{
        style: {
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        },
      }}
    />
  );
}
