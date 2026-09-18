import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InfoCategory, ItemStatus } from '@prisma/client';

/** 목록 조회 필터. 태그 필터는 콤마구분 문자열로 받는다(예: regions=서울,경기). */
export class QueryInfoItemDto {
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsEnum(InfoCategory)
  category?: InfoCategory;

  @IsOptional()
  @IsString()
  grades?: string;

  @IsOptional()
  @IsString()
  tracks?: string;

  @IsOptional()
  @IsString()
  regions?: string;

  @IsOptional()
  @IsString()
  admissionTypes?: string;

  @IsOptional()
  @IsString()
  curricula?: string;

  @IsOptional()
  @IsString()
  universities?: string;

  /** 마감일 하한 (ISO, 예: 2026-09-01). 캘린더가 기간으로 끊어 받을 때 쓴다. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** 마감일 상한 (ISO). */
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** 'true' 면 마감일이 있는 항목만 — 캘린더에 올라갈 수 있는 것만 골라 받는다. */
  @IsOptional()
  @IsBooleanString()
  hasDeadline?: string;

  // 일정이 수백 건이라 캘린더는 한 번에 많이 받아야 한다(기간 필터와 함께 쓰는 것을 전제).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  take?: number;
}
