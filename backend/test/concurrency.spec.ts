import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from '../src/domains/applications/applications.service';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/domains/audit/audit.service';
import { Application, ApplicationStatus, Role, User } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

const mockApprover = (id: string) => ({
  id,
  role: Role.APPROVER,
  email: `approver${id}@bnr.rw`,
  fullName: 'Approver',
  passwordHash: '',
  createdAt: new Date(),
});

describe('Concurrency — simultaneous approval', () => {
  let service: ApplicationsService;
  let _prisma: PrismaService;

  const applicationId = 'test-app-id';
  const reviewerId = 'reviewer-id';

  // Track how many times the transaction was called
  let transactionCallCount = 0;
  let successCount = 0;
  let conflictCount = 0;

  beforeEach(async () => {
    transactionCallCount = 0;
    successCount = 0;
    conflictCount = 0;

    // Simulate optimistic locking:
    // First transaction succeeds, second sees version mismatch → update returns null
    let approved = false;

    const mockPrisma = {
      $transaction: jest.fn(async (fn: (tx: any) => Promise<Application>) => {
        transactionCallCount++;
        const currentVersion = approved ? 2 : 1;

        const mockTx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: applicationId,
              status: ApplicationStatus.REVIEWED,
              reviewerId,
              version: currentVersion,
            },
          ]),
          application: {
            update: jest.fn(({ where: _where }: any) => {
              // Simulate version check — if already approved, version won't match
              if (approved) return Promise.resolve(null);
              approved = true;
              return Promise.resolve({
                id: applicationId,
                status: ApplicationStatus.APPROVED,
                version: 2,
              });
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };

        return fn(mockTx);
      }),
    };

    const mockAudit = {
      log: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ApplicationsService);
    _prisma = module.get(PrismaService);
  });

  it('exactly one approval succeeds and one fails with ConflictException', async () => {
    const approver1 = mockApprover('approver-1') as unknown as User;
    const approver2 = mockApprover('approver-2') as unknown as User;

    const results = await Promise.allSettled([
      service.approve(applicationId, approver1),
      service.approve(applicationId, approver2),
    ]);

    successCount = results.filter((r) => r.status === 'fulfilled').length;
    conflictCount = results.filter(
      (r) => r.status === 'rejected' && r.reason instanceof ConflictException,
    ).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });

  it('transaction was called exactly twice', async () => {
    const approver1 = mockApprover('approver-1') as unknown as User;
    const approver2 = mockApprover('approver-2') as unknown as User;

    await Promise.allSettled([
      service.approve(applicationId, approver1),
      service.approve(applicationId, approver2),
    ]);

    expect(transactionCallCount).toBe(2);
  });

  it('audit log is written exactly once', async () => {
    const approver1 = mockApprover('approver-1') as unknown as User;
    const approver2 = mockApprover('approver-2') as unknown as User;
    const auditService = service['audit'];
    const logSpy = jest.spyOn(auditService, 'log');

    await Promise.allSettled([
      service.approve(applicationId, approver1),
      service.approve(applicationId, approver2),
    ]);

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
