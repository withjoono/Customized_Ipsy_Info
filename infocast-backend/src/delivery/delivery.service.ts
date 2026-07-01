import { Injectable, Logger } from '@nestjs/common';
import { Channel, DeliveryStatus, Frequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { MatchService } from '../match/match.service';
import { ChannelRegistry } from './channels/channel-registry';
import { Recipient } from './channels/channel.types';
import { buildMessage } from './message.builder';

const HOUR = 60 * 60 * 1000;
const FREQUENCY_INTERVAL: Record<Frequency, number> = {
  REALTIME: 0,
  DAILY: 20 * HOUR,
  WEEKLY: 6.5 * 24 * HOUR,
};

export interface EnqueueResult {
  memberId: string;
  enqueued: number;
  skipped?: string;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
    private readonly match: MatchService,
    private readonly registry: ChannelRegistry,
  ) {}

  /** 현재 시각이 방해금지 구간인지 (자정 넘김 처리). */
  private isQuietNow(start?: number | null, end?: number | null, hour = new Date().getHours()): boolean {
    if (start == null || end == null || start === end) return false;
    return start < end ? hour >= start && hour < end : hour >= start || hour < end;
  }

  private enabledChannels(channels: unknown): Channel[] {
    const c = (channels ?? {}) as Record<string, unknown>;
    const out: Channel[] = [];
    if (c.kakao) out.push(Channel.KAKAO);
    if (c.sms) out.push(Channel.SMS);
    if (c.push) out.push(Channel.PUSH);
    if (c.email) out.push(Channel.EMAIL);
    return out;
  }

  /** 빈도 기준으로 발송 대상인지 (마지막 큐 적재 시점 대비). */
  private async isDue(memberId: string, frequency: Frequency): Promise<boolean> {
    const interval = FREQUENCY_INTERVAL[frequency];
    if (interval === 0) return true;
    const last = await this.prisma.delivery.findFirst({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!last) return true;
    return Date.now() - last.createdAt.getTime() >= interval;
  }

  /** 한 회원의 매칭 결과를 ic_delivery 에 적재(중복·방해금지·채널 반영). */
  async enqueueForMember(memberId: string, opts: { ignoreQuiet?: boolean } = {}): Promise<EnqueueResult> {
    const sub = await this.subscriptions.getMine(memberId);
    if (!sub || !sub.enabled) return { memberId, enqueued: 0, skipped: '구독 비활성' };

    const channels = this.enabledChannels(sub.channels);
    if (channels.length === 0) return { memberId, enqueued: 0, skipped: '채널 없음' };

    if (!opts.ignoreQuiet && this.isQuietNow(sub.quietStart, sub.quietEnd)) {
      return { memberId, enqueued: 0, skipped: '방해금지 시간' };
    }

    const matched = (await this.match.matchForMember(memberId, 20)).filter((m) => m.score > 0);
    let enqueued = 0;

    for (const item of matched) {
      for (const channel of channels) {
        const exists = await this.prisma.delivery.findFirst({
          where: { memberId, infoItemId: item.id, channel },
          select: { id: true },
        });
        if (exists) continue;
        await this.prisma.delivery.create({
          data: {
            memberId,
            infoItemId: item.id,
            channel,
            status: DeliveryStatus.QUEUED,
            matchedScore: item.score,
          },
        });
        enqueued += 1;
      }
    }
    return { memberId, enqueued };
  }

  /** 최근 발송 이력 (관리자 모니터링). */
  listRecent(take = 100) {
    return this.prisma.delivery.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { infoItem: { select: { title: true } } },
    });
  }

  /** QUEUED 발송 처리. */
  async dispatchQueued(limit = 200): Promise<{ sent: number; failed: number }> {
    const queued = await this.prisma.delivery.findMany({
      where: { status: DeliveryStatus.QUEUED },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: { infoItem: true },
    });

    let sent = 0;
    let failed = 0;
    for (const d of queued) {
      const adapter = this.registry.get(d.channel);
      const message = buildMessage(d.infoItem);
      const recipient = this.resolveRecipient(d.memberId);
      try {
        const result = await adapter.send(recipient, message);
        if (result.ok) {
          await this.prisma.delivery.update({
            where: { id: d.id },
            data: { status: DeliveryStatus.SENT, sentAt: new Date(), error: null },
          });
          sent += 1;
        } else {
          await this.prisma.delivery.update({
            where: { id: d.id },
            data: { status: DeliveryStatus.FAILED, error: result.error ?? '발송 실패' },
          });
          failed += 1;
        }
      } catch (err) {
        await this.prisma.delivery.update({
          where: { id: d.id },
          data: { status: DeliveryStatus.FAILED, error: (err as Error).message },
        });
        failed += 1;
      }
    }
    return { sent, failed };
  }

  /** 한 회원: 적재 후 즉시 발송. */
  async runForMember(memberId: string, opts: { ignoreQuiet?: boolean } = {}) {
    const enqueue = await this.enqueueForMember(memberId, opts);
    const dispatch = await this.dispatchQueued();
    return { enqueue, dispatch };
  }

  /** 스케줄러 진입점: 활성 구독 전체에 대해 빈도·방해금지 반영하여 적재 후 발송. */
  async runDue(): Promise<{ candidates: number; enqueued: number; sent: number; failed: number }> {
    const subs = await this.prisma.subscription.findMany({
      where: { enabled: true },
      select: { memberId: true, frequency: true },
    });

    let enqueued = 0;
    let candidates = 0;
    for (const s of subs) {
      if (!(await this.isDue(s.memberId, s.frequency))) continue;
      candidates += 1;
      const r = await this.enqueueForMember(s.memberId);
      enqueued += r.enqueued;
    }
    const dispatch = await this.dispatchQueued();
    this.logger.log(`runDue: 후보 ${candidates}명, 적재 ${enqueued}건, 발송 ${dispatch.sent}/실패 ${dispatch.failed}`);
    return { candidates, enqueued, ...dispatch };
  }

  /**
   * 수신자 연락처 해소. TODO: Hub 사용자 정보 API(전화/이메일/푸시토큰)에서 채널별 주소 조회.
   * 현재는 미해소(null) — 사업자 미설정 어댑터는 dry-run 으로 통과.
   */
  private resolveRecipient(memberId: string): Recipient {
    return { memberId, to: null };
  }
}
