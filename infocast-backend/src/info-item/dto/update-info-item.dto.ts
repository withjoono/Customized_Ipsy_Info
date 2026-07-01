import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { InfoCategory, ItemStatus } from '@prisma/client';

/** 부분 수정 + 상태 전이. (mapped-types 의존 없이 명시적으로 작성) */
export class UpdateInfoItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(InfoCategory)
  category?: InfoCategory;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  targetTags?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsDateString()
  deadlineAt?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
