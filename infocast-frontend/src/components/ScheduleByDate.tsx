import {
  ddayLabel,
  formatKoreanDate,
  formatYearMonth,
  groupByDate,
  toYearMonth,
  todayYmd,
  type CalendarEvent,
} from '../lib/calendar';
import { EventCard } from './EventCard';

interface Props {
  events: CalendarEvent[];
  /** 월 구분 헤더 표시 (여러 달을 한 번에 나열할 때) */
  showMonthHeaders?: boolean;
  emptyText?: string;
}

/**
 * 날짜별로 묶어 보여주는 일정 목록.
 * 공개 페이지(/schedule)와 캘린더 목록 뷰가 함께 쓴다.
 */
export function ScheduleByDate({ events, showMonthHeaders = false, emptyText }: Props) {
  const today = todayYmd();
  const byDate = groupByDate(events);
  const dates = [...byDate.keys()].sort();

  if (dates.length === 0) {
    return <p className="muted">{emptyText ?? '해당하는 일정이 없습니다.'}</p>;
  }

  let lastMonth = '';

  return (
    <div className="bydate">
      {dates.map((date) => {
        const month = toYearMonth(date);
        const newMonth = showMonthHeaders && month !== lastMonth;
        if (newMonth) lastMonth = month;
        const past = date < today;

        return (
          <section key={date} className="bydate__day">
            {newMonth && <h2 className="bydate__month">{formatYearMonth(month)}</h2>}
            <div className={`bydate__head${past ? ' bydate__head--past' : ''}`}>
              <h3 className="bydate__date">{formatKoreanDate(date)}</h3>
              <span className="bydate__dday">{past ? '지남' : ddayLabel(date)}</span>
              <span className="bydate__count">{byDate.get(date)!.length}건</span>
            </div>
            <ul className="feed__list">
              {byDate.get(date)!.map((e) => (
                <EventCard key={e.id} event={e} past={past} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
