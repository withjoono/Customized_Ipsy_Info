import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { rootRoute } from './root';
import { useAuth } from '../store/auth';
import { CATEGORIES } from '../lib/tags';
import { useCalendarEvents, type CalendarScope } from '../lib/useCalendarEvents';
import { usePublicCalendar } from '../lib/usePublicCalendar';
import { useSchoolEvents } from '../lib/useSchoolEvents';
import { useProfile } from '../lib/useProfile';
import {
  categoryLabel,
  currentYearMonth,
  eventsInMonth,
  formatKoreanDate,
  formatYearMonth,
  groupByDate,
  isSchoolCategory,
  isYearMonth,
  nearestMonthWithEvents,
  shiftYearMonth,
  todayYmd,
  type CalendarEvent,
  type YearMonth,
} from '../lib/calendar';
import { MonthCalendar } from '../components/MonthCalendar';
import { MajorCountdown } from '../components/MajorCountdown';
import { EventCard } from '../components/EventCard';
import { ScheduleByDate } from '../components/ScheduleByDate';

type ViewMode = 'grid' | 'list';

interface CalendarSearch {
  ym?: string;
}

/** 월 요약에 세울 묶음 — 사용자가 실제로 구분해서 찾는 단위. */
const SUMMARY_GROUPS = [
  { key: 'SCHEDULE', label: '전형·일정' },
  { key: 'DEADLINE', label: '마감' },
  { key: 'BRIEFING', label: '설명회' },
  { key: 'SCHOOL_EXAM', label: '학교 시험' },
] as const;

function CalendarPage() {
  const { token, loginRedirect } = useAuth();
  const navigate = useNavigate();
  const search = calendarRoute.useSearch() as CalendarSearch;
  const authed = !!token;

  const ym: YearMonth = isYearMonth(search.ym) ? search.ym : currentYearMonth();
  const [scope, setScope] = useState<CalendarScope>('mine');
  const [view, setView] = useState<ViewMode>('grid');
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [schoolLayer, setSchoolLayer] = useState<'exam' | 'all' | 'off'>('exam');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');

  // 로그인 사용자는 개인화 소스, 비로그인은 공개 소스. 한쪽만 실제로 요청한다.
  const personal = useCalendarEvents(scope);
  const publicCal = usePublicCalendar(appliedQ || undefined, !authed);
  const { grade } = useProfile();
  const school = useSchoolEvents(authed ? [ym] : [], grade);
  const today = todayYmd();

  const source = authed ? personal : publicCal;
  const baseEvents: CalendarEvent[] = source.events;

  const schoolVisible = useMemo(() => {
    if (!authed || schoolLayer === 'off') return [];
    if (schoolLayer === 'exam') return school.events.filter((e) => e.category === 'SCHOOL_EXAM');
    return school.events;
  }, [authed, school.events, schoolLayer]);

  const filtered = useMemo(() => {
    const all = [...baseEvents, ...schoolVisible];
    // 카테고리 칩은 입시 일정에만 적용한다 — 학교 일정은 레이어 토글이 따로 있다.
    if (categories.length === 0) return all;
    return all.filter((e) => isSchoolCategory(e.category) || categories.includes(e.category));
  }, [baseEvents, schoolVisible, categories]);

  const monthEvents = useMemo(() => eventsInMonth(filtered, ym), [filtered, ym]);
  const byDate = useMemo(() => groupByDate(monthEvents), [monthEvents]);

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of monthEvents) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return SUMMARY_GROUPS.map((g) => ({ ...g, count: counts.get(g.key) ?? 0 })).filter(
      (g) => g.count > 0,
    );
  }, [monthEvents]);

  const setYm = (next: YearMonth) => {
    setSelected(null);
    void navigate({ to: '/calendar', search: { ym: next } });
  };

  const selectedEvents = selected ? byDate.get(selected) ?? [] : [];
  const nearest = monthEvents.length === 0 ? nearestMonthWithEvents(filtered, ym) : null;

  return (
    <section className="calpage">
      <div className="calpage__head">
        <div>
          <h1>입시 캘린더</h1>
          <p className="calpage__sub">
            {authed
              ? '내 학년·전형·관심 대학에 맞춘 일정'
              : '2027학년도 대입 — 수능·원서접수·대학별 전형 일정'}
          </p>
        </div>
        {authed && (
          <div className="seg" role="group" aria-label="일정 범위">
            <button
              className={`seg__btn${scope === 'mine' ? ' seg__btn--on' : ''}`}
              onClick={() => setScope('mine')}
            >
              내 일정
            </button>
            <button
              className={`seg__btn${scope === 'all' ? ' seg__btn--on' : ''}`}
              onClick={() => setScope('all')}
            >
              전체
            </button>
          </div>
        )}
      </div>

      {/* 다가오는 주요 일정 — 로그인 여부와 무관하게 가장 먼저 보인다. */}
      <MajorCountdown events={filtered} />

      {!authed && (
        <div className="calpage__cta">
          <span>
            지금은 <strong>전체 공개 일정</strong>입니다. 로그인하면 내 학년·전형·관심 대학 일정만
            골라 볼 수 있어요.
          </span>
          <button onClick={loginRedirect}>로그인하고 내 일정만 보기</button>
        </div>
      )}

      <div className="calpage__bar">
        <div className="calpage__nav">
          <button
            className="icobtn"
            aria-label="이전 달"
            onClick={() => setYm(shiftYearMonth(ym, -1))}
          >
            ‹
          </button>
          <strong className="calpage__ym">{formatYearMonth(ym)}</strong>
          <button className="icobtn" aria-label="다음 달" onClick={() => setYm(shiftYearMonth(ym, 1))}>
            ›
          </button>
          <button className="calpage__today" onClick={() => setYm(currentYearMonth())}>
            오늘
          </button>
        </div>
        <div className="seg" role="group" aria-label="보기 방식">
          <button
            className={`seg__btn${view === 'grid' ? ' seg__btn--on' : ''}`}
            onClick={() => setView('grid')}
          >
            달력
          </button>
          <button
            className={`seg__btn${view === 'list' ? ' seg__btn--on' : ''}`}
            onClick={() => setView('list')}
          >
            목록
          </button>
        </div>
      </div>

      {summary.length > 0 && (
        <div className="calsum" aria-label={`${formatYearMonth(ym)} 일정 요약`}>
          <span className="calsum__total">{monthEvents.length}건</span>
          {summary.map((g) => (
            <span key={g.key} className="calsum__item">
              <i className={`calsum__dot cal__bar--${g.key}`} aria-hidden="true" />
              {g.label} {g.count}
            </span>
          ))}
        </div>
      )}

      {!authed && (
        <form
          className="pub__search"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedQ(q.trim());
            setSelected(null);
          }}
        >
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="대학명으로 좁혀보기 (예: 고려대, 한양대(ERICA))"
            aria-label="대학명 검색"
          />
          <button type="submit">검색</button>
          {appliedQ && (
            <button
              type="button"
              className="pub__clear"
              onClick={() => {
                setQ('');
                setAppliedQ('');
              }}
            >
              초기화
            </button>
          )}
        </form>
      )}

      <div className="calpage__chips">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.value}
            className={`chip${categories.includes(c.value) ? ' chip--on' : ''}`}
            onClick={() =>
              setCategories((s) =>
                s.includes(c.value) ? s.filter((v) => v !== c.value) : [...s, c.value],
              )
            }
          >
            {c.label}
          </button>
        ))}
        {categories.length > 0 && (
          <button type="button" className="chip" onClick={() => setCategories([])}>
            필터 해제
          </button>
        )}
      </div>

      {authed && (
        <div className="calpage__school">
          <span className="calpage__schoollabel">
            학교 일정
            {school.schoolName ? ` · ${school.schoolName}` : ''}
          </span>
          {school.linked ? (
            <div className="seg" role="group" aria-label="학교 일정 표시 범위">
              {(
                [
                  ['exam', '시험만'],
                  ['all', '전체'],
                  ['off', '끄기'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={`seg__btn${schoolLayer === value ? ' seg__btn--on' : ''}`}
                  onClick={() => setSchoolLayer(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <span className="muted">
              Hub 프로필에서 학교를 등록하면 중간·기말고사가 여기에 표시됩니다.
            </span>
          )}
        </div>
      )}

      {source.isLoading && <p className="muted">일정을 불러오는 중…</p>}
      {source.error && <p className="admin__error">일정을 불러오지 못했습니다.</p>}

      {!source.isLoading && !source.error && (
        <>
          {view === 'grid' ? (
            <MonthCalendar ym={ym} events={monthEvents} selected={selected} onSelect={setSelected} />
          ) : (
            <div className="calpage__list">
              <ScheduleByDate events={monthEvents} emptyText="이 달에는 일정이 없어요." />
            </div>
          )}

          {monthEvents.length === 0 && (
            <div className="empty">
              <p>
                {appliedQ
                  ? `이 달에는 ‘${appliedQ}’ 일정이 없어요.`
                  : '이 달에는 일정이 없어요.'}
              </p>
              {nearest && (
                <button onClick={() => setYm(nearest)}>
                  가장 가까운 일정 보기 ({formatYearMonth(nearest)})
                </button>
              )}
            </div>
          )}

          {view === 'grid' && selected && (
            <div className="calpage__detail">
              <h2>
                {formatKoreanDate(selected)}
                {selectedEvents.length > 0 && (
                  <span className="calpage__detailcount">{selectedEvents.length}건</span>
                )}
              </h2>
              {selectedEvents.length === 0 ? (
                <p className="muted">이 날은 등록된 일정이 없어요.</p>
              ) : (
                <ul className="feed__list">
                  {selectedEvents.map((e) => (
                    <EventCard key={e.id} event={e} past={e.date < today} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === 'grid' && !selected && monthEvents.length > 0 && (
            <p className="calpage__hint">날짜를 누르면 그날 일정을 볼 수 있어요.</p>
          )}
        </>
      )}

      <div className="callegend" aria-label="색 범례">
        {SUMMARY_GROUPS.map((g) => (
          <span key={g.key} className="callegend__item">
            <i className={`calsum__dot cal__bar--${g.key}`} aria-hidden="true" />
            {categoryLabel(g.key)}
          </span>
        ))}
      </div>

      <p className="calpage__notice">
        일정은 대학 공고에 따라 변경될 수 있습니다. 각 항목의 출처·원문을 반드시 확인하세요.{' '}
        {authed ? (
          <Link to="/subscribe" className="app__link">
            관심사 설정 →
          </Link>
        ) : (
          <Link to="/schedule" className="app__link">
            날짜순으로 보기 →
          </Link>
        )}
      </p>
    </section>
  );
}

export const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage,
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    ym: typeof search.ym === 'string' ? search.ym : undefined,
  }),
});
