import { Injectable } from '@nestjs/common';
import { Prisma, Frequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';
import { TagNormalizer } from '../info-item/tags/tag.normalizer';

/** 채널 설정 정규화 (불리언만 허용). */
function normChannels(raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = { kakao: false, sms: false, push: false, email: false };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const key of Object.keys(out)) {
      out[key] = Boolean((raw as Record<string, unknown>)[key]);
    }
  }
  return out;
}

/** 관심 태그 정규화 — regions/tracks/admissionTypes 만 사용. */
function normInterests(raw: unknown): Record<string, unknown> {
  const t = TagNormalizer.normalize(raw);
  return { regions: t.regions, tracks: t.tracks, admissionTypes: t.admissionTypes };
}

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  getMine(memberId: string) {
    return this.prisma.subscription.findUnique({ where: { memberId } });
  }

  upsertMine(memberId: string, dto: UpsertSubscriptionDto) {
    const interests =
      dto.interests !== undefined
        ? (normInterests(dto.interests) as unknown as Prisma.InputJsonValue)
        : undefined;
    const channels =
      dto.channels !== undefined
        ? (normChannels(dto.channels) as unknown as Prisma.InputJsonValue)
        : undefined;
    const frequency = dto.frequency as Frequency | undefined;

    return this.prisma.subscription.upsert({
      where: { memberId },
      create: {
        memberId,
        interests: interests ?? {},
        channels: channels ?? {},
        frequency: frequency ?? Frequency.DAILY,
        quietStart: dto.quietStart,
        quietEnd: dto.quietEnd,
        enabled: dto.enabled ?? true,
      },
      update: {
        ...(interests !== undefined ? { interests } : {}),
        ...(channels !== undefined ? { channels } : {}),
        ...(frequency !== undefined ? { frequency } : {}),
        ...(dto.quietStart !== undefined ? { quietStart: dto.quietStart } : {}),
        ...(dto.quietEnd !== undefined ? { quietEnd: dto.quietEnd } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      },
    });
  }
}
