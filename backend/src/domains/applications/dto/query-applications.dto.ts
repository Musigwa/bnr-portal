import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class QueryApplicationsDto {
  @ApiProperty({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.PENDING_INFO,
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
