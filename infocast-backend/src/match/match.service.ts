import { Injectable, Logger } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HubService } from '../hub/hub.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { toTagSet } from '../info-item/tags/tag.types';
import { itemMatchesQuery, scoreMatch, TagQuery } from '../info-item/tags/tag.match';

export interface MatchedItem {
  id: string;
  title: string;
  body: string;
  category: string;
  source: string | null;
  url: string | null;
  publishedAt: Date | null;
  deadlineAt: Date | null;
  score: number;
  reasons: string[];
}

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hub: HubService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  /** 프로파일(학년·교육과정) + 구독 관심사 → 매칭 질의. */
  async buildQuery(memberId: string): Promise<TagQuery> {
    const sub = await this.subscriptions.getMine(memberId);
    const interests = (sub?.interests ?? {}) as Record<string, unknown>;

    let grades: number[] = [];
    let curricula: string[] = [];
    try {
      const profile = await this.hub.getAdmissionProfile(memberId);
      if (profile?.grade) grades = [Number(profile.grade)];
      if (profile?.curriculum) curricula = [String(profile.curriculum)];
    } catch (err) {
      // Hub 미가용(로컬/장애) — 구독 관심사만으로 매칭.
      this.logger.warn(`프로파일 조회 실패, 구독 기반 매칭으로 폴백: ${(err as Error).message}`);
    }

    return {
      grades,
      curricula,
      tracks: (interests.tracks as string[]) ?? [],
      regions: (interests.regions as string[]) ?? [],
      admissionTypes: (interests.admissionTypes as string[]) ?? [],
    };
  }

  /** 개인화 피드: 승인된 정보 중 매칭 + 점수순 정렬. */
  async matchForMember(memberId: string, take = 50): Promise<MatchedItem[]> {
    const query = await this.buildQuery(memberId);

    const items = await this.prisma.infoItem.findMany({
      where: { status: ItemStatus.APPROVED },
      orderBy: { publishedAt: 'desc' },
      take: 300,
    });

    const now = Date.now();
    const matched = items
      .filter((item) => itemMatchesQuery(toTagSet(item.targetTags), query))
      .map((item) => {
        const tags = toTagSet(item.targetTags);
        let score = scoreMatch(tags, query);
        const reasons = this.reasons(tags, query);

        // 마감 임박 가산 (14일 이내일수록 ↑, 최대 +0.2).
        if (item.deadlineAt) {
          const days = (item.deadlineAt.getTime() - now) / DAY;
          if (days >= 0 && days <= 14) {
            score += 0.2 * (1 - days / 14);
            reasons.push(`마감 D-${Math.max(0, Math.ceil(days))}`);
          }
        }
        return {
          id: item.id,
          title: item.title,
          body: item.body,
          category: item.category,
          source: item.source,
          url: item.url,
          publishedAt: item.publishedAt,
          deadlineAt: item.deadlineAt,
          score: Math.round(score * 1000) / 1000,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score || (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

    return matched.slice(0, take);
  }

  /**
   * 배치 매칭 1회 실행 + ic_match_log 기록 (Phase 3 스케줄러가 호출).
   * 현재는 후보 수만 집계. 실제 발송 큐 적재는 Phase 3.
   */
  async runBatch(memberId: string) {
    const matched = await this.matchForMember(memberId, 1000);
    return this.prisma.matchLog.create({
      data: {
        itemsCount: matched.length,
        matchCount: matched.filter((m) => m.score > 0).length,
        meta: { memberId } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private reasons(
    tags: ReturnType<typeof toTagSet>,
    query: TagQuery,
  ): string[] {
    const out: string[] = [];
    const hit = (item: (string | number)[], q?: (string | number)[]) =>
      (q?.length ?? 0) > 0 && item.length > 0 && item.some((v) => q!.map(String).includes(String(v)));
    if (hit(tags.admissionTypes, query.admissionTypes)) out.push('관심 전형 일치');
    if (hit(tags.tracks, query.tracks)) out.push('계열 일치');
    if (hit(tags.regions, query.regions)) out.push('관심 지역 일치');
    if (hit(tags.grades, query.grades)) out.push('학년 일치');
    if (hit(tags.curricula, query.curricula)) out.push('교육과정 일치');
    return out;
  }
}
