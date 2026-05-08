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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  proposedCapital: z.number().min(1, 'Proposed capital must be greater than 0'),
  applicantNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Institution Details' },
  { id: 2, title: 'Capital & Notes' },
  { id: 3, title: 'Document Upload' },
  { id: 4, title: 'Review & Submit' },
];

export default function NewApplicationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormValues>({
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
      proposedCapital: 0,
      applicantNotes: '',
    },
  });

  const institutionType = useWatch({ control, name: 'institutionType' });

  // Mutation to create or update draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const cleanedData: Partial<FormValues> = { ...data };
      // Ensure proposedCapital is a valid number or remove it if it's NaN/empty
      const capital = Number(cleanedData.proposedCapital);
      if (isNaN(capital)) {
        delete cleanedData.proposedCapital;
      } else {
        cleanedData.proposedCapital = capital;
      }
      
      if (applicationId) {
        return apiClient.patch(`/applications/${applicationId}`, cleanedData);
      } else {
        const res = await apiClient.post<{ id: string }>('/applications', cleanedData);
        setApplicationId(res.id);
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  // Mutation to submit application
  const submitMutation = useMutation({
    mutationFn: () => apiClient.post(`/applications/${applicationId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push('/applications');
    },
  });

  const handleNext = async () => {
    // Save draft on step navigation
    if (currentStep === 1 || currentStep === 2) {
      try {
        await saveDraftMutation.mutateAsync(getValues());
      } catch (error: unknown) {
        console.error('Failed to save draft', error instanceof Error ? error.message : error);
        return; // Don't proceed if save fails
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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

  const uploadFiles = async () => {
    if (!applicationId || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await apiClient.upload(`/applications/${applicationId}/documents`, formData);
      }
      alert('Files uploaded successfully!');
      setFiles([]);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload some files.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = () => {
    submitMutation.mutate();
  };

  return (
    <div className="container mx-auto py-10 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Application</h1>
        <p className="text-muted-foreground">
          Complete the steps below to apply for a bank license.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b pb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span
              className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.title}
            </span>
            {step.id < 4 && <div className="h-px w-10 bg-muted" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Enter the details of the institution.'}
            {currentStep === 2 && 'Enter financial details and notes.'}
            {currentStep === 3 && 'Upload required documents (Max 5MB per file).'}
            {currentStep === 4 && 'Review all details before submitting.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Institution Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  placeholder="e.g. Kigali Commercial Bank"
                  {...register('institutionName')}
                  className={errors.institutionName ? 'border-red-500' : ''}
                />
                {errors.institutionName && (
                  <p className="text-sm text-red-500">{errors.institutionName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionType">Institution Type</Label>
                <Select
                  onValueChange={(value) => setValue('institutionType', value ?? '')}
                  value={institutionType ?? undefined}
                >
                  <SelectTrigger className={errors.institutionType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMERCIAL_BANK">Commercial Bank</SelectItem>
                    <SelectItem value="MICROFINANCE">Microfinance</SelectItem>
                    <SelectItem value="DIGITAL_BANK">Digital Bank</SelectItem>
                  </SelectContent>
                </Select>
                {errors.institutionType && (
                  <p className="text-sm text-red-500">{errors.institutionType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g. RDB-2026-001"
                  {...register('registrationNumber')}
                  className={errors.registrationNumber ? 'border-red-500' : ''}
                />
                {errors.registrationNumber && (
                  <p className="text-sm text-red-500">{errors.registrationNumber.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Capital & Notes */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposedCapital">Proposed Capital (RWF)</Label>
                <Input
                  id="proposedCapital"
                  type="number"
                  placeholder="e.g. 5000000"
                  {...register('proposedCapital', { valueAsNumber: true })}
                  className={errors.proposedCapital ? 'border-red-500' : ''}
                />
                {errors.proposedCapital && (
                  <p className="text-sm text-red-500">{errors.proposedCapital.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicantNotes">Applicant Notes</Label>
                <textarea
                  id="applicantNotes"
                  placeholder="Add any additional notes here..."
                  {...register('applicantNotes')}
                  className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.applicantNotes ? 'border-red-500' : ''
                  }`}
                />
                {errors.applicantNotes && (
                  <p className="text-sm text-red-500">{errors.applicantNotes.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max file size: 5MB
                </p>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files</Label>
                  <ul className="border rounded-md divide-y">
                    {files.map((file, index) => (
                      <li key={index} className="flex justify-between items-center p-2 text-sm">
                        <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading || files.length === 0}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Files'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Institution Name</p>
                  <p className="font-medium">{getValues().institutionName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Institution Type</p>
                  <p className="font-medium capitalize">{getValues().institutionType?.toLowerCase().replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{getValues().registrationNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proposed Capital</p>
                  <p className="font-medium">{getValues().proposedCapital} RWF</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{getValues().applicantNotes || 'No notes provided'}</p>
                </div>
              </div>

              {saveDraftMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to save some details. Please ensure all steps are completed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitMutation.isPending}
          >
            Back
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={saveDraftMutation.isPending}>
              {saveDraftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={submitMutation.isPending || !applicationId}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
