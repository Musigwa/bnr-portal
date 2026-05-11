import * as z from 'zod';

export const formSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  proposedCapital: z.number().min(1, 'Proposed capital must be greater than 0'),
  applicantNotes: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
