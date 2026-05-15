'use client';

import { useGetApplicationById } from '@/hooks/api/use-applications';
import { useParams } from 'next/navigation';
import { ApplicationForm } from '../../new/_components/application-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ApplicationStatus } from '@/types';

export default function EditApplicationPage() {
  const { identifier } = useParams() as { identifier: string };
  const { data: application, isLoading, error } = useGetApplicationById(identifier);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load application data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const editableStatuses = [ApplicationStatus.DRAFT, ApplicationStatus.PENDING_INFO];
  
  if (!editableStatuses.includes(application.status)) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Denied</AlertTitle>
          <AlertDescription>Applications can only be edited when they are in Draft or Pending Information state.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Edit Application</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">Update your application details and documents.</p>
      </div>
      
      <ApplicationForm initialData={application} applicationId={identifier} />
    </div>
  );
}
