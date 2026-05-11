import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Institution name',
    example: 'Bank of Example',
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  institutionName?: string;

  @ApiPropertyOptional({
    description: 'Institution type',
    example: 'Bank',
  })
  @IsString()
  @IsOptional()
  institutionType?: string;

  @ApiPropertyOptional({
    description: '9-digit TIN Number (Rwanda)',
    example: '123456789',
  })
  @IsString()
  @Matches(/^\d{9}$/, {
    message: 'TIN Number must be exactly 9 numeric digits',
  })
  @IsOptional()
  tinNumber?: string;

  @ApiPropertyOptional({
    description: 'Proposed capital',
    example: 1000000,
  })
  @IsNumber()
  @IsOptional()
  proposedCapital?: number;

  @ApiPropertyOptional({
    description: 'Applicant notes',
    example: 'Some notes',
  })
  @IsString()
  @IsOptional()
  applicantNotes?: string;
}
