import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class AppController {
  @ApiOperation({ summary: 'Liveness check' })
  @Public()
  @Get('liveness')
  getLiveness() {
    return { status: 'OK' };
  }
}
