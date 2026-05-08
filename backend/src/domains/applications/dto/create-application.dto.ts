import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'Institution name',
    example: 'Bank of Example',
  })
  @IsString()
  @MinLength(2)
  institutionName: string;

  @ApiProperty({
    description: 'Institution type',
    example: 'Bank',
  })
  @IsString()
  institutionType: string;

  @ApiProperty({
    description: 'Registration number',
    example: '123456',
  })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

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
