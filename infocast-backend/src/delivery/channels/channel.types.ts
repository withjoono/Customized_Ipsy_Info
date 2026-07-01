import { Channel } from '@prisma/client';

/** 발송 대상 수신자. 연락처는 Hub 사용자 정보에서 해소한다(현재 TODO). */
export interface Recipient {
  memberId: string;
  /** 채널별 주소: 전화번호/이메일/카카오 식별자/푸시 토큰. 미해소 시 null. */
  to: string | null;
}

/** 발송 메시지 (채널 공통). */
export interface OutboundMessage {
  title: string;
  body: string;
  url?: string | null;
}

export interface SendResult {
  ok: boolean;
  /** 사업자 미설정으로 실제 발송 없이 통과한 경우 true. */
  dryRun?: boolean;
  error?: string;
}

/** 채널 어댑터 공통 인터페이스. */
export interface ChannelAdapter {
  readonly channel: Channel;
  /** 사업자 키가 설정돼 실제 발송 가능한지. */
  isConfigured(): boolean;
  send(to: Recipient, message: OutboundMessage): Promise<SendResult>;
}
