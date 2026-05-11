import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class QueryApplicationsDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
