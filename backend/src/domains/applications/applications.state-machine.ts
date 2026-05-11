import { ApplicationStatus, Role } from '@prisma/client';
import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type Transition =
  | 'SUBMIT'
  | 'ASSIGN_REVIEWER'
  | 'REQUEST_INFO'
  | 'COMPLETE_REVIEW'
  | 'RESUBMIT'
  | 'APPROVE'
  | 'REJECT';

interface TransitionRule {
  from: ApplicationStatus;
  to: ApplicationStatus;
  allowedRoles: Role[];
}

export const TRANSITION_MAP: Record<Transition, TransitionRule> = {
  SUBMIT: {
    from: ApplicationStatus.DRAFT,
    to: ApplicationStatus.SUBMITTED,
    allowedRoles: [Role.APPLICANT],
  },
  ASSIGN_REVIEWER: {
    from: ApplicationStatus.SUBMITTED,
    to: ApplicationStatus.UNDER_REVIEW,
    allowedRoles: [Role.REVIEWER],
  },
  REQUEST_INFO: {
    from: ApplicationStatus.UNDER_REVIEW,
    to: ApplicationStatus.PENDING_INFO,
    allowedRoles: [Role.REVIEWER],
  },
  COMPLETE_REVIEW: {
    from: ApplicationStatus.UNDER_REVIEW,
    to: ApplicationStatus.REVIEWED,
    allowedRoles: [Role.REVIEWER],
  },
  RESUBMIT: {
    from: ApplicationStatus.PENDING_INFO,
    to: ApplicationStatus.UNDER_REVIEW,
    allowedRoles: [Role.APPLICANT],
  },
  APPROVE: {
    from: ApplicationStatus.REVIEWED,
    to: ApplicationStatus.APPROVED,
    allowedRoles: [Role.APPROVER],
  },
  REJECT: {
    from: ApplicationStatus.REVIEWED,
    to: ApplicationStatus.REJECTED,
    allowedRoles: [Role.APPROVER],
  },
};

export const TERMINAL_STATES: ApplicationStatus[] = [
  ApplicationStatus.APPROVED,
  ApplicationStatus.REJECTED,
];

export function assertValidTransition(
  transition: Transition,
  currentStatus: ApplicationStatus,
  actorRole: Role,
): void {
  const rule = TRANSITION_MAP[transition];

  if (TERMINAL_STATES.includes(currentStatus)) {
    throw new UnprocessableEntityException(
      `Application is in a terminal state (${currentStatus}) and cannot be modified`,
    );
  }

  if (currentStatus !== rule.from) {
    throw new UnprocessableEntityException(
      `Transition ${transition} requires status ${rule.from}, current status is ${currentStatus}`,
    );
  }

  if (!rule.allowedRoles.includes(actorRole)) {
    throw new ForbiddenException(
      `Role ${actorRole} cannot perform transition ${transition}`,
    );
  }
}
