import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryApplicationsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  searchQuery?: string;

  @ApiProperty({ required: false, description: 'Comma separated fields' })
  @IsOptional()
  searchFields?: string;

  @ApiProperty({ required: false, enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  institutionType?: string;
}
