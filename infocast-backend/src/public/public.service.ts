import { Injectable } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toTagSet } from '../info-item/tags/tag.types';
import { QueryPublicCalendarDto } from './dto/query-public-calendar.dto';

export interface PublicCalendarEvent {
  id: string;
  title: string;
  body: string;
  category: string;
  source: string | null;
  url: string | null;
  deadlineAt: Date;
  universities: string[];
}

/** 공개 캘린더 — 로그인 없이 볼 수 있는 '전체 일정' 뷰(개인화 없음). */
@Injectable()
export class PublicService {
  /** 공개 응답이므로 상한을 넉넉히 두되 무한 조회는 막는다. */
  private static readonly MAX_TAKE = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async calendar(query: QueryPublicCalendarDto): Promise<PublicCalendarEvent[]> {
    const deadlineAt: Prisma.DateTimeNullableFilter = { not: null };
    if (query.from) deadlineAt.gte = new Date(query.from);
    if (query.to) deadlineAt.lte = new Date(query.to);

    const items = await this.prisma.infoItem.findMany({
      where: { status: ItemStatus.APPROVED, deadlineAt },
      orderBy: { deadlineAt: 'asc' },
      take: PublicService.MAX_TAKE,
    });

    const q = query.q?.replace(/\s+/g, '').trim();

    return items
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        category: item.category as string,
        source: item.source,
        url: item.url,
        // where 절에서 not-null 을 보장하므로 non-null 단언이 안전하다.
        deadlineAt: item.deadlineAt!,
        universities: toTagSet(item.targetTags).universities,
      }))
      .filter((e) => {
        if (!q) return true;
        return (
          e.universities.some((u) => u.includes(q)) || e.title.replace(/\s+/g, '').includes(q)
        );
      });
  }
}
