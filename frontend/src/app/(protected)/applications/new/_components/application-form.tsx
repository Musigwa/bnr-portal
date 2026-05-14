'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FieldErrors, ResolverResult, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useCreateApplication, useSubmitApplication, useUpdateApplication, useDeleteDocument } from '@/hooks/api/use-applications';
import { Application } from '@/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const institutionTypeLabels: Record<string, string> = {
  'COMMERCIAL_BANK': 'Commercial Bank',
  'MICROFINANCE': 'Microfinance',
  'DIGITAL_BANK': 'Digital Bank',
};

const formSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  proposedCapital: z.number().min(1, 'Proposed capital must be greater than 0'),
  applicantNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ApplicationFormProps {
  initialData?: Application;
  applicationId?: string;
}

export function ApplicationForm({ initialData, applicationId }: ApplicationFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState(initialData?.documents || []);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'all',
    resolver: async (values) => {
      const result = formSchema.safeParse(values);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      
      const errors: Record<string, { type: string; message: string }> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      });
      
      return { values, errors: errors as unknown as FieldErrors<FormValues> } as ResolverResult<FormValues>;
    },
    values: {
      institutionName: initialData?.institutionName || '',
      institutionType: initialData?.institutionType || '',
      registrationNumber: initialData?.registrationNumber || '',
      proposedCapital: initialData?.proposedCapital ? Number(initialData.proposedCapital) : 0,
      applicantNotes: initialData?.applicantNotes || '',
    },
  });

  const institutionType = useWatch({ control, name: 'institutionType' });

  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: createDraft } = useCreateApplication();
  const { mutateAsync: updateApp } = useUpdateApplication();
  const { mutateAsync: submitApp } = useSubmitApplication();
  const { mutateAsync: deleteDoc } = useDeleteDocument();

  const handleFormSubmit = async (data: FormValues, shouldSubmit = false) => {
    setSubmissionError(null);
    setIsLoading(true);
    try {
      let currentAppId = applicationId;
      let currentRefNumber = initialData?.refNumber;

      if (currentAppId) {
        // Update existing draft
        const res = await updateApp({ id: currentAppId, data });
        currentRefNumber = res.refNumber;
      } else {
        // 1. Create Draft
        const res = await createDraft(data);
        currentAppId = res.id;
        currentRefNumber = res.refNumber;
      }

      // 2. Upload new files (if any)
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await apiClient.upload(`/applications/${currentAppId}/documents`, formData);
        }
      }

      // 3. Conditional Submit
      if (shouldSubmit) {
        await submitApp(currentAppId);
        router.push('/applications');
      } else {
        // If it's just a save, stay or go to details
        if (!applicationId) {
          // If it was new, go to the new draft's detail page
          router.push(`/applications/${currentRefNumber}`);
        } else {
          // If it was already an edit, just go back to details
          router.push(`/applications/${currentRefNumber}`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setSubmissionError(err.message || 'An error occurred during submission.');
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
      } catch (error) {
        alert('Failed to delete document. Please try again.');
        console.error(error);
      }
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-4 pt-5">
          <CardTitle className="text-xl">Application Form</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          {submissionError && (
            <Alert variant="destructive">
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 font-bold">Form Validation Error</AlertTitle>
              <AlertDescription className="text-red-700 mt-1">
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key}>{error?.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="institutionName" className="text-slate-700">Institution Name <span className="text-red-500">*</span></Label>
              <Input
                id="institutionName"
                placeholder="e.g. Kigali Commercial Bank"
                {...register('institutionName')}
                className={errors.institutionName ? 'border-red-500 bg-red-50/50' : ''}
              />
              {errors.institutionName && (
                <p className="text-sm text-red-500 font-medium">{errors.institutionName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionType" className="text-slate-700">Institution Type <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => setValue('institutionType', value ?? '')}
                value={institutionType ?? undefined}
              >
                <SelectTrigger className={errors.institutionType ? 'border-red-500 bg-red-50/50' : ''}>
                  <SelectValue placeholder="Select institution type">
                    {institutionType ? institutionTypeLabels[institutionType] : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  <SelectItem value="COMMERCIAL_BANK">Commercial Bank</SelectItem>
                  <SelectItem value="MICROFINANCE">Microfinance</SelectItem>
                  <SelectItem value="DIGITAL_BANK">Digital Bank</SelectItem>
                </SelectContent>
              </Select>
              {errors.institutionType && (
                <p className="text-sm text-red-500 font-medium">{errors.institutionType.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber" className="text-slate-700">Registration Number <span className="text-red-500">*</span></Label>
              <Input
                id="registrationNumber"
                placeholder="e.g. RDB-2026-001"
                {...register('registrationNumber')}
                className={errors.registrationNumber ? 'border-red-500 bg-red-50/50' : ''}
              />
              {errors.registrationNumber && (
                <p className="text-sm text-red-500 font-medium">{errors.registrationNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposedCapital" className="text-slate-700">Proposed Capital (RWF) <span className="text-red-500">*</span></Label>
              <Input
                id="proposedCapital"
                type="number"
                placeholder="e.g. 5000000"
                {...register('proposedCapital', { valueAsNumber: true })}
                className={errors.proposedCapital ? 'border-red-500 bg-red-50/50' : ''}
              />
              {errors.proposedCapital && (
                <p className="text-sm text-red-500 font-medium">{errors.proposedCapital.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="applicantNotes" className="text-slate-700">Applicant Notes (Optional)</Label>
              <Textarea
                id="applicantNotes"
                placeholder="Add any additional context or notes regarding this application..."
                {...register('applicantNotes')}
                className={cn(
                  errors.applicantNotes ? 'border-red-500 bg-red-50/50' : '',
                  'min-h-[120px]'
                )}
              />
              {errors.applicantNotes && (
                <p className="text-sm text-red-500 font-medium">{errors.applicantNotes.message}</p>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <Label className="text-slate-700">Documents</Label>
              <div
                className={`flex-1 flex flex-col border-2 border-dashed border-slate-300 rounded-xl p-5 hover:bg-slate-50 transition-colors cursor-pointer ${
                  files.length === 0 ? 'items-center justify-center text-center' : ''
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {files.length === 0 && existingDocs.length === 0 ? (
                  <>
                    <Upload className="h-6 w-6 text-primary mb-2" />
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Max file size: 5MB per document
                    </p>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-slate-700">Selected Files</span>
                    </div>
                    <div 
                      className="w-full flex flex-wrap gap-3 cursor-default" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Existing Documents */}
                      {existingDocs.map((doc) => (
                        <div key={doc.id} className="relative group flex flex-col items-center justify-center w-28 h-28 border border-primary/20 rounded-xl bg-primary/5 shadow-sm overflow-hidden hover:border-primary transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExistingDoc(doc.id);
                            }}
                            className="absolute top-1 right-1 bg-white shadow-sm border text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                          <div className="flex-1 flex items-center justify-center w-full bg-primary/10">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div className="w-full px-2 py-1.5 bg-white border-t border-slate-100 text-center">
                            <p className="text-[11px] font-medium text-slate-700 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* New Files */}
                      {files.map((file, index) => (
                        <div key={`new-${index}`} className="relative group flex flex-col items-center justify-center w-28 h-28 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden hover:border-primary transition-all">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-1 right-1 bg-white shadow-sm border text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                          <div className="flex-1 flex items-center justify-center w-full bg-slate-50/50 group-hover:bg-primary/5 transition-colors">
                            <svg className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          </div>
                          <div className="w-full px-2 py-1.5 bg-white border-t border-slate-100 text-center">
                            <p className="text-[11px] font-medium text-slate-700 truncate" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div 
                        className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-primary cursor-pointer transition-colors"
                        onClick={() => document.getElementById('fileInput')?.click()}
                      >
                        <Upload className="h-5 w-5 text-slate-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-500">Add More</span>
                      </div>
                    </div>
                  </div>
                )}
                <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between bg-slate-50/50 border-t py-4 px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit((data) => handleFormSubmit(data, false))()}
              disabled={isLoading || !isValid}
              className="bg-white"
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
  );
}
