import { Role, ApplicationStatus } from '@prisma/client';

export const SEED_USERS = [
  {
    email: 'admin@bnr.rw',
    password: 'Admin@Portal2026',
    fullName: 'BNR System Administrator',
    role: Role.ADMIN,
  },
  {
    email: 'alice.uwera@kcb.rw',
    password: 'KCB@Portal2026',
    fullName: 'Alice Uwera',
    role: Role.APPLICANT,
  },
  {
    email: 'jp.habimana@bnr.rw',
    password: 'BNR@Portal2026',
    fullName: 'Jean-Pierre Habimana',
    role: Role.REVIEWER,
  },
  {
    email: 'mc.mutoni@bnr.rw',
    password: 'BNR@Portal2026',
    fullName: 'Marie-Claire Mutoni',
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
    reviewerEmail: 'jp.habimana@bnr.rw',
    applicantEmail: 'alice.uwera@kcb.rw',
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
    reviewerEmail: 'jp.habimana@bnr.rw',
    applicantEmail: 'alice.uwera@kcb.rw',
  },
];
