export enum Role {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_INFO = 'PENDING_INFO',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface Application {
  id: string;
  refNumber: string;
  status: ApplicationStatus;
  version: number;
  applicantId: string;
  reviewerId: string | null;
  institutionName: string;
  institutionType: string;
  registrationNumber: string | null;
  proposedCapital: number | null;
  applicantNotes: string | null;
  reviewerNotes: string | null;
  rejectionReason: string | null;
  applicant: Pick<User, 'id' | 'fullName' | 'email'>;
  reviewer: Pick<User, 'id' | 'fullName' | 'email'> | null;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
}

export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
  version: number;
  isSuperseded: boolean;
  uploadedAt: string;
}

export interface DocumentGroup {
  current: Document | null;
  history: Document[];
}

export interface AuditLog {
  id: string;
  applicationId: string;
  actorId: string;
  actor: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  action: string;
  statusBefore: ApplicationStatus | null;
  statusAfter: ApplicationStatus | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
