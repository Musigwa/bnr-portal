import { IsString, MinLength } from 'class-validator';

export class RequestInfoDto {
  @IsString()
  @MinLength(10)
  notes: string;
}

export class CompleteReviewDto {
  @IsString()
  @MinLength(10)
  reviewerNotes: string;
}

export class RejectDto {
  @IsString()
  @MinLength(10)
  rejectionReason: string;
}
