'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FieldErrors, ResolverResult, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  proposedCapital: z.number().min(1, 'Proposed capital must be greater than 0'),
  applicantNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewApplicationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    register,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
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
      
      return { values: {}, errors: errors as unknown as FieldErrors<FormValues> } as ResolverResult<FormValues>;
    },
    defaultValues: {
      institutionName: '',
      institutionType: '',
      registrationNumber: '',
      proposedCapital: undefined as unknown as number,
      applicantNotes: '',
    },
  });

  const institutionType = useWatch({ control, name: 'institutionType' });

  // Full submission sequence: Create Draft -> Upload Docs -> Submit
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // 1. Clean data and create application draft
      const cleanedData: Partial<FormValues> = { ...data };
      const capital = Number(cleanedData.proposedCapital);
      if (isNaN(capital)) {
        delete cleanedData.proposedCapital;
      } else {
        cleanedData.proposedCapital = capital;
      }
      
      const res = await apiClient.post<{ id: string }>('/applications', cleanedData);
      const appId = res.id;

      // 2. Upload files if any exist
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await apiClient.upload(`/applications/${appId}/documents`, formData);
        }
      }

      // 3. Submit application
      await apiClient.post(`/applications/${appId}/submit`);
      
      return appId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push('/applications');
    },
    onError: (error: unknown) => {
      setSubmissionError((error as { message: string }).message || 'An error occurred during submission. Please try again.');
    }
  });

  const onSubmit = (data: FormValues) => {
    setSubmissionError(null);
    submitApplicationMutation.mutate(data);
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

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Application</h1>
        <p className="text-muted-foreground mt-1">
          Complete the form below to submit a new bank licensing application. Ensure all details are accurate before submission.
        </p>
      </div>

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

            {/* Section 1: Institution Details */}
            <div>
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
                      <SelectValue placeholder="Select institution type" />
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
            </div>

            {/* Section 2: Notes & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Applicant Notes */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="applicantNotes" className="text-slate-700">Applicant Notes (Optional)</Label>
                <textarea
                  id="applicantNotes"
                  placeholder="Add any additional context or notes regarding this application..."
                  {...register('applicantNotes')}
                  className={`flex-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-base shadow-sm placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                    errors.applicantNotes ? 'border-red-500 bg-red-50/50' : ''
                  }`}
                />
                {errors.applicantNotes && (
                  <p className="text-sm text-red-500 font-medium">{errors.applicantNotes.message}</p>
                )}
              </div>

              {/* Document Upload */}
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
                  {files.length === 0 ? (
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
                        {files.map((file, index) => (
                          <div key={index} className="relative group flex flex-col items-center justify-center w-28 h-28 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden hover:border-primary transition-all">
                            
                            {/* Remove Button (appears on hover) */}
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
                            
                            {/* File Icon Preview */}
                            <div className="flex-1 flex items-center justify-center w-full bg-slate-50/50 group-hover:bg-primary/5 transition-colors">
                              <svg className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </div>
                            
                            {/* Filename & Size */}
                            <div className="w-full px-2 py-1.5 bg-white border-t border-slate-100 text-center">
                              <p className="text-[11px] font-medium text-slate-700 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {Math.round(file.size / 1024)} KB
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add More Card */}
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

                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="flex items-center justify-center sm:justify-end bg-slate-50/50 border-t py-4 px-6 mt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitApplicationMutation.isPending}
                className="flex-1 sm:flex-none sm:w-24 shadow-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitApplicationMutation.isPending || !isValid}
                className="flex-[2] sm:flex-none sm:px-8 shadow-sm font-semibold"
              >
                {submitApplicationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitApplicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
