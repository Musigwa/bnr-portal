import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MinLength(2)
  institutionName: string;

  @IsString()
  institutionType: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsNumber()
  @IsOptional()
  proposedCapital?: number;

  @IsString()
  @IsOptional()
  applicantNotes?: string;
}
