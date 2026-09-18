import { IsISO8601, IsOptional, IsString } from 'class-validator';

/** 공개 캘린더 조회 필터 — 인증 없이 호출되므로 파라미터를 최소로 유지한다. */
export class QueryPublicCalendarDto {
  /** 조회 시작일 (ISO, 예: 2026-09-01). 생략 시 제한 없음. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** 조회 종료일 (ISO). 생략 시 제한 없음. */
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** 대학명 부분일치 검색 (예: 고려대). */
  @IsOptional()
  @IsString()
  q?: string;
}
