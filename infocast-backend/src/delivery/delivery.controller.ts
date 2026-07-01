import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ServiceAuthGuard } from '../auth/service-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { DeliveryService } from './delivery.service';

/** 관리자 모니터링 / 수동 발송. */
@Controller('deliveries')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get()
  list(@Query('take') take?: string) {
    return this.service.listRecent(take ? Number(take) : undefined);
  }

  /** 내 계정으로 즉시 발송 테스트(방해금지 무시). */
  @Post('test')
  test(@CurrentUser() user: JwtPayload) {
    return this.service.runForMember(user.sub, { ignoreQuiet: true });
  }
}

/**
 * 스케줄러 진입점. Cloud Scheduler 가 호출.
 * 헤더: Authorization: Bearer <AUTH_SERVICE_SECRET>, X-Service-Id: infocast-cron.
 */
@Controller('internal/delivery')
@UseGuards(ServiceAuthGuard)
export class InternalDeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Post('run')
  run() {
    return this.service.runDue();
  }
}
