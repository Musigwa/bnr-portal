import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@/config/config.service';

import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UsersService } from '@/domains/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const areCredentialsValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!areCredentialsValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessMin = this.config.get<number>(
      'security.jwtAccessExpirationMin',
    );
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: `${accessMin}m`,
    });

    const rawRefreshToken = randomUUID();
    const lookupKey = rawRefreshToken.substring(0, 8);
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        lookupKey,
        expiresAt: new Date(
          Date.now() +
            this.config.get<number>('security.jwtRefreshExpirationDays'),
        ),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async refresh(rawRefreshToken: string) {
    const lookupKey = rawRefreshToken.substring(0, 8);

    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        lookupKey,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(
      rawRefreshToken,
      stored.tokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
  }

  async logout(rawRefreshToken: string) {
    const lookupKey = rawRefreshToken.substring(0, 8);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { lookupKey, revokedAt: null },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(
      rawRefreshToken,
      stored.tokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out' };
  }
}
