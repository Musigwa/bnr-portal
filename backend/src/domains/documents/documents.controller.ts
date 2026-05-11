import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('applications/:applicationId/documents')
export class DocumentsController {
  constructor(
    private service: DocumentsService,
    private storage: StorageService,
  ) {}

  @ApiOperation({ summary: 'Upload document — max 5MB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post()
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(applicationId, user, file);
  }

  @ApiOperation({
    summary: 'List documents grouped by filename with version history',
  })
  @Get()
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findAll(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(applicationId, user);
  }

  @ApiOperation({ summary: 'Download all documents as a ZIP archive' })
  @Get('download-all')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  async downloadAll(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const { app, documents } = await this.service.getDocumentsForArchive(
      applicationId,
      user,
    );

    // dynamic import to bypass jest ESM choke
    const { ZipArchive } = await import('archiver');

    const archive = new ZipArchive({
      zlib: { level: 9 }, // Maximum compression
    });

    archive.on('error', (err) => {
      throw err;
    });

    const zipFilename = `Application-${app.refNumber}-Documents.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${zipFilename}"`,
    );

    archive.pipe(res);

    // Fetch all readable streams from S3 concurrently
    const storageKeys = documents.map((doc) => doc.storagePath);
    const streams = await this.storage.getFileStreams(storageKeys);

    // Append each stream to the ZIP archive
    for (const doc of documents) {
      const match = streams.find((s) => s.key === doc.storagePath);
      if (match) {
        archive.append(match.stream, { name: doc.fileName });
      }
    }

    await archive.finalize();
  }

  @ApiOperation({ summary: 'Download document by ID' })
  @Get(':documentId/download')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  async download(
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const doc = await this.service.download(applicationId, documentId, user);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.fileName}"`,
    );

    // Stream directly from S3 to the client
    const stream = await this.storage.getFileStream(doc.storagePath);
    stream.pipe(res);
  }

  @ApiOperation({ summary: 'Delete document' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.APPLICANT)
  @Delete(':documentId')
  remove(
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.delete(applicationId, documentId, user);
  }
}
