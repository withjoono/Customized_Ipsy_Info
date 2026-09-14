// 캘린더 데이터 훅. 백엔드 변경 없이 기존 두 엔드포인트를 병합한다(기획서 §5).
//  - GET /matches/me                        → 내 맞춤 일정(personal)
//  - GET /info-items?status=APPROVED        → 공통 일정 (scope='all' 일 때만)

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from '../store/auth';
import { mergeEvents, type CalendarEvent, type InfoItemLike } from './calendar';

export type CalendarScope = 'mine' | 'all';

const STALE = 5 * 60 * 1000; // 일정은 자주 바뀌지 않는다.

function unwrap<T>(res: { data: unknown }): T {
  const d = res.data as { data?: T } | T;
  return ((d as { data?: T })?.data ?? d) as T;
}

export function useCalendarEvents(scope: CalendarScope = 'mine') {
  const { token } = useAuth();

  const mine = useQuery({
    queryKey: ['calendar', 'mine'],
    queryFn: async () => unwrap<InfoItemLike[]>(await api.get('/matches/me')),
    enabled: !!token,
    staleTime: STALE,
  });

  const all = useQuery({
    queryKey: ['calendar', 'all'],
    queryFn: async () =>
      unwrap<InfoItemLike[]>(
        await api.get('/info-items', { params: { status: 'APPROVED', take: 200 } }),
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
