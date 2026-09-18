import { Module } from '@nestjs/common';
import { HubModule } from '../hub/hub.module';
import { SchoolCalendarController } from './school-calendar.controller';
import { SchoolCalendarService } from './school-calendar.service';

@Module({
  imports: [HubModule],
  controllers: [SchoolCalendarController],
  providers: [SchoolCalendarService],
})
export class SchoolModule {}
