import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { rootRoute } from './root';
import { useAuth } from '../store/auth';
import { CATEGORIES } from '../lib/tags';
import { useCalendarEvents, type CalendarScope } from '../lib/useCalendarEvents';
import { useSchoolEvents } from '../lib/useSchoolEvents';
import { useProfile } from '../lib/useProfile';
import {
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
  type YearMonth,
} from '../lib/calendar';
import { MonthCalendar } from '../components/MonthCalendar';
import { EventCard } from '../components/EventCard';
import { ScheduleByDate } from '../components/ScheduleByDate';

type ViewMode = 'grid' | 'list';

interface CalendarSearch {
  ym?: string;
}

function CalendarPage() {
  const { token, loginRedirect } = useAuth();
  const navigate = useNavigate();
  const search = calendarRoute.useSearch() as CalendarSearch;

  const ym: YearMonth = isYearMonth(search.ym) ? search.ym : currentYearMonth();
  const [scope, setScope] = useState<CalendarScope>('mine');
  const [view, setView] = useState<ViewMode>('grid');
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** 학교 일정 레이어: 시험만(기본) → 전체 → 끄기 */
  const [schoolLayer, setSchoolLayer] = useState<'exam' | 'all' | 'off'>('exam');

  const { events, isLoading, error } = useCalendarEvents(scope);
  const { grade } = useProfile();
  const school = useSchoolEvents([ym], grade);
  const today = todayYmd();

  // 입시 일정 + 학교 일정(레이어 설정에 따라)을 한 캘린더에 합친다.
  const schoolVisible = useMemo(() => {
    if (schoolLayer === 'off') return [];
    if (schoolLayer === 'exam') return school.events.filter((e) => e.category === 'SCHOOL_EXAM');
    return school.events;
  }, [school.events, schoolLayer]);

  const filtered = useMemo(() => {
    const all = [...events, ...schoolVisible];
    // 카테고리 칩은 입시 일정에만 적용한다 — 학교 일정은 레이어 토글이 따로 있다.
    if (categories.length === 0) return all;
    return all.filter((e) => isSchoolCategory(e.category) || categories.includes(e.category));
  }, [events, schoolVisible, categories]);
  const monthEvents = useMemo(() => eventsInMonth(filtered, ym), [filtered, ym]);
  const byDate = useMemo(() => groupByDate(monthEvents), [monthEvents]);

  const setYm = (next: YearMonth) => {
    setSelected(null);
    void navigate({ to: '/calendar', search: { ym: next } });
  };

  if (!token) {
    return (
      <section className="empty">
        <h1>입시 캘린더</h1>
        <p>로그인하면 내 성적·전형에 맞는 일정만 골라 캘린더로 보여드려요.</p>
        <button onClick={loginRedirect}>로그인하고 시작하기</button>
      </section>
    );
  }

  const selectedEvents = selected ? byDate.get(selected) ?? [] : [];
  const nearest = monthEvents.length === 0 ? nearestMonthWithEvents(filtered, ym) : null;

  return (
    <section className="calpage">
      <div className="calpage__head">
        <h1>입시 캘린더</h1>
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
      </div>

      <div className="calpage__bar">
        <div className="calpage__nav">
          <button className="icobtn" aria-label="이전 달" onClick={() => setYm(shiftYearMonth(ym, -1))}>
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

      {isLoading && <p className="muted">일정을 불러오는 중…</p>}
      {error && <p className="admin__error">일정을 불러오지 못했습니다.</p>}

      {!isLoading && !error && (
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
              <p>이 달에는 일정이 없어요.</p>
              {nearest && (
                <button onClick={() => setYm(nearest)}>
                  가장 가까운 일정 보기 ({formatYearMonth(nearest)})
                </button>
              )}
            </div>
          )}

          {view === 'grid' && selected && (
            <div className="calpage__detail">
              <h2>{formatKoreanDate(selected)}</h2>
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
        </>
      )}

      <p className="calpage__notice">
        일정은 대학 공고에 따라 변경될 수 있습니다. 각 항목의 출처·원문을 반드시 확인하세요.{' '}
        <Link to="/subscribe" className="app__link">
          관심사 설정 →
        </Link>
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
