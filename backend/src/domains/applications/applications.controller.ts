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

import { ApplicationStatus, Role } from '@prisma/client';
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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

@ApiTags('applications')
@ApiBearerAuth('access-token')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @ApiOperation({ summary: 'Create a new DRAFT application' })
  @ApiCreatedResponse({ description: 'Application created' })
  @Post()
  @Roles(Role.APPLICANT)
  create(@CurrentUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.service.create(user, dto);
  }

  @ApiOperation({ summary: 'List applications — filtered by role' })
  @ApiQuery({ name: 'status', enum: ApplicationStatus, required: false })
  @ApiOkResponse({ description: 'List of applications' })
  @Get()
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findAll(@CurrentUser() user: User, @Query() query: QueryApplicationsDto) {
    return this.service.findAll(user, query);
  }

  @ApiOperation({ summary: 'Get application by ID' })
  @ApiNotFoundResponse({ description: 'Application not found' })
  @Get(':id')
  @Roles(Role.APPLICANT, Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @ApiOperation({ summary: 'Update DRAFT application fields' })
  @Patch(':id')
  @Roles(Role.APPLICANT)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.service.update(id, user, dto);
  }

  @ApiOperation({ summary: 'Submit application for review' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid state transition' })
  @Post(':id/submit')
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.OK)
  submit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.submit(id, user);
  }

  @ApiOperation({ summary: 'Assign yourself as reviewer' })
  @Post(':id/assign-reviewer')
  @Roles(Role.REVIEWER)
  @HttpCode(HttpStatus.OK)
  assignReviewer(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.assignReviewer(id, user);
  }

  @ApiOperation({ summary: 'Request additional information from applicant' })
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

  @ApiOperation({ summary: 'Complete review — forward to approver' })
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

  @ApiOperation({ summary: 'Resubmit after additional info request' })
  @Post(':id/resubmit')
  @Roles(Role.APPLICANT)
  @HttpCode(HttpStatus.OK)
  resubmit(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.resubmit(id, user);
  }

  @ApiOperation({
    summary: 'Approve application — APPROVER cannot be the reviewer',
  })
  @ApiForbiddenResponse({
    description: 'Reviewer cannot approve their own reviewed application',
  })
  @Post(':id/approve')
  @Roles(Role.APPROVER)
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user);
  }

  @ApiOperation({ summary: 'Reject application with reason' })
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

  @ApiOperation({ summary: 'Get audit log for application' })
  @Get(':id/audit')
  @Roles(Role.REVIEWER, Role.APPROVER, Role.ADMIN)
  getAuditLog(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.getAuditLog(id, user);
  }
}
