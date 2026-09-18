import { Controller, Get, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { QueryPublicCalendarDto } from './dto/query-public-calendar.dto';

/**
 * 인증이 필요 없는 공개 엔드포인트.
 * 주의: 이 컨트롤러에는 JwtAuthGuard 를 붙이지 않는다(공개용). 개인정보는 절대 노출하지 말 것.
 */
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  /** 공개 입시 캘린더 — 승인된 일정 전체(날짜 오름차순). */
  @Get('calendar')
  calendar(@Query() query: QueryPublicCalendarDto) {
    return this.service.calendar(query);
  }
}
