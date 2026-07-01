import { Module } from '@nestjs/common';
import { HubModule } from '../hub/hub.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  imports: [HubModule, SubscriptionModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
