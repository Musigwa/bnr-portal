import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'User password',
    example: 'securepassword123',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
