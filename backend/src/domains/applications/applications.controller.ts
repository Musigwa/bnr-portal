import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';

import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import {
  RequestInfoDto,
  CompleteReviewDto,
  RejectDto,
} from './dto/transition.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('applications')
export class ApplicationsController {
  constructor(private service: ApplicationsService) {}

  @Post()
  @Roles(Role.APPLICANT)
  create(@CurrentUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findAll(@CurrentUser() user: User, @Query() query: QueryApplicationsDto) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.APPLICANT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.service.update(id, user, dto);
  }

  @Post(':id/submit')
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.submit(id, user);
  }

  @Post(':id/assign-reviewer')
  @Roles(Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  assignReviewer(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.assignReviewer(id, user);
  }

  @Post(':id/request-info')
  @Roles(Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  requestInfo(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RequestInfoDto,
  ) {
    return this.service.requestInfo(id, user, dto);
  }

  @Post(':id/complete-review')
  @Roles(Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  completeReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CompleteReviewDto,
  ) {
    return this.service.completeReview(id, user, dto);
  }

  @Post(':id/resubmit')
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.OK)
  resubmit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.resubmit(id, user);
  }

  @Post(':id/approve')
  @Roles(Role.APPROVER)
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user);
  }

  @Post(':id/reject')
  @Roles(Role.APPROVER)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RejectDto,
  ) {
    return this.service.reject(id, user, dto);
  }

  @Get(':id/audit')
  @Roles(Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  getAuditLog(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.getAuditLog(id, user);
  }
}
