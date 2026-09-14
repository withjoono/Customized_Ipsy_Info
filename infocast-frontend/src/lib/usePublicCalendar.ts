// 공개 캘린더 데이터 훅 — 로그인 없이 호출되는 GET /public/calendar 를 사용한다.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { toCalendarEvent, type CalendarEvent, type InfoItemLike } from './calendar';

interface PublicEvent extends InfoItemLike {
  universities?: string[];
}

export function usePublicCalendar(q?: string) {
  const query = useQuery({
    queryKey: ['public-calendar', q ?? ''],
    queryFn: async () => {
      const res = await api.get('/public/calendar', { params: q ? { q } : undefined });
      const items: unknown = res.data?.data ?? res.data;
      if (!Array.isArray(items)) throw new Error('공개 일정 응답 형식이 올바르지 않습니다.');
      return items as PublicEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const events: CalendarEvent[] = (query.data ?? [])
    .map((item) => toCalendarEvent(item, false))
    .filter((e): e is CalendarEvent => e !== null);

  return { events, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}
