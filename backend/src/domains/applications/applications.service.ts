import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  ApplicationStatus,
  Role,
  User,
  Application,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { refNumberExtension } from '../../database/extensions/ref-number.extension';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import {
  RequestInfoDto,
  CompleteReviewDto,
  RejectDto,
  ApproveDto,
} from './dto/transition.dto';
import {
  assertValidTransition,
  Transition,
} from './applications.state-machine';

@Injectable()
export class ApplicationsService {
  private extendedPrisma: unknown;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.extendedPrisma = this.prisma.$extends(refNumberExtension);
  }

  async create(user: User, dto: CreateApplicationDto) {
    return (this.extendedPrisma as PrismaClient).application.create({
      data: {
        ...dto,
        applicantId: user.id,
      } as unknown as Prisma.ApplicationCreateInput,
    }) as Promise<Application>;
  }

  async findAll(user: User, query: QueryApplicationsDto) {
    const where: Prisma.ApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (user.role === Role.APPLICANT) where.applicantId = user.id;

    return this.prisma.application.findMany({
      where,
      include: {
        applicant: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        approver: { select: { id: true, fullName: true, email: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveId(identifier: string): Promise<string> {
    if (identifier.length === 36 && identifier.split('-').length === 5) {
      return identifier; // It is likely a UUID
    }
    const app = await this.prisma.application.findUnique({
      where: { refNumber: identifier },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    return app.id;
  }

  async findOne(identifier: string, user: User) {
    const id = await this.resolveId(identifier);
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        approver: { select: { id: true, fullName: true, email: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (user.role === Role.APPLICANT && app.applicantId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return app;
  }

  async update(identifier: string, user: User, dto: UpdateApplicationDto) {
    const id = await this.resolveId(identifier);
    const app = await this.findOne(id, user);

    if (app.applicantId !== user.id)
      throw new ForbiddenException('Access denied');
    if (app.status !== ApplicationStatus.DRAFT) {
      throw new ForbiddenException('Only DRAFT applications can be edited');
    }

    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async submit(identifier: string, user: User) {
    const id = await this.resolveId(identifier);
    return this.transition(id, user, 'SUBMIT', async (tx, app) => {
      if (app.applicantId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      return tx.application.update({
        where: { id, version: app.version },
        data: {
          status: ApplicationStatus.SUBMITTED,
          version: { increment: 1 },
          submittedAt: new Date(),
        },
      });
    });
  }

  async assignReviewer(identifier: string, user: User) {
    const id = await this.resolveId(identifier);
    return this.transition(id, user, 'ASSIGN_REVIEWER', async (tx, app) => {
      return tx.application.update({
        where: { id, version: app.version },
        data: {
          status: ApplicationStatus.UNDER_REVIEW,
          reviewerId: user.id,
          version: { increment: 1 },
        },
      });
    });
  }

  async requestInfo(identifier: string, user: User, dto: RequestInfoDto) {
    const id = await this.resolveId(identifier);
    return this.transition(
      id,
      user,
      'REQUEST_INFO',
      async (tx, app) => {
        this.assertAssignedReviewer(app, user);
        return tx.application.update({
          where: { id, version: app.version },
          data: {
            status: ApplicationStatus.PENDING_INFO,
            reviewerNotes: dto.notes,
            version: { increment: 1 },
          },
        });
      },
      dto as unknown as Prisma.InputJsonValue,
    );
  }

  async completeReview(identifier: string, user: User, dto: CompleteReviewDto) {
    const id = await this.resolveId(identifier);
    return this.transition(
      id,
      user,
      'COMPLETE_REVIEW',
      async (tx, app) => {
        this.assertAssignedReviewer(app, user);
        return tx.application.update({
          where: { id, version: app.version },
          data: {
            status: ApplicationStatus.REVIEWED,
            reviewerNotes: dto.reviewerNotes,
            version: { increment: 1 },
          },
        });
      },
      dto as unknown as Prisma.InputJsonValue,
    );
  }

  async resubmit(identifier: string, user: User) {
    const id = await this.resolveId(identifier);
    return this.transition(id, user, 'RESUBMIT', async (tx, app) => {
      if (app.applicantId !== user.id)
        throw new ForbiddenException('Access denied');
      return tx.application.update({
        where: { id, version: app.version },
        data: {
          status: ApplicationStatus.UNDER_REVIEW,
          version: { increment: 1 },
        },
      });
    });
  }

  async approve(identifier: string, user: User, dto?: ApproveDto) {
    const id = await this.resolveId(identifier);
    return this.transition(
      id,
      user,
      'APPROVE',
      async (tx, app) => {
        this.assertNotReviewer(app, user);
        return tx.application.update({
          where: { id, version: app.version },
          data: {
            status: ApplicationStatus.APPROVED,
            version: { increment: 1 },
            decidedAt: new Date(),
            approverId: user.id,
          },
        });
      },
      dto as unknown as Prisma.InputJsonValue,
    );
  }

  async reject(identifier: string, user: User, dto: RejectDto) {
    const id = await this.resolveId(identifier);
    return this.transition(
      id,
      user,
      'REJECT',
      async (tx, app) => {
        this.assertNotReviewer(app, user);
        return tx.application.update({
          where: { id, version: app.version },
          data: {
            status: ApplicationStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
            version: { increment: 1 },
            decidedAt: new Date(),
            approverId: user.id,
          },
        });
      },
      dto as unknown as Prisma.InputJsonValue,
    );
  }

  async getAuditLog(identifier: string, user: User) {
    const id = await this.resolveId(identifier);
    // Essential for ownership check
    await this.findOne(id, user);
    const logs = await this.audit.getByApplication(id);

    // If applicant, mask actor details for privacy/security
    if (user.role === Role.APPLICANT) {
      return logs.map((log) => ({
        ...log,
        actor: {
          ...log.actor,
          fullName: 'BNR Official',
          email: 'hidden',
        },
      }));
    }

    return logs;
  }

  // Private helpers

  private async transition(
    id: string,
    user: User,
    transitionName: Transition,
    perform: (
      tx: Prisma.TransactionClient,
      app: Application,
    ) => Promise<Application>,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Lock the row
      const [app] = await tx.$queryRaw<Application[]>`
        SELECT * FROM "Application" WHERE id = ${id} FOR UPDATE
      `;

      if (!app) throw new NotFoundException('Application not found');

      assertValidTransition(transitionName, app.status, user.role);

      const updated = await perform(tx, app);

      if (!updated) {
        throw new ConflictException('Application was modified concurrently');
      }

      await this.audit.log(tx, {
        applicationId: id,
        actorId: user.id,
        action: transitionName,
        statusBefore: app.status,
        statusAfter: updated.status,
        metadata,
      });

      return updated;
    });
  }

  private assertAssignedReviewer(app: Application, user: User) {
    if (app.reviewerId !== user.id) {
      throw new ForbiddenException(
        'Only the assigned reviewer can perform this action',
      );
    }
  }

  private assertNotReviewer(app: Application, user: User) {
    if (app.reviewerId === user.id) {
      throw new ForbiddenException(
        'The reviewer cannot make the final approval decision',
      );
    }
  }
}
