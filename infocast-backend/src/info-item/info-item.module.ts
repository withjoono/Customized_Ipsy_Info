import { Module } from '@nestjs/common';
import { InfoItemController } from './info-item.controller';
import { InfoItemService } from './info-item.service';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  controllers: [InfoItemController],
  providers: [InfoItemService, AdminGuard],
  exports: [InfoItemService],
})
export class InfoItemModule {}
