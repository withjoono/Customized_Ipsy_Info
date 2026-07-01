import { OutboundMessage } from './channels/channel.types';

interface InfoItemLike {
  title: string;
  body: string;
  url?: string | null;
  deadlineAt?: Date | null;
}

/** 입시정보 → 발송 메시지. 마감 임박 시 D-day 접두. */
export function buildMessage(item: InfoItemLike): OutboundMessage {
  let title = item.title;
  if (item.deadlineAt) {
    const days = Math.ceil((item.deadlineAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (days >= 0 && days <= 14) title = `[D-${days}] ${title}`;
  }
  const body =
    item.body.length > 120 ? `${item.body.slice(0, 117)}…` : item.body;
  return { title, body, url: item.url ?? null };
}
