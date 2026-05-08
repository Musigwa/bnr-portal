import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestInfoDto {
  @ApiProperty({
    description: 'Notes',
    example: 'Please provide additional information',
  })
  @IsString()
  @MinLength(10)
  notes: string;
}

export class CompleteReviewDto {
  @ApiProperty({
    description: 'Reviewer notes',
    example: 'The application is complete',
  })
  @IsString()
  @MinLength(10)
  reviewerNotes: string;
}

export class RejectDto {
  @ApiProperty({
    description: 'Rejection reason',
    example: 'The application is incomplete',
  })
  @IsString()
  @MinLength(10)
  rejectionReason: string;
}
