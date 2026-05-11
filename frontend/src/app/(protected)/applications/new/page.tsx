import { Suspense } from 'react';
import { ApplicationForm } from './_components/application-form';

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-4xl pt-2 pb-12">
      <div className="mb-6">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          New Application
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete the form below to submit a new bank licensing application.
          Ensure all details are accurate before submission.
        </p>
      </div>
      <Suspense fallback={<div>Loading form...</div>}>
        <ApplicationForm
          maxFileSizeMb={parseInt(process.env.MAX_FILE_SIZE_MB!, 10)}
        />
      </Suspense>
    </div>
  );
}
