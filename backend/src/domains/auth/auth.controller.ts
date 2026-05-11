import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { StrictThrottle } from 'src/common/decorators/strict-throttle.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @StrictThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Returns new access token' })
  @Public()
  @StrictThrottle()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
