// 캘린더 데이터 훅. 백엔드 변경 없이 기존 두 엔드포인트를 병합한다(기획서 §5).
//  - GET /matches/me                        → 내 맞춤 일정(personal)
//  - GET /info-items?status=APPROVED        → 공통 일정 (scope='all' 일 때만)

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from '../store/auth';
import { mergeEvents, type CalendarEvent, type InfoItemLike } from './calendar';

export type CalendarScope = 'mine' | 'all';

const STALE = 5 * 60 * 1000; // 일정은 자주 바뀌지 않는다.

/** 캘린더가 다루는 창 — 지난 3개월 ~ 앞으로 15개월(한 입시 사이클을 덮는다). */
const WINDOW_BACK_MONTHS = 6;
const WINDOW_FWD_MONTHS = 15;
/** 일정이 수백 건이라 기본 take(50·200)로는 조용히 잘린다. */
const TAKE = 1000;

function windowRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - WINDOW_BACK_MONTHS, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + WINDOW_FWD_MONTHS, 1);
  // toISOString 은 UTC 라 KST 기준으로 하루 밀린다 — 로컬 연·월·일을 그대로 쓴다.
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(from), to: iso(to) };
}

function unwrap<T>(res: { data: unknown }): T {
  const d = res.data as { data?: T } | T;
  return ((d as { data?: T })?.data ?? d) as T;
}

export function useCalendarEvents(scope: CalendarScope = 'mine') {
  const { token } = useAuth();

  const mine = useQuery({
    queryKey: ['calendar', 'mine'],
    queryFn: async () =>
      unwrap<InfoItemLike[]>(await api.get('/matches/me', { params: { take: TAKE } })),
    enabled: !!token,
    staleTime: STALE,
  });

  const all = useQuery({
    queryKey: ['calendar', 'all'],
    queryFn: async () =>
      unwrap<InfoItemLike[]>(
        await api.get('/info-items', {
          params: { status: 'APPROVED', hasDeadline: 'true', take: TAKE, ...windowRange() },
        }),
      ),
    enabled: !!token && scope === 'all',
    staleTime: STALE,
  });

  const events: CalendarEvent[] = mergeEvents(
    mine.data ?? [],
    scope === 'all' ? all.data ?? [] : [],
  );

  return {
    events,
    isLoading: mine.isLoading || (scope === 'all' && all.isLoading),
    error: mine.error ?? (scope === 'all' ? all.error : null),
  };
}
