'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  useCreateApplication,
  useSubmitApplication,
  useResubmitApplication,
  useUpdateApplication,
  useDeleteDocument,
} from '@/hooks/api/use-applications';
import { Application, ApplicationStatus } from '@/types';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import { formSchema, FormValues } from './schema';
import { InstitutionFields } from './form-sections/institution-fields';
import { FinancialFields } from './form-sections/financial-fields';
import { DocumentUpload } from './form-sections/document-upload';

interface ApplicationFormProps {
  initialData?: Application;
  applicationId?: string;
  maxFileSizeMb: number;
}

export function ApplicationForm({
  initialData,
  applicationId,
  maxFileSizeMb,
}: ApplicationFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState(
    initialData?.documents || [],
  );
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const methods = useForm<FormValues>({
    mode: 'all',
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: initialData?.institutionName || '',
      institutionType: initialData?.institutionType || '',
      tinNumber: initialData?.tinNumber || '',
      proposedCapital: initialData?.proposedCapital || 0,
      applicantNotes: initialData?.applicantNotes || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = methods;

  const { mutateAsync: createDraft } = useCreateApplication();
  const { mutateAsync: updateApp } = useUpdateApplication();
  const { mutateAsync: submitApp } = useSubmitApplication();
  const { mutateAsync: resubmitApp } = useResubmitApplication();
  const { mutateAsync: deleteDoc } = useDeleteDocument();

  const handleFormSubmit = async (data: FormValues, shouldSubmit = false) => {
    if (shouldSubmit) {
      setIsSubmitLoading(true);
    } else {
      setIsDraftLoading(true);
    }
    try {
      let currentAppId = applicationId;
      let currentRefNumber = initialData?.refNumber;

      if (currentAppId) {
        const res = await updateApp({
          id: currentAppId,
          data,
          suppressNotification: shouldSubmit,
        });
        currentRefNumber = res.refNumber;
      } else {
        const res = await createDraft({
          ...data,
          suppressNotification: shouldSubmit,
        });
        currentAppId = res.id;
        currentRefNumber = res.refNumber;
      }

      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await apiClient.upload(
            `/applications/${currentAppId}/documents`,
            formData,
          );
        }
      }

      if (shouldSubmit) {
        if (initialData?.status === ApplicationStatus.PENDING_INFO) {
          await resubmitApp(currentAppId!);
        } else {
          await submitApp(currentAppId!);
        }
        router.push('/applications');
      } else {
        router.push(`/applications/${currentRefNumber}`);
      }
    } catch {
      // Handled globally by API hooks
    } finally {
      if (shouldSubmit) {
        setIsSubmitLoading(false);
      } else {
        setIsDraftLoading(false);
      }
    }
  };

  const onSubmit = (data: FormValues) => {
    handleFormSubmit(data, true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter((file) => {
        if (file.size > maxFileSizeMb * 1024 * 1024) {
          alert(`File ${file.name} exceeds ${maxFileSizeMb}MB limit.`);
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
      const validFiles = newFiles.filter((file) => {
        if (file.size > maxFileSizeMb * 1024 * 1024) {
          alert(`File ${file.name} exceeds ${maxFileSizeMb}MB limit.`);
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
    const doc = existingDocs.find((d) => d.id === docId);
    if (!doc) return;

    if (
      confirm(
        `Are you sure you want to permanently delete "${doc.fileName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteDoc({ applicationId: applicationId!, documentId: docId });
        setExistingDocs((prev) => prev.filter((d) => d.id !== docId));
      } catch {}
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
      >
        <Card className="border-border shadow-md">
          <CardHeader className="bg-muted/30 border-b pt-5 pb-4">
            <CardTitle className="text-xl">Application Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InstitutionFields />
              <FinancialFields />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="applicantNotes" className="text-foreground/90">
                  Applicant Notes (Optional)
                </Label>
                <Textarea
                  id="applicantNotes"
                  placeholder="Add any additional context or notes regarding this application..."
                  {...register('applicantNotes')}
                  className={cn(
                    errors.applicantNotes
                      ? 'border-destructive bg-destructive/5'
                      : '',
                    'min-h-[120px]',
                  )}
                />
                {errors.applicantNotes && (
                  <p className="text-destructive text-sm font-medium">
                    {errors.applicantNotes.message as string}
                  </p>
                )}
              </div>

              <DocumentUpload
                files={files}
                existingDocs={existingDocs}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                removeFile={removeFile}
                removeExistingDoc={removeExistingDoc}
                maxFileSizeMb={maxFileSizeMb}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex items-center justify-between border-t px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isDraftLoading || isSubmitLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleSubmit((data) => handleFormSubmit(data, false))()
                }
                disabled={isDraftLoading || isSubmitLoading || !isValid}
                className="bg-card"
              >
                {isDraftLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isDraftLoading || isSubmitLoading || !isValid}
                className="px-8 font-semibold shadow-sm"
              >
                {isSubmitLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitLoading
                  ? 'Submitting...'
                  : applicationId
                    ? 'Save & Submit'
                    : 'Submit Application'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
