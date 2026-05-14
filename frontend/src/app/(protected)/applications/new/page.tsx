'use client';

import { ApplicationForm } from './_components/application-form';

export default function NewApplicationPage() {
  return (
    <div className="max-w-4xl mx-auto pt-2 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Application</h1>
        <p className="text-muted-foreground mt-1">
          Complete the form below to submit a new bank licensing application. Ensure all details are accurate before submission.
        </p>
      </div>
      <ApplicationForm />
    </div>
  );
}
