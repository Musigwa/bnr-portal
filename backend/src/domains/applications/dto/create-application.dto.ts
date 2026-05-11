import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'Institution name',
    example: 'Bank of Example',
  })
  @IsString()
  @MinLength(2)
  institutionName!: string;

  @ApiProperty({
    description: 'Institution type',
    example: 'Bank',
  })
  @IsString()
  institutionType!: string;

  @ApiProperty({
    description: '9-digit TIN Number (Rwanda)',
    example: '123456789',
  })
  @IsString()
  @Matches(/^\d{9}$/, {
    message: 'TIN Number must be exactly 9 numeric digits',
  })
  tinNumber!: string;

  @ApiProperty({
    description: 'Proposed capital',
    example: 1000000,
  })
  @IsNumber()
  @IsOptional()
  proposedCapital?: number;

  @ApiProperty({
    description: 'Applicant notes',
    example: 'Some notes',
  })
  @IsString()
  @IsOptional()
  applicantNotes?: string;
}
