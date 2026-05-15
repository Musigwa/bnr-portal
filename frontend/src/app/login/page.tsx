'use client';

import { Suspense } from 'react';
import { LoginForm } from './_components/login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
