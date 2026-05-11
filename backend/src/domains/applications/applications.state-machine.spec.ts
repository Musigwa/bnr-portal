import { ApplicationStatus, Role } from '@prisma/client';
import {
  assertValidTransition,
  TERMINAL_STATES,
  TRANSITION_MAP,
  Transition,
} from './applications.state-machine';
import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('State Machine', () => {
  describe('Valid transitions', () => {
    it('APPLICANT can submit a DRAFT application', () => {
      expect(() =>
        assertValidTransition(
          'SUBMIT',
          ApplicationStatus.DRAFT,
          Role.APPLICANT,
        ),
      ).not.toThrow();
    });

    it('REVIEWER can assign themselves to a SUBMITTED application', () => {
      expect(() =>
        assertValidTransition(
          'ASSIGN_REVIEWER',
          ApplicationStatus.SUBMITTED,
          Role.REVIEWER,
        ),
      ).not.toThrow();
    });

    it('REVIEWER can request info on UNDER_REVIEW application', () => {
      expect(() =>
        assertValidTransition(
          'REQUEST_INFO',
          ApplicationStatus.UNDER_REVIEW,
          Role.REVIEWER,
        ),
      ).not.toThrow();
    });

    it('REVIEWER can complete review on UNDER_REVIEW application', () => {
      expect(() =>
        assertValidTransition(
          'COMPLETE_REVIEW',
          ApplicationStatus.UNDER_REVIEW,
          Role.REVIEWER,
        ),
      ).not.toThrow();
    });

    it('APPLICANT can resubmit a PENDING_INFO application', () => {
      expect(() =>
        assertValidTransition(
          'RESUBMIT',
          ApplicationStatus.PENDING_INFO,
          Role.APPLICANT,
        ),
      ).not.toThrow();
    });

    it('APPROVER can approve a REVIEWED application', () => {
      expect(() =>
        assertValidTransition(
          'APPROVE',
          ApplicationStatus.REVIEWED,
          Role.APPROVER,
        ),
      ).not.toThrow();
    });

    it('APPROVER can reject a REVIEWED application', () => {
      expect(() =>
        assertValidTransition(
          'REJECT',
          ApplicationStatus.REVIEWED,
          Role.APPROVER,
        ),
      ).not.toThrow();
    });
  });

  describe('Invalid transitions — wrong status', () => {
    it('cannot submit an already SUBMITTED application', () => {
      expect(() =>
        assertValidTransition(
          'SUBMIT',
          ApplicationStatus.SUBMITTED,
          Role.APPLICANT,
        ),
      ).toThrow(UnprocessableEntityException);
    });

    it('cannot approve an UNDER_REVIEW application', () => {
      expect(() =>
        assertValidTransition(
          'APPROVE',
          ApplicationStatus.UNDER_REVIEW,
          Role.APPROVER,
        ),
      ).toThrow(UnprocessableEntityException);
    });

    it('cannot request info on a DRAFT application', () => {
      expect(() =>
        assertValidTransition(
          'REQUEST_INFO',
          ApplicationStatus.DRAFT,
          Role.REVIEWER,
        ),
      ).toThrow(UnprocessableEntityException);
    });

    it('cannot resubmit a SUBMITTED application', () => {
      expect(() =>
        assertValidTransition(
          'RESUBMIT',
          ApplicationStatus.SUBMITTED,
          Role.APPLICANT,
        ),
      ).toThrow(UnprocessableEntityException);
    });
  });

  describe('Invalid transitions — wrong role', () => {
    it('REVIEWER cannot submit an application', () => {
      expect(() =>
        assertValidTransition('SUBMIT', ApplicationStatus.DRAFT, Role.REVIEWER),
      ).toThrow(ForbiddenException);
    });

    it('APPLICANT cannot assign reviewer', () => {
      expect(() =>
        assertValidTransition(
          'ASSIGN_REVIEWER',
          ApplicationStatus.SUBMITTED,
          Role.APPLICANT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('APPLICANT cannot approve', () => {
      expect(() =>
        assertValidTransition(
          'APPROVE',
          ApplicationStatus.REVIEWED,
          Role.APPLICANT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('REVIEWER cannot approve', () => {
      expect(() =>
        assertValidTransition(
          'APPROVE',
          ApplicationStatus.REVIEWED,
          Role.REVIEWER,
        ),
      ).toThrow(ForbiddenException);
    });

    it('ADMIN cannot perform any transition', () => {
      const transitions = Object.keys(TRANSITION_MAP) as Transition[];
      transitions.forEach((transition) => {
        const rule = TRANSITION_MAP[transition];
        expect(() =>
          assertValidTransition(transition, rule.from, Role.ADMIN),
        ).toThrow(ForbiddenException);
      });
    });
  });

  describe('Terminal states', () => {
    it('cannot transition out of APPROVED', () => {
      const transitions = Object.keys(TRANSITION_MAP) as Transition[];
      transitions.forEach((transition) => {
        expect(() =>
          assertValidTransition(
            transition,
            ApplicationStatus.APPROVED,
            Role.APPROVER,
          ),
        ).toThrow(UnprocessableEntityException);
      });
    });

    it('cannot transition out of REJECTED', () => {
      const transitions = Object.keys(TRANSITION_MAP) as Transition[];
      transitions.forEach((transition) => {
        expect(() =>
          assertValidTransition(
            transition,
            ApplicationStatus.REJECTED,
            Role.APPROVER,
          ),
        ).toThrow(UnprocessableEntityException);
      });
    });

    it('APPROVED and REJECTED are the only terminal states', () => {
      expect(TERMINAL_STATES).toHaveLength(2);
      expect(TERMINAL_STATES).toContain(ApplicationStatus.APPROVED);
      expect(TERMINAL_STATES).toContain(ApplicationStatus.REJECTED);
    });
  });
});
