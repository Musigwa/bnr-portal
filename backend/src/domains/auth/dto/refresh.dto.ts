import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'some-jwt-refresh-token',
  })
  @IsString()
  refreshToken: string;
}
