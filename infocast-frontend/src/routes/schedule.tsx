import { createRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { rootRoute } from './root';
import { useAuth } from '../store/auth';
import { usePublicCalendar } from '../lib/usePublicCalendar';
import { ScheduleByDate } from '../components/ScheduleByDate';
import { CATEGORIES } from '../lib/tags';
import { todayYmd, upcomingEvents, ddayLabel, formatKoreanDate } from '../lib/calendar';

/**
 * 공개 입시 일정 (로그인 불필요).
 * 날짜별로 묶어 전체 일정을 보여준다 — 공유·SEO 용도.
 * 개인화된 뷰는 /calendar (로그인 필요).
 */
function PublicSchedule() {
  const { token, loginRedirect } = useAuth();
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [hidePast, setHidePast] = useState(true);

  const { events, isLoading, error, refetch } = usePublicCalendar(applied || undefined);
  const today = todayYmd();

  const filtered = useMemo(() => {
    let list = events;
    if (categories.length > 0) list = list.filter((e) => categories.includes(e.category));
    if (hidePast) list = list.filter((e) => e.date >= today);
    return list;
  }, [events, categories, hidePast, today]);

  const next = upcomingEvents(events, 1)[0];

  return (
    <section className="pub">
      <header className="pub__hero">
        <p className="pub__eyebrow">2027학년도 대입</p>
        <h1 className="pub__title">입시 일정 한눈에 보기</h1>
        <p className="pub__lead">
          원서접수·수능·면접·합격자 발표까지 공개된 전체 일정을 날짜순으로 정리했습니다.
          로그인하면 내 성적·전형·관심 대학에 맞는 일정만 골라 볼 수 있어요.
        </p>
        {next && (
          <p className="pub__next">
            <strong>{ddayLabel(next.date)}</strong> {next.title} · {formatKoreanDate(next.date)}
          </p>
        )}
        {!token && (
          <button onClick={loginRedirect} className="pub__cta">
            로그인하고 내 일정만 보기
          </button>
        )}
        {token && (
          <Link to="/calendar" className="pub__cta pub__cta--link">
            내 맞춤 캘린더로 →
          </Link>
        )}
      </header>

      <form
        className="pub__search"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(q.trim());
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="대학명으로 검색 (예: 고려대, 한양대(ERICA))"
          aria-label="대학명 검색"
        />
        <button type="submit">검색</button>
        {applied && (
          <button
            type="button"
            className="pub__clear"
            onClick={() => {
              setQ('');
              setApplied('');
            }}
          >
            초기화
          </button>
        )}
      </form>

      <div className="calpage__chips">
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.value}
            aria-pressed={categories.includes(c.value)}
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
        <button
          type="button"
          className={`chip${hidePast ? ' chip--on' : ''}`}
          aria-pressed={hidePast}
          onClick={() => setHidePast((v) => !v)}
        >
          지난 일정 숨기기
        </button>
      </div>

      {isLoading && <p className="muted" role="status">일정을 불러오는 중…</p>}
      {error && <div className="empty" role="alert"><h2>일정을 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button onClick={() => void refetch()}>다시 불러오기</button></div>}

      {!isLoading && !error && (
        <>
          <p className="muted pub__count">
            {applied ? `‘${applied}’ 검색 결과 ` : ''}
            {filtered.length}건
          </p>
          <ScheduleByDate
            events={filtered}
            showMonthHeaders
            emptyText={
              applied
                ? `‘${applied}’와 일치하는 일정이 없습니다. 대학명 표기를 확인해 주세요.`
                : '표시할 일정이 없습니다.'
            }
          />
        </>
      )}

      <p className="calpage__notice">
        일정은 대학 공고에 따라 변경될 수 있습니다. 각 항목의 출처·원문을 반드시 확인하세요.
        대학별 면접·발표 일정은 해당 대학 입학처 공고가 최종입니다.
      </p>
    </section>
  );
}

export const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedule',
  component: PublicSchedule,
});
