// 내 학교 학사일정 훅.
// 백엔드가 Hub 의 NEIS 모듈(`GET /neis/schedule`)을 프록시한다 — NEIS 를 직접 붙이지 않는다.
import { useQueries } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from '../store/auth';
import type { CalendarEvent, YearMonth } from './calendar';
import type { Grade } from './useProfile';

interface SchoolEventDto {
  id: string;
  date: string;
  title: string;
  kind: 'SCHOOL_EXAM' | 'SCHOOL_HOLIDAY' | 'SCHOOL_EVENT';
  grades: number[];
}

interface SchoolCalendarDto {
  linked: boolean;
  schoolName: string | null;
  events: SchoolEventDto[];
}

const STALE = 60 * 60 * 1000; // Hub 가 이미 24h 캐시한다 — 자주 다시 부를 이유가 없다.

function toEvent(dto: SchoolEventDto, schoolName: string | null): CalendarEvent {
  return {
    id: dto.id,
    date: dto.date,
    title: dto.title,
    category: dto.kind,
    source: schoolName,
    url: null,
    personal: true,
    own: true, // 내 학교 일정은 언제나 '내 것'이다.
    reasons: ['내 학교'],
  };
}

/**
 * 여러 달을 한 번에 조회한다(히어로가 다음 달 시험까지 봐야 하므로).
 * 행사명에 학년이 적힌 항목은 내 학년 것만 남긴다 — Hub 응답에 학년 필드가 없어 이름으로만 판별된다.
 */
export function useSchoolEvents(yms: YearMonth[], grade: Grade = null) {
  const { token } = useAuth();

  const results = useQueries({
    queries: yms.map((ym) => ({
      queryKey: ['school-calendar', ym],
      queryFn: async () => {
        const [year, month] = ym.split('-').map(Number);
        const res = await api.get('/calendar/school', { params: { year, month } });
        return (res.data?.data ?? res.data) as SchoolCalendarDto;
      },
      enabled: !!token,
      staleTime: STALE,
      retry: false,
    })),
  });

  const loaded = results.filter((r) => r.data);
  const linked = loaded.some((r) => r.data!.linked);
  const schoolName = loaded.find((r) => r.data?.schoolName)?.data?.schoolName ?? null;

  // 행사명에 학년이 적혀 있으면 내 학년 것만 남긴다(학년 표기 없음 = 전 학년 대상).
  const mineOnly = (dto: SchoolEventDto) =>
    dto.grades.length === 0 || grade === null || dto.grades.includes(Number(grade));

  const events: CalendarEvent[] = loaded.flatMap((r) =>
    r.data!.events.filter(mineOnly).map((e) => toEvent(e, r.data!.schoolName)),
  );

  return {
    events,
    linked,
    schoolName,
    isLoading: results.some((r) => r.isLoading),
  };
}
