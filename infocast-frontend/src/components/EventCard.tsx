import { categoryLabel, ddayLabel, formatKoreanDate, type CalendarEvent } from '../lib/calendar';

interface Props {
  event: CalendarEvent;
  showDate?: boolean;
  past?: boolean;
}

/** 캘린더 상세/목록에서 공통으로 쓰는 일정 카드. */
export function EventCard({ event, showDate = false, past = false }: Props) {
  return (
    <li className={`evt${past ? ' evt--past' : ''}`}>
      <div className="evt__top">
        <span className={`evt__cat evt__cat--${event.category}`}>
          {categoryLabel(event.category)}
        </span>
        {event.personal && <span className="evt__mine">내 일정</span>}
        <span className="evt__dday">{ddayLabel(event.date)}</span>
      </div>
      {showDate && <p className="evt__date">{formatKoreanDate(event.date)}</p>}
      <h3 className="evt__title">{event.title}</h3>
      {event.reasons.length > 0 && (
        <div className="evt__reasons">
          {event.reasons.map((r) => (
            <span key={r} className="feed__reason">
              {r}
            </span>
          ))}
        </div>
      )}
      <div className="evt__foot">
        {event.source && <small className="muted">출처: {event.source}</small>}
        {event.url && (
          <a href={event.url} target="_blank" rel="noreferrer" className="app__link">
            원문 보기
          </a>
        )}
      </div>
    </li>
  );
}
