import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Hub 입시 프로파일 응답 (검색앱과 동일 스키마). */
export interface AdmissionProfile {
  curriculum: '2015' | '2022' | string;
  grade: number;
  naesin_summary: Record<string, unknown> | null;
  csat_mock_summary: Record<string, unknown> | null;
  saenggibu_summary: Record<string, unknown> | null;
  susi_fit_signals: Record<string, unknown> | null;
  jungsi_fit_signals: Record<string, unknown> | null;
}

/**
 * Hub 개인화 레이어 소비.
 * GET {HUB_INTERNAL}/api/internal/users/:hubUserId/admission-profile
 * ServiceAuth: Authorization Bearer + X-Service-Id: infocast.
 * 소스(생기부/모고/수시/정시)는 직접 안 읽고 이 API만 소비한다.
 */
@Injectable()
export class HubService {
  private readonly logger = new Logger(HubService.name);

  constructor(private readonly config: ConfigService) {}

  async getAdmissionProfile(hubUserId: string): Promise<AdmissionProfile> {
    const base =
      this.config.get<string>('HUB_INTERNAL_BASE_URL') ??
      this.config.get<string>('HUB_BASE_URL') ??
      'http://localhost:4000';
    const serviceSecret = this.config.get<string>('AUTH_SERVICE_SECRET');
    const serviceId = this.config.get<string>('SERVICE_ID') ?? 'infocast';

    const { data } = await axios.get(
      `${base}/api/internal/users/${encodeURIComponent(hubUserId)}/admission-profile`,
      {
        headers: {
          Authorization: `Bearer ${serviceSecret}`,
          'X-Service-Id': serviceId,
        },
        timeout: 10_000,
      },
    );
    this.logger.debug(`admission-profile fetched for ${hubUserId}`);
    return (data?.data ?? data) as AdmissionProfile;
  }
}
