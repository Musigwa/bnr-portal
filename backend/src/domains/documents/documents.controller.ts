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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';

@Controller('applications/:applicationId/documents')
export class DocumentsController {
  constructor(private service: DocumentsService) {}

  @Post()
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = path.join(process.cwd(), 'uploads');
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}-${file.originalname}`);
        },
      }),
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

  @Get()
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findAll(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(applicationId, user);
  }

  @Get(':documentId/download')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  async download(
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const doc = await this.service.download(applicationId, documentId, user);
    res.download(doc.storagePath, doc.fileName);
  }
}
