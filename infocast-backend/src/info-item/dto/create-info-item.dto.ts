import { IsEnum, IsOptional, IsString, IsObject, IsDateString } from 'class-validator';
import { InfoCategory } from '@prisma/client';

export class CreateInfoItemDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsEnum(InfoCategory)
  category!: InfoCategory;

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
}
