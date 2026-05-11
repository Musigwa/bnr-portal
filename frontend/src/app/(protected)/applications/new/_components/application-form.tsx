'use client';

import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notifications';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useCreateApplication, useSubmitApplication, useResubmitApplication, useUpdateApplication, useDeleteDocument } from '@/hooks/api/use-applications';
import { Application, ApplicationStatus } from '@/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import { formSchema, FormValues } from './schema';
import { InstitutionFields } from './form-sections/institution-fields';
import { FinancialFields } from './form-sections/financial-fields';
import { DocumentUpload } from './form-sections/document-upload';

interface ApplicationFormProps {
  initialData?: Application;
  applicationId?: string;
}

export function ApplicationForm({ initialData, applicationId }: ApplicationFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState(initialData?.documents || []);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    mode: 'all',
    resolver: zodResolver(formSchema),
    values: {
      institutionName: initialData?.institutionName || '',
      institutionType: initialData?.institutionType || '',
      registrationNumber: initialData?.registrationNumber || '',
      proposedCapital: initialData?.proposedCapital ? Number(initialData.proposedCapital) : 0,
      applicantNotes: initialData?.applicantNotes || '',
    },
  });

  const { register, handleSubmit, formState: { errors, isValid } } = methods;

  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createDraft } = useCreateApplication();
  const { mutateAsync: updateApp } = useUpdateApplication();
  const { mutateAsync: submitApp } = useSubmitApplication();
  const { mutateAsync: resubmitApp } = useResubmitApplication();
  const { mutateAsync: deleteDoc } = useDeleteDocument();

  const handleFormSubmit = async (data: FormValues, shouldSubmit = false) => {
    setSubmissionError(null);
    setIsLoading(true);
    try {
      let currentAppId = applicationId;
      let currentRefNumber = initialData?.refNumber;

      if (currentAppId) {
        const res = await updateApp({ id: currentAppId, data });
        currentRefNumber = res.refNumber;
      } else {
        const res = await createDraft(data);
        currentAppId = res.id;
        currentRefNumber = res.refNumber;
      }

      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await apiClient.upload(`/applications/${currentAppId}/documents`, formData);
        }
      }

      if (shouldSubmit) {
        if (initialData?.status === ApplicationStatus.PENDING_INFO) {
          await resubmitApp(currentAppId!);
          notify.success('Application resubmitted successfully!');
        } else {
          await submitApp(currentAppId!);
          notify.success('Application submitted successfully!');
        }
        router.push('/applications');
      } else {
        notify.success('Application saved as draft');
        router.push(`/applications/${currentRefNumber}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      const msg = err.message || 'An error occurred during submission.';
      setSubmissionError(msg);
      notify.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    handleFormSubmit(data, true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDoc = async (docId: string) => {
    const doc = existingDocs.find(d => d.id === docId);
    if (!doc) return;

    if (confirm(`Are you sure you want to permanently delete "${doc.fileName}"? This action cannot be undone.`)) {
      try {
        await deleteDoc({ applicationId: applicationId!, documentId: docId });
        setExistingDocs((prev) => prev.filter((d) => d.id !== docId));
      } catch {
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
        <Card className="shadow-md border-border">
          <CardHeader className="bg-muted/30 border-b pb-4 pt-5">
            <CardTitle className="text-xl">Application Form</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {submissionError && (
              <Alert variant="destructive">
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            )}

            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive font-bold">Form Validation Error</AlertTitle>
                <AlertDescription className="text-destructive/90 mt-1">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([key, error]) => (
                      <li key={key}>{error?.message as string}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InstitutionFields />
              <FinancialFields />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="applicantNotes" className="text-foreground/90">Applicant Notes (Optional)</Label>
                <Textarea
                  id="applicantNotes"
                  placeholder="Add any additional context or notes regarding this application..."
                  {...register('applicantNotes')}
                  className={cn(
                    errors.applicantNotes ? 'border-destructive bg-destructive/5' : '',
                    'min-h-[120px]'
                  )}
                />
                {errors.applicantNotes && (
                  <p className="text-sm text-destructive font-medium">{errors.applicantNotes.message as string}</p>
                )}
              </div>

              <DocumentUpload 
                files={files}
                existingDocs={existingDocs}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                removeFile={removeFile}
                removeExistingDoc={removeExistingDoc}
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between bg-muted/30 border-t py-4 px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit((data) => handleFormSubmit(data, false))()}
                disabled={isLoading || !isValid}
                className="bg-card"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isValid}
                className="px-8 shadow-sm font-semibold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Submitting...' : (applicationId ? 'Save & Submit' : 'Submit Application')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
