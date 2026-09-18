import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { HubService } from '../hub/hub.service';
import { TagNormalizer } from '../info-item/tags/tag.normalizer';
import { Grade } from '../info-item/tags/tag.types';
import { parseGradeFromClaims } from '../auth/grade-from-id';

export interface MyProfile {
  /** 1·2·3 또는 재수생 'N'. Hub 미가용/미설정이면 null. */
  grade: Grade | null;
  curriculum: string | null;
}

/**
 * 프런트가 학년별 화면을 분기하려면 학년이 필요하다.
 * 성적·생기부 등 민감 필드는 내려주지 않고 학년/교육과정만 노출한다.
 */
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly hub: HubService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<MyProfile> {
    // 아이디('26h3')가 1순위 — 재수생을 표현할 수 있는 유일한 경로.
    const fromId = parseGradeFromClaims(user);

    try {
      const profile = await this.hub.getAdmissionProfile(user.sub);
      const fromHub =
        profile?.grade === undefined || profile?.grade === null
          ? null
          : (TagNormalizer.normalize({ grades: [profile.grade] }).grades[0] ?? null);
      return {
        grade: fromId ?? fromHub,
        curriculum: profile?.curriculum ? String(profile.curriculum) : null,
      };
    } catch (err) {
      // Hub 장애여도 아이디만으로 학년을 알 수 있다.
      this.logger.warn(`프로파일 조회 실패, 아이디 기반으로 폴백: ${(err as Error).message}`);
      return { grade: fromId, curriculum: null };
    }
  }
}
