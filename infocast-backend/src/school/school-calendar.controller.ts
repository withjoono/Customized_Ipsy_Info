import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchoolCalendarService } from './school-calendar.service';

/**
 * 내 학교 학사일정 — Hub 의 NEIS 모듈을 프록시한다.
 * Hub 의 해당 엔드포인트가 **사용자 JWT** 를 요구하므로 호출자의 Bearer 토큰을 그대로 넘긴다.
 */
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class SchoolCalendarController {
  constructor(private readonly service: SchoolCalendarService) {}

  /** GET /api/calendar/school?year=2026&month=9 */
  @Get('school')
  school(@Req() req: Request, @Query('year') year?: string, @Query('month') month?: string) {
    const y = Number(year);
    const m = Number(month);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
      throw new BadRequestException('year, month 파라미터가 필요합니다. (예: ?year=2026&month=9)');
    }
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    return this.service.forMonth(token, y, m);
  }
}
