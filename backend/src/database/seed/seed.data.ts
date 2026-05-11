import { Role, ApplicationStatus } from '@prisma/client';

export const SEED_USERS = [
  {
    email: 'admin@bnr.rw',
    password: 'Admin@1234',
    fullName: 'BNR Admin',
    role: Role.ADMIN,
  },
  {
    email: 'applicant@example.com',
    password: 'Test@1234',
    fullName: 'Jane Applicant',
    role: Role.APPLICANT,
  },
  {
    email: 'reviewer@bnr.rw',
    password: 'Test@1234',
    fullName: 'John Reviewer',
    role: Role.REVIEWER,
  },
  {
    email: 'approver@bnr.rw',
    password: 'Test@1234',
    fullName: 'Mary Approver',
    role: Role.APPROVER,
  },
];

export const SEED_APPLICATIONS = [
  {
    refNumber: 'BNR-2026-0001',
    status: ApplicationStatus.UNDER_REVIEW,
    institutionName: 'Kigali Commercial Bank',
    institutionType: 'COMMERCIAL_BANK',
    registrationNumber: 'RDB-2026-001',
    proposedCapital: 5000000,
    applicantNotes: 'Initial application for commercial banking license.',
    reviewerEmail: 'reviewer@bnr.rw',
    applicantEmail: 'applicant@example.com',
  },
  {
    refNumber: 'BNR-2026-0002',
    status: ApplicationStatus.REVIEWED,
    institutionName: 'Rwanda Microfinance Ltd',
    institutionType: 'MICROFINANCE',
    registrationNumber: 'RDB-2026-002',
    proposedCapital: 1000000,
    applicantNotes: 'Application for microfinance institution license.',
    reviewerNotes: 'All documents verified. Recommended for approval.',
    reviewerEmail: 'reviewer@bnr.rw',
    applicantEmail: 'applicant@example.com',
  },
];
