import {
  daysUntil,
  ddayLabel,
  formatKoreanDate,
  isCommonEvent,
  todayYmd,
  upcomingEvents,
  type CalendarEvent,
} from '../lib/calendar';

interface Props {
  events: CalendarEvent[];
  /** 몇 건까지 세울지 (기본 3) */
  limit?: number;
}

/**
 * 다가오는 '전 국민 공통' 입시 일정 카운트다운.
 * 대학별 면접·발표는 사람마다 달라 여기 세우지 않는다 — 수능·원서접수·등록처럼
 * 모두에게 같은 날짜만 골라 큰 숫자로 보여 준다.
 */
export function MajorCountdown({ events, limit = 3 }: Props) {
  const today = todayYmd();
  const major = upcomingEvents(events.filter(isCommonEvent), limit, today);
  if (major.length === 0) return null;

  return (
    <ul className="cdown" aria-label="다가오는 주요 입시 일정">
      {major.map((e, i) => (
        <li key={e.id} className={`cdown__card${i === 0 ? ' cdown__card--lead' : ''}`}>
          <p className="cdown__title">{e.title}</p>
          <strong className="cdown__dday">
            {ddayLabel(e.date, today)}
            {daysUntil(e.date, today) === 0 && <span className="cdown__now">오늘</span>}
          </strong>
          <p className="cdown__date">{formatKoreanDate(e.date)}</p>
        </li>
      ))}
    </ul>
  );
}
