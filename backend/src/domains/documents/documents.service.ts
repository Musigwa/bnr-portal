import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationStatus, Role, User, Document } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async upload(applicationId: string, user: User, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > MAX_FILE_SIZE) {
      if (file.path) fs.unlinkSync(file.path);
      throw new BadRequestException('File exceeds maximum size of 5MB');
    }

    const app = await this.prisma.application.findFirst({
      where: {
        OR: [{ id: applicationId }, { refNumber: applicationId }],
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    if (user.role === Role.APPLICANT && app.applicantId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const allowedStatuses: ApplicationStatus[] = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.PENDING_INFO,
    ];
    if (!allowedStatuses.includes(app.status)) {
      throw new ForbiddenException(
        'Documents can only be uploaded on DRAFT or PENDING_INFO applications',
      );
    }

    // Get next version number for this filename
    const existing = await this.prisma.document.findFirst({
      where: {
        applicationId: app.id,
        fileName: file.originalname,
        isSuperseded: false,
      },
      orderBy: { version: 'desc' },
    });

    // Supersede previous version if exists
    if (existing) {
      await this.prisma.document.update({
        where: { id: existing.id },
        data: { isSuperseded: true },
      });
    }

    const nextVersion = existing ? existing.version + 1 : 1;

    const document = await this.prisma.document.create({
      data: {
        applicationId: app.id,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: file.path,
        uploadedById: user.id,
        version: nextVersion,
        isSuperseded: false,
      },
    });

    return document;
  }

  async findAll(applicationId: string, user: User) {
    const app = await this.prisma.application.findFirst({
      where: {
        OR: [{ id: applicationId }, { refNumber: applicationId }],
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    if (user.role === Role.APPLICANT && app.applicantId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const documents = await this.prisma.document.findMany({
      where: { applicationId: app.id },
      orderBy: [{ fileName: 'asc' }, { version: 'desc' }],
    });

    // Group by filename: current + history
    const grouped = documents.reduce<
      Record<string, { current: Document | null; history: Document[] }>
    >((acc, doc) => {
      if (!acc[doc.fileName])
        acc[doc.fileName] = { current: null, history: [] };
      if (!doc.isSuperseded) acc[doc.fileName].current = doc;
      else acc[doc.fileName].history.push(doc);
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async download(applicationId: string, documentId: string, user: User) {
    const app = await this.prisma.application.findFirst({
      where: {
        OR: [{ id: applicationId }, { refNumber: applicationId }],
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    if (user.role === Role.APPLICANT && app.applicantId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, applicationId: app.id },
    });

    if (!doc) throw new NotFoundException('Document not found');
    if (!fs.existsSync(doc.storagePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return doc;
  }

  async delete(applicationId: string, documentId: string, user: User) {
    const app = await this.prisma.application.findFirst({
      where: {
        OR: [{ id: applicationId }, { refNumber: applicationId }],
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    if (user.role === Role.APPLICANT && app.applicantId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const allowedStatuses: ApplicationStatus[] = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.PENDING_INFO,
    ];
    if (!allowedStatuses.includes(app.status)) {
      throw new ForbiddenException(
        'Documents can only be deleted on DRAFT or PENDING_INFO applications',
      );
    }

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, applicationId: app.id },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // 1. Delete from database
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    // 2. Delete from physical storage
    if (fs.existsSync(doc.storagePath)) {
      try {
        fs.unlinkSync(doc.storagePath);
      } catch (err) {
        // Log error but don't fail if file is already gone
        console.error(`Failed to delete file at ${doc.storagePath}:`, err);
      }
    }

    return { success: true };
  }

  ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    return UPLOAD_DIR;
  }
}
