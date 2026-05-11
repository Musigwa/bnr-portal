import { PrismaService } from '@/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Role, User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        passwordHash: false,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async update(
    id: string,
    data: { fullName?: string; password?: string },
  ): Promise<Omit<User, 'passwordHash'>> {
    await this.findById(id); // throws if not found

    const updateData: Prisma.UserUpdateInput = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.password)
      updateData.passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }
}
