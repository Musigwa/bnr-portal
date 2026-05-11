'use client';

import { Suspense } from 'react';
import { useAuth } from '@/providers/auth.provider';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // The proxy middleware / AuthContext will handle the redirect
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <div className="container mx-auto flex max-w-7xl flex-1 flex-col">
        <main className="flex-1 px-4 py-8 md:px-8">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </div>

      <Footer />
    </div>
  );
}
