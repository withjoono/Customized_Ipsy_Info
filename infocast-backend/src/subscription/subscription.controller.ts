import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { SubscriptionService } from './subscription.service';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get('me')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.service.getMine(user.sub);
  }

  @Put('me')
  upsertMine(@CurrentUser() user: JwtPayload, @Body() dto: UpsertSubscriptionDto) {
    return this.service.upsertMine(user.sub, dto);
  }
}
