import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { service: 'infocast-backend', status: 'ok', ts: new Date().toISOString() };
  }
}
