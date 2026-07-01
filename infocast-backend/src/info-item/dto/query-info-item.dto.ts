import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}
