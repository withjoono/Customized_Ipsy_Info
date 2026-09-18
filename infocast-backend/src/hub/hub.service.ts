import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Hub 학사일정 응답 (Hub `GET /neis/schedule` — 위성앱 공용 계약). */
export interface HubAcademicEvent {
  /** YYYYMMDD */
  date: string;
  eventName: string;
  isHoliday: boolean;
}

/** Hub 연동 학교 정보 (`GET /neis/my-school`). */
export interface HubMySchool {
  schoolName?: string;
  atptCode?: string;
  schulCode?: string;
  [key: string]: unknown;
}

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

  /**
   * 학교 학사일정 — Hub 의 NEIS 모듈을 그대로 소비한다.
   * NEIS 를 우리가 직접 붙이지 않는 이유: Hub 가 이미 학교 연동·Redis 캐시(24h)·정규화를
   * 하고 있고, 같은 데이터를 두 곳에서 관리하면 갈라진다(생기부·모고와 동일한 원칙).
   *
   * 이 엔드포인트는 **서비스 인증이 아니라 사용자 JWT** 를 쓴다
   * (Hub 가 회원 프로필에서 학교코드를 찾아야 하므로). 그래서 호출자의 Bearer 토큰을 그대로 전달한다.
   * 학교 미연동이면 Hub 가 404 를 준다 → 호출부에서 '미연동'으로 해석한다.
   */
  async getSchoolSchedule(
    userToken: string,
    year: number,
    month: number,
  ): Promise<HubAcademicEvent[]> {
    const { data } = await axios.get(`${this.publicBase()}/neis/schedule`, {
      params: { year, month },
      headers: { Authorization: `Bearer ${userToken}` },
      timeout: 10_000,
    });
    return (data?.data ?? data ?? []) as HubAcademicEvent[];
  }

  /** 연동된 내 학교 정보. 미연동이면 Hub 가 404. */
  async getMySchool(userToken: string): Promise<HubMySchool | null> {
    const { data } = await axios.get(`${this.publicBase()}/neis/my-school`, {
      headers: { Authorization: `Bearer ${userToken}` },
      timeout: 10_000,
    });
    return (data?.data ?? data ?? null) as HubMySchool | null;
  }

  /** 사용자 JWT 로 호출하는 Hub 공개 API 베이스( internal 이 아니다 ). */
  private publicBase(): string {
    return this.config.get<string>('HUB_BASE_URL') ?? 'http://localhost:4000';
  }
}
