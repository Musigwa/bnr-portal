'use client';

import { useAuth } from '@/providers/auth.provider';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // The proxy middleware / AuthContext will handle the redirect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex flex-col container mx-auto max-w-7xl">
        <main className="flex-1 py-8 px-4 md:px-8">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
