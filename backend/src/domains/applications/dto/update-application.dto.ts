import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

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
    description: 'Registration number',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

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
