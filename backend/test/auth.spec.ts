import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

const mockUser = (role: Role) => ({ id: 'user-id', role });

const mockContext = (role: Role, requiredRoles: Role[]): ExecutionContext => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: mockUser(role) }),
    }),
    _reflector: reflector,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = mockContext(Role.APPLICANT, []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows APPLICANT to access APPLICANT-only route', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.APPLICANT]);
    const ctx = mockContext(Role.APPLICANT, [Role.APPLICANT]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies APPLICANT access to REVIEWER-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.REVIEWER]);
    const ctx = mockContext(Role.APPLICANT, [Role.REVIEWER]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies REVIEWER access to APPROVER-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.APPROVER]);
    const ctx = mockContext(Role.REVIEWER, [Role.APPROVER]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies APPLICANT access to ADMIN-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = mockContext(Role.APPLICANT, [Role.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows ADMIN access to ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = mockContext(Role.ADMIN, [Role.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has one of multiple allowed roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.REVIEWER, Role.APPROVER, Role.ADMIN]);
    const ctx = mockContext(Role.REVIEWER, [
      Role.REVIEWER,
      Role.APPROVER,
      Role.ADMIN,
    ]);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
