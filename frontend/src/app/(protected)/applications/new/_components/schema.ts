import * as z from 'zod';

export const formSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  tinNumber: z
    .string()
    .regex(/^\d{9}$/, 'TIN Number must be exactly 9 numeric digits'),
  proposedCapital: z.number().min(1, 'Proposed capital must be greater than 0'),
  applicantNotes: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
