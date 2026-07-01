import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '@prisma/client';
import { ChannelAdapter, OutboundMessage, Recipient, SendResult } from './channel.types';

/** 카카오 알림톡. 실제 연동(Solapi/NHN/비즈톡 등)은 isConfigured()=true 시 작성. */
@Injectable()
export class KakaoAdapter implements ChannelAdapter {
  readonly channel = Channel.KAKAO;
  private readonly logger = new Logger(KakaoAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('KAKAO_ALIMTALK_KEY');
  }

  async send(to: Recipient, message: OutboundMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      this.logger.debug(`[dry-run] KAKAO → ${to.memberId}: ${message.title}`);
      return { ok: true, dryRun: true };
    }
    if (!to.to) return { ok: false, error: '수신자 연락처 미해소' };
    // TODO: 알림톡 템플릿 발송 API 호출.
    return { ok: false, error: 'KAKAO 발송 미구현' };
  }
}
