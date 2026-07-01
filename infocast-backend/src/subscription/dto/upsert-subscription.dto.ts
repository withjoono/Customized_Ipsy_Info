import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export class UpsertSubscriptionDto {
  /** 관심 태그: { regions:[], tracks:[], admissionTypes:[] }. 학년·교육과정은 프로파일에서 자동. */
  @IsOptional()
  @IsObject()
  interests?: Record<string, unknown>;

  /** 채널 on/off: { kakao, sms, push, email } */
  @IsOptional()
  @IsObject()
  channels?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['REALTIME', 'DAILY', 'WEEKLY'])
  frequency?: 'REALTIME' | 'DAILY' | 'WEEKLY';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietStart?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietEnd?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
