import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { MatchService } from './match.service';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly service: MatchService) {}

  /** 내 개인화 피드 (구독·프로파일 기반, 점수순). */
  @Get('me')
  matchMe(@CurrentUser() user: JwtPayload, @Query('take') take?: string) {
    return this.service.matchForMember(user.sub, take ? Number(take) : undefined);
  }
}
