import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Document description',
    example: 'Supporting document',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
