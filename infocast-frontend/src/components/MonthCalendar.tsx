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

/** 셀에 세울 수 있는 색 바 개수. 넘치면 +N 으로 접는다. */
const MAX_BARS = 3;
/** 이만큼 몰린 날은 셀 배경을 옅게 칠해 '바쁜 날'이 한눈에 보이게 한다. */
const DENSE_THRESHOLD = 5;

/** 하루 안에서 눈에 먼저 띄어야 하는 순서 — 마감이 가장 세다. */
const CATEGORY_RANK: Record<string, number> = {
  DEADLINE: 0,
  SCHOOL_EXAM: 1,
  SCHEDULE: 2,
  GUIDELINE_CHANGE: 3,
  NEW_ADMISSION: 4,
  BRIEFING: 5,
  COMPETITION_RATE: 6,
  SCHOOL_EVENT: 7,
  POLICY_NEWS: 8,
  SCHOOL_HOLIDAY: 9,
};

function rank(e: CalendarEvent) {
  return CATEGORY_RANK[e.category] ?? 50;
}

/** 월간 그리드. 일정이 있는 날에 카테고리 색 바를 세우고 건수를 표시한다. */
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
          const dayEvents = [...(byDate.get(cell.ymd) ?? [])].sort((a, b) => rank(a) - rank(b));
          const cls = [
            'cal__cell',
            cell.inMonth ? '' : 'cal__cell--out',
            cell.ymd === today ? 'cal__cell--today' : '',
            cell.ymd === selected ? 'cal__cell--selected' : '',
            dayEvents.length > 0 ? 'cal__cell--has' : '',
            dayEvents.length >= DENSE_THRESHOLD ? 'cal__cell--dense' : '',
            cell.ymd < today ? 'cal__cell--past' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const label =
            dayEvents.length > 0
              ? `${formatKoreanDate(cell.ymd, false)}, 일정 ${dayEvents.length}건`
              : `${formatKoreanDate(cell.ymd, false)}, 일정 없음`;

          // 같은 카테고리가 여러 건이면 바는 한 줄로 합친다(색이 중복되면 읽기 어렵다).
          const kinds = [...new Set(dayEvents.map((e) => e.category))];

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
              <span className="cal__top">
                <span className="cal__num">{Number(cell.ymd.slice(8))}</span>
                {!compact && dayEvents.length > 1 && (
                  <span className="cal__count">{dayEvents.length}</span>
                )}
              </span>

              {dayEvents.length > 0 &&
                (compact ? (
                  <span className="cal__dots">
                    {kinds.slice(0, MAX_BARS).map((c) => (
                      <i key={c} className={`cal__dot cal__dot--${c}`} />
                    ))}
                  </span>
                ) : (
                  <span className="cal__bars">
                    {kinds.slice(0, MAX_BARS).map((c) => (
                      <i
                        key={c}
                        className={`cal__bar cal__bar--${c}`}
                        title={`${categoryLabel(c)} ${dayEvents.filter((e) => e.category === c).length}건`}
                      />
                    ))}
                    {kinds.length > MAX_BARS && (
                      <i className="cal__more">+{kinds.length - MAX_BARS}</i>
                    )}
                  </span>
                ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
