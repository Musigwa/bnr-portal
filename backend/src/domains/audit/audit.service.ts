import { PrismaService } from '../../database/prisma.service';
import { Injectable } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';

export interface AuditLogEntry {
  applicationId: string;
  actorId: string;
  action: string;
  statusBefore?: ApplicationStatus | null;
  statusAfter?: ApplicationStatus | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // Called inside a transaction — accepts tx client
  async log(
    tx: Omit<
      PrismaService,
      | '$connect'
      | '$disconnect'
      | '$on'
      | '$transaction'
      | '$use'
      | '$extends'
      | 'pool'
      | 'onModuleInit'
      | 'onModuleDestroy'
    >,
    entry: AuditLogEntry,
  ): Promise<void> {
    await tx.auditLog.create({ data: entry });
  }

  // Called outside transaction for simple reads
  async getByApplication(applicationId: string) {
    return this.prisma.auditLog.findMany({
      where: { applicationId },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
