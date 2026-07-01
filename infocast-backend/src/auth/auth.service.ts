import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface VerifyCodeResult {
  accessToken: string;
  user: { id: string; email?: string; name?: string };
}

/**
 * Hub SSO 토큰교환.
 * 흐름: client → Hub login?redirect= → sso_code(Redis 5분) → 본 backend 가 Hub /auth/sso/verify-code 호출.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly config: ConfigService) {}

  async verifyCode(ssoCode: string): Promise<VerifyCodeResult> {
    const hubUrl = this.config.get<string>('HUB_BASE_URL') ?? 'http://localhost:4000';
    const serviceSecret = this.config.get<string>('AUTH_SERVICE_SECRET');
    const serviceId = this.config.get<string>('SERVICE_ID') ?? 'infocast';

    try {
      const { data } = await axios.post(
        `${hubUrl}/auth/sso/verify-code`,
        { code: ssoCode },
        {
          headers: {
            Authorization: `Bearer ${serviceSecret}`,
            'X-Service-Id': serviceId,
          },
          timeout: 10_000,
        },
      );
      // Hub 응답 스키마는 생태계 표준에 맞춰 조정 (검색앱 Hub-SSO-연동.md 참고).
      const payload = data?.data ?? data;
      return {
        accessToken: payload.accessToken ?? payload.token,
        user: payload.user,
      };
    } catch (err) {
      this.logger.warn(`verify-code 실패: ${(err as Error).message}`);
      throw new UnauthorizedException('SSO 코드 검증 실패');
    }
  }
}
