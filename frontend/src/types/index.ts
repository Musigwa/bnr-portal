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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedById: string;
  version: number;
  isSuperseded: boolean;
  supersededBy: string | null;
  uploadedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  tinNumber: string;
}

export interface Application {
  id: string;
  refNumber: string;
  institutionName: string;
  institutionType: string;
  tinNumber: string;
  proposedCapital: number;
  status: ApplicationStatus;
  applicantId: string;
  reviewerId: string | null;
  approverId: string | null;
  applicantNotes: string | null;
  reviewerNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  applicant: Pick<User, 'id' | 'fullName' | 'email'>;
  reviewer: Pick<User, 'id' | 'fullName' | 'email'> | null;
  approver: Pick<User, 'id' | 'fullName' | 'email'> | null;
  documents: Document[];
}

export interface DocumentGroup {
  current: Document | null;
  history: Document[];
}

export interface AuditLog {
  id: string;
  applicationId: string;
  actorId: string;
  action: string;
  statusBefore: ApplicationStatus | null;
  statusAfter: ApplicationStatus | null;
  createdAt: string;
  actor: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  metadata: Record<string, unknown> | null;
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
