import { IsOptional, Min, Max } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApiEnumProperty } from '@/common/decorators/api-enum-property.decorator';

export class QueryApplicationsDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  searchQuery?: string;

  @ApiProperty({ required: false, description: 'Comma separated fields' })
  @IsOptional()
  searchFields?: string;

  @ApiEnumProperty({ enum: ApplicationStatus })
  status?: ApplicationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  institutionType?: string;
}
