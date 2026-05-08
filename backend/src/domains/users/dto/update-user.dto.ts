import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
