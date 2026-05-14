'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetApplications } from '@/hooks/api/use-applications';
import { useAuth } from '@/providers/auth.provider';
import { Role } from '@/types';
import { AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { ApplicationTable } from './_components/application-table';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { data: applications, isLoading, error, refetch } = useGetApplications();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load applications. Please try again.
            <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Applications</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage and track your bank licensing applications.
          </p>
        </div>
        <Link href="/applications/new" className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" /> New Application
        </Link>
      </div>
      
      <ApplicationTable 
        applications={applications || []}
        role={user?.role || Role.APPLICANT}
      />
    </div>
  );
}
