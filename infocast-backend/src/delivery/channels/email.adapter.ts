import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel } from '@prisma/client';
import { ChannelAdapter, OutboundMessage, Recipient, SendResult } from './channel.types';

/** 이메일(SMTP/SendGrid). 실제 연동은 isConfigured()=true 시 작성. */
@Injectable()
export class EmailAdapter implements ChannelAdapter {
  readonly channel = Channel.EMAIL;
  private readonly logger = new Logger(EmailAdapter.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('EMAIL_SMTP_URL');
  }

  async send(to: Recipient, message: OutboundMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      this.logger.debug(`[dry-run] EMAIL → ${to.memberId}: ${message.title}`);
      return { ok: true, dryRun: true };
    }
    if (!to.to) return { ok: false, error: '수신자 이메일 미해소' };
    // TODO: 이메일 발송.
    return { ok: false, error: 'EMAIL 발송 미구현' };
  }
}
