import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '@prisma/client';
import { ChannelAdapter, OutboundMessage, Recipient, SendResult } from './channel.types';

/** SMS/LMS. 실제 연동(알리고/NHN Cloud 등)은 isConfigured()=true 시 작성. */
@Injectable()
export class SmsAdapter implements ChannelAdapter {
  readonly channel = Channel.SMS;
  private readonly logger = new Logger(SmsAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('SMS_PROVIDER_KEY');
  }

  async send(to: Recipient, message: OutboundMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      this.logger.debug(`[dry-run] SMS → ${to.memberId}: ${message.title}`);
      return { ok: true, dryRun: true };
    }
    if (!to.to) return { ok: false, error: '수신자 전화번호 미해소' };
    // TODO: SMS 발송 API 호출.
    return { ok: false, error: 'SMS 발송 미구현' };
  }
}
