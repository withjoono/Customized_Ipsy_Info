import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HubModule } from './hub/hub.module';
import { InfoItemModule } from './info-item/info-item.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { MatchModule } from './match/match.module';
import { DeliveryModule } from './delivery/delivery.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HubModule,
    InfoItemModule,
    SubscriptionModule,
    MatchModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
