import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfoItemDto } from './dto/create-info-item.dto';
import { UpdateInfoItemDto } from './dto/update-info-item.dto';
import { QueryInfoItemDto } from './dto/query-info-item.dto';
import { TagNormalizer } from './tags/tag.normalizer';
import { itemMatchesQuery, splitCsv, TagQuery } from './tags/tag.match';
import { EMPTY_TAGSET, TagSet } from './tags/tag.types';

/** ic_info_item 인입·정규화·태깅·상태 워크플로 (Phase 1). */
@Injectable()
export class InfoItemService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInfoItemDto) {
    const tags = TagNormalizer.normalize(dto.targetTags);
    return this.prisma.infoItem.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        category: dto.category,
        source: dto.source?.trim(),
        url: dto.url?.trim(),
        targetTags: tags as unknown as Prisma.InputJsonValue,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateInfoItemDto) {
    await this.requireExists(id);
    const data: Prisma.InfoItemUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.body !== undefined) data.body = dto.body.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.source !== undefined) data.source = dto.source?.trim();
    if (dto.url !== undefined) data.url = dto.url?.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.publishedAt !== undefined)
      data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    if (dto.deadlineAt !== undefined)
      data.deadlineAt = dto.deadlineAt ? new Date(dto.deadlineAt) : null;
    if (dto.targetTags !== undefined)
      data.targetTags = TagNormalizer.normalize(dto.targetTags) as unknown as Prisma.InputJsonValue;

    return this.prisma.infoItem.update({ where: { id }, data });
  }

  async setStatus(id: string, status: ItemStatus) {
    await this.requireExists(id);
    return this.prisma.infoItem.update({ where: { id }, data: { status } });
  }

  async findAll(query: QueryInfoItemDto) {
    const where: Prisma.InfoItemWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    // 기간·마감일 필터는 DB 에서 처리한다 — 일정이 수백 건이라
    // take 로 잘라 온 뒤 클라이언트에서 거르면 조용히 누락된다.
    const wantsDeadline = query.hasDeadline === 'true';
    if (wantsDeadline || query.from || query.to) {
      const deadlineAt: Prisma.DateTimeNullableFilter = {};
      if (wantsDeadline) deadlineAt.not = null;
      if (query.from) deadlineAt.gte = new Date(query.from);
      if (query.to) deadlineAt.lte = new Date(query.to);
      where.deadlineAt = deadlineAt;
    }

    const items = await this.prisma.infoItem.findMany({
      where,
      // 기간 조회는 날짜순이 자연스럽고, 그 외에는 최신순을 유지한다.
      orderBy: where.deadlineAt ? { deadlineAt: 'asc' } : { createdAt: 'desc' },
      take: query.take ?? 50,
    });

    const tagQuery: TagQuery = {
      grades: splitCsv(query.grades),
      tracks: splitCsv(query.tracks),
      regions: splitCsv(query.regions),
      admissionTypes: splitCsv(query.admissionTypes),
      curricula: splitCsv(query.curricula),
      universities: splitCsv(query.universities),
    };
    const hasTagFilter = Object.values(tagQuery).some((v) => (v?.length ?? 0) > 0);
    if (!hasTagFilter) return items;

    return items.filter((item) => itemMatchesQuery(this.asTagSet(item.targetTags), tagQuery));
  }

  async findOne(id: string) {
    return this.requireExists(id);
  }

  private async requireExists(id: string) {
    const item = await this.prisma.infoItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('정보를 찾을 수 없습니다.');
    return item;
  }

  private asTagSet(raw: Prisma.JsonValue): TagSet {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const r = raw as Record<string, unknown>;
      return {
        grades: (r.grades as TagSet['grades']) ?? [],
        tracks: (r.tracks as TagSet['tracks']) ?? [],
        regions: (r.regions as TagSet['regions']) ?? [],
        admissionTypes: (r.admissionTypes as TagSet['admissionTypes']) ?? [],
        curricula: (r.curricula as TagSet['curricula']) ?? [],
        universities: (r.universities as TagSet['universities']) ?? [],
      };
    }
    return { ...EMPTY_TAGSET };
  }
}
