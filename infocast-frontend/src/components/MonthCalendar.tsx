import {
  buildMonthGrid,
  categoryLabel,
  formatKoreanDate,
  groupByDate,
  todayYmd,
  WEEKDAY_LABELS,
  type CalendarEvent,
  type YearMonth,
} from '../lib/calendar';

interface Props {
  ym: YearMonth;
  events: CalendarEvent[];
  selected?: string | null;
  onSelect?: (ymd: string) => void;
  /** 대시보드용 축소 모드(점만 표시, 셀 높이 축소) */
  compact?: boolean;
}

const MAX_DOTS = 3;

/** 월간 그리드. 일정이 있는 날에 카테고리 색 점을 찍는다. */
export function MonthCalendar({ ym, events, selected, onSelect, compact = false }: Props) {
  const cells = buildMonthGrid(ym);
  const byDate = groupByDate(events);
  const today = todayYmd();

  return (
    <div className={`cal${compact ? ' cal--compact' : ''}`}>
      <div className="cal__week cal__week--head" role="row">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="cal__wd">
            {w}
          </span>
        ))}
      </div>
      <div className="cal__grid">
        {cells.map((cell) => {
          const dayEvents = byDate.get(cell.ymd) ?? [];
          const cls = [
            'cal__cell',
            cell.inMonth ? '' : 'cal__cell--out',
            cell.ymd === today ? 'cal__cell--today' : '',
            cell.ymd === selected ? 'cal__cell--selected' : '',
            dayEvents.length > 0 ? 'cal__cell--has' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const label =
            dayEvents.length > 0
              ? `${formatKoreanDate(cell.ymd, false)}, 일정 ${dayEvents.length}건`
              : `${formatKoreanDate(cell.ymd, false)}, 일정 없음`;

          return (
            <button
              type="button"
              key={cell.ymd}
              className={cls}
              aria-label={label}
              aria-pressed={cell.ymd === selected}
              onClick={() => onSelect?.(cell.ymd)}
              disabled={!onSelect}
            >
              <span className="cal__num">{Number(cell.ymd.slice(8))}</span>
              {dayEvents.length > 0 && (
                <span className="cal__dots">
                  {dayEvents.slice(0, MAX_DOTS).map((e) => (
                    <i
                      key={e.id}
                      className={`cal__dot cal__dot--${e.category}${
                        e.personal ? ' cal__dot--mine' : ''
                      }`}
                      title={`${categoryLabel(e.category)} · ${e.title}`}
                    />
                  ))}
                  {dayEvents.length > MAX_DOTS && (
                    <i className="cal__more">+{dayEvents.length - MAX_DOTS}</i>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
