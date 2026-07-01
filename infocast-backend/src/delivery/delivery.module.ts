import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MatchModule } from '../match/match.module';
import { AdminGuard } from '../auth/admin.guard';
import { DeliveryController, InternalDeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { ChannelRegistry } from './channels/channel-registry';
import { KakaoAdapter } from './channels/kakao.adapter';
import { SmsAdapter } from './channels/sms.adapter';
import { PushAdapter } from './channels/push.adapter';
import { EmailAdapter } from './channels/email.adapter';

@Module({
  imports: [AuthModule, SubscriptionModule, MatchModule],
  controllers: [DeliveryController, InternalDeliveryController],
  providers: [
    DeliveryService,
    ChannelRegistry,
    KakaoAdapter,
    SmsAdapter,
    PushAdapter,
    EmailAdapter,
    AdminGuard,
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
