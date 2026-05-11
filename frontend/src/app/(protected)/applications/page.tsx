'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Application, ApplicationStatus } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';

export default function ApplicationsPage() {
  const { data: applications, isLoading, error, refetch } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => apiClient.get('/applications'),
  });

  const getActionLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return 'Continue';
      case ApplicationStatus.PENDING_INFO:
        return 'Add Documents';
      default:
        return 'View';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-20 w-full mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
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
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">
            Manage your bank licensing applications.
          </p>
        </div>
        <Link href="/applications/new" className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" /> New Application
        </Link>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref#</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No applications found. Click New Application button to get started.
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.refNumber}</TableCell>
                  <TableCell>{app.institutionName}</TableCell>
                  <TableCell className="capitalize">{app.institutionType.toLowerCase().replace('_', ' ')}</TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/applications/${app.id}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      {getActionLabel(app.status)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
