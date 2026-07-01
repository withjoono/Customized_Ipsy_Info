import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { ChannelAdapter } from './channel.types';
import { KakaoAdapter } from './kakao.adapter';
import { SmsAdapter } from './sms.adapter';
import { PushAdapter } from './push.adapter';
import { EmailAdapter } from './email.adapter';

/** Channel enum → 어댑터 매핑. */
@Injectable()
export class ChannelRegistry {
  private readonly map: Record<Channel, ChannelAdapter>;

  constructor(kakao: KakaoAdapter, sms: SmsAdapter, push: PushAdapter, email: EmailAdapter) {
    this.map = {
      [Channel.KAKAO]: kakao,
      [Channel.SMS]: sms,
      [Channel.PUSH]: push,
      [Channel.EMAIL]: email,
    };
  }

  get(channel: Channel): ChannelAdapter {
    return this.map[channel];
  }
}
