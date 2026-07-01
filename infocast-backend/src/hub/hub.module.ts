import { Module } from '@nestjs/common';
import { HubService } from './hub.service';

@Module({
  providers: [HubService],
  exports: [HubService],
})
export class HubModule {}
