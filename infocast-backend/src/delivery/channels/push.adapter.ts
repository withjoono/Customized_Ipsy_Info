import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '@prisma/client';
import { ChannelAdapter, OutboundMessage, Recipient, SendResult } from './channel.types';

/** 앱 푸시(FCM). 실제 연동은 isConfigured()=true 시 작성. */
@Injectable()
export class PushAdapter implements ChannelAdapter {
  readonly channel = Channel.PUSH;
  private readonly logger = new Logger(PushAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('FCM_SERVICE_ACCOUNT');
  }

  async send(to: Recipient, message: OutboundMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      this.logger.debug(`[dry-run] PUSH → ${to.memberId}: ${message.title}`);
      return { ok: true, dryRun: true };
    }
    if (!to.to) return { ok: false, error: '푸시 토큰 미해소' };
    // TODO: FCM 메시지 발송.
    return { ok: false, error: 'PUSH 발송 미구현' };
  }
}
