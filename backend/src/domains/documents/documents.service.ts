import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { ApplicationStatus, Role, User, Document } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(applicationId: string, user: User, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
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
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Structured MinIO Object Key: [applicationId]/[uniqueId]-[originalname]
    const objectKey = `${app.id}/${uniqueId}-${file.originalname}`;

    // Upload buffer to S3
    await this.storage.uploadFile(objectKey, file.buffer, file.mimetype);

    const document = await this.prisma.document.create({
      data: {
        applicationId: app.id,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: objectKey, // Storing the S3 Object Key
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

    return doc;
  }

  async getDocumentsForArchive(applicationId: string, user: User) {
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
      where: {
        applicationId: app.id,
        isSuperseded: false,
      },
      orderBy: { fileName: 'asc' },
    });

    if (documents.length === 0) {
      throw new NotFoundException('No documents found for this application');
    }

    return { app, documents };
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

    // 2. Delete from object storage
    try {
      await this.storage.deleteFile(doc.storagePath);
    } catch (err) {
      Logger.error(
        `Failed to delete S3 object at ${doc.storagePath}:`,
        err instanceof Error ? err.stack : String(err),
        'DocumentsService',
      );
    }

    return { success: true };
  }
}
