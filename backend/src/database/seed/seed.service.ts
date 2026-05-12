import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ApplicationStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { SEED_APPLICATIONS, SEED_USERS } from './seed.data';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'development') {
      await this.seed();
    }
  }

  async seed(): Promise<{ message: string; seeded: boolean }> {
    const adminExists = await this.prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminExists > 0) {
      this.logger.log('Database already has an admin — skipping seed');
      return { message: 'Already seeded', seeded: false };
    }

    this.logger.log('Seeding database...');

    // Create users
    const createdUsers = await Promise.all(
      SEED_USERS.map((u) =>
        this.prisma.user.create({
          data: {
            email: u.email,
            passwordHash: bcrypt.hashSync(u.password, 12),
            fullName: u.fullName,
            role: u.role,
          },
        }),
      ),
    );

    const userMap = Object.fromEntries(createdUsers.map((u) => [u.email, u]));

    // Create applications + audit logs in transactions
    for (const appData of SEED_APPLICATIONS) {
      const applicant = userMap[appData.applicantEmail];
      const reviewer = userMap[appData.reviewerEmail];

      await this.prisma.$transaction(async (tx) => {
        const app = await tx.application.create({
          data: {
            refNumber: appData.refNumber,
            status: appData.status,
            version: 1,
            applicantId: applicant.id,
            reviewerId: reviewer.id,
            institutionName: appData.institutionName,
            institutionType: appData.institutionType,
            registrationNumber: appData.registrationNumber,
            proposedCapital: appData.proposedCapital,
            applicantNotes: appData.applicantNotes,
            reviewerNotes: appData.reviewerNotes ?? null,
            submittedAt: new Date(),
          },
        });

        const auditEntries = this.buildAuditEntries(
          app.id,
          applicant.id,
          reviewer.id,
          appData.status,
          appData.reviewerNotes,
        );

        await tx.auditLog.createMany({ data: auditEntries });
      });
    }

    this.logger.log('✅ Seed complete');
    return { message: 'Seed complete', seeded: true };
  }

  async reset(): Promise<{ message: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }

    this.logger.warn('Resetting database...');

    // Delete in dependency order
    await this.prisma.auditLog.deleteMany();
    await this.prisma.document.deleteMany();
    await this.prisma.application.deleteMany();
    await this.prisma.refreshToken.deleteMany();
    await this.prisma.user.deleteMany();

    this.logger.warn('Database reset complete');
    return { message: 'Database reset complete' };
  }

  private buildAuditEntries(
    applicationId: string,
    applicantId: string,
    reviewerId: string,
    finalStatus: ApplicationStatus,
    reviewerNotes?: string | null,
  ) {
    const entries: Prisma.AuditLogCreateManyInput[] = [
      {
        applicationId,
        actorId: applicantId,
        action: 'SUBMIT',
        statusBefore: ApplicationStatus.DRAFT,
        statusAfter: ApplicationStatus.SUBMITTED,
      },
      {
        applicationId,
        actorId: reviewerId,
        action: 'ASSIGN_REVIEWER',
        statusBefore: ApplicationStatus.SUBMITTED,
        statusAfter: ApplicationStatus.UNDER_REVIEW,
      },
    ];

    if (finalStatus === ApplicationStatus.REVIEWED) {
      entries.push({
        applicationId,
        actorId: reviewerId,
        action: 'COMPLETE_REVIEW',
        statusBefore: ApplicationStatus.UNDER_REVIEW,
        statusAfter: ApplicationStatus.REVIEWED,
        metadata: reviewerNotes ? { reviewerNotes } : undefined,
      });
    }

    return entries;
  }
}
