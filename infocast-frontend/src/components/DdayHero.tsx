import { Link } from '@tanstack/react-router';
import {
  currentYearMonth,
  daysUntil,
  ddayLabel,
  formatKoreanDate,
  formatYearMonth,
  eventsInMonth,
  toYearMonth,
  upcomingEvents,
  type CalendarEvent,
} from '../lib/calendar';
import { gradeLabel, isUnderclassman, type Grade } from '../lib/useProfile';
import { MonthCalendar } from './MonthCalendar';

interface Props {
  events: CalendarEvent[];
  isLoading?: boolean;
  /** 비로그인 상태면 로그인 유도 문구를 덧붙인다. */
  anonymous?: boolean;
  onLogin?: () => void;
  /** 학년별 화면 분기. null = 미상 → 실행 모드 기본형. */
  grade?: Grade;
  /** Hub 에 학교가 연동돼 있는지. 고1·고2는 연동해야 시험 일정이 들어온다. */
  schoolLinked?: boolean;
}

/** 고1·고2에게 보여줄 준비 단계 안내. D-day 카운트다운은 압박만 주고 실행 가치가 없다. */
const PREP_COPY: Record<1 | 2, { headline: string; sub: string }> = {
  1: {
    headline: '지금은 내신·과목 선택의 시기',
    sub: '입시 일정은 아직 내 차례가 아니에요. 학기 중 내신과 과목 선택, 생활기록부 관리가 지금의 입시 준비입니다.',
  },
  2: {
    headline: '1년 뒤 이 시기에 원서를 씁니다',
    sub: '지금 쌓는 내신·생활기록부가 내년 수시의 재료가 됩니다. 아래에서 선배들의 올해 일정을 미리 봐 두세요.',
  },
};

/**
 * 대시보드 최상단 히어로. 이 앱에서 가장 큰 시각 요소.
 * 고3·재수생 = 실행 모드(D-day 카운트다운), 고1·고2 = 준비 모드.
 */
export function DdayHero({
  events,
  isLoading,
  anonymous,
  onLogin,
  grade = null,
  schoolLinked,
}: Props) {
  const upcoming = upcomingEvents(events);
  const under = isUnderclassman(grade);

  // 고1·고2에게는 '명시적으로 내 것'인 일정만 카운트다운한다 —
  // 내 학년이 대상으로 지정된 입시 일정(학력평가)과 내 학교 학사일정(중간·기말고사).
  // 고3·재수생·미상은 다가오는 일정 전체를 그대로 쓴다.
  const mine = under ? upcoming.filter((e) => e.own) : upcoming;
  const [next, ...rest] = mine;

  // 내 학년 일정이 하나도 없을 때만 준비 모드로 떨어진다.
  const prep = under && !next ? PREP_COPY[grade as 1 | 2] : null;
  const peek = prep ? upcoming[0] : null;

  const thisMonth = currentYearMonth();
  const ym = next ? toYearMonth(next.date) : thisMonth;
  const badge = gradeLabel(grade);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__label">
        <span className="hero__badge">입시 캘린더</span>
        {badge && <span className="hero__badge hero__badge--grade">{badge}</span>}
        <h1 id="hero-title" className="hero__heading">
          {prep ? '내 입시 준비' : '가장 가까운 일정'}
        </h1>
      </div>

      {isLoading ? (
        <div className="hero__main hero__main--skeleton" aria-busy="true">
          <span className="hero__dday">D-…</span>
          <p className="hero__title">일정을 불러오는 중…</p>
        </div>
      ) : prep ? (
        // ── 준비 모드 (고1·고2) ─────────────────────────────
        <div className="hero__main hero__main--prep">
          <p className="hero__title">{prep.headline}</p>
          <p className="hero__sub hero__sub--prep">{prep.sub}</p>
          {peek && (
            <p className="hero__peek">
              참고 · 다음 입시 일정 <strong>{peek.title}</strong> ({formatKoreanDate(peek.date)})
            </p>
          )}
        </div>
      ) : next ? (
        // ── 실행 모드 (고3·재수생·미상) ─────────────────────
        <div className="hero__main">
          <p className="hero__title">{next.title}</p>
          <strong className="hero__dday">{ddayLabel(next.date)}</strong>
          <p className="hero__sub">
            {formatKoreanDate(next.date)}
            {next.source ? ` · ${next.source}` : ''}
            {daysUntil(next.date) === 0 ? ' · 오늘입니다' : ''}
          </p>
          {grade === 'N' && (
            <p className="hero__note">
              수능 원서는 <strong>출신 고등학교</strong>에서 접수하는 것이 원칙입니다. 주민등록 주소지가 다른
              시험지구라면 주소지 관할 교육지원청에서 접수할 수 있어요.
            </p>
          )}
        </div>
      ) : (
        <div className="hero__main hero__main--empty">
          <p className="hero__title">예정된 일정이 없어요</p>
          <p className="hero__sub">
            {anonymous
              ? '로그인하면 내 학년·전형·관심 대학에 맞는 일정만 골라 보여드려요.'
              : '관심 대학과 전형을 설정하면 내게 맞는 일정을 채워드릴게요.'}
          </p>
          {anonymous ? (
            <button onClick={onLogin}>로그인하고 시작하기</button>
          ) : (
            <Link to="/subscribe" className="hero__cta">
              구독 설정하러 가기 →
            </Link>
          )}
        </div>
      )}

      {/* 고1·고2는 학교 시험이 사실상 가장 중요한 일정이다 — 모드와 무관하게 연동을 안내한다. */}
      {under && schoolLinked === false && (
        <p className="hero__note">
          학교를 연동하면 중간·기말고사가 이 캘린더에 들어옵니다. Hub 프로필에서 학교를 등록해 주세요.
        </p>
      )}

      {/* 준비 모드(고1·고2)에는 D-day 나열을 넣지 않는다 — 내 일정이 아닌 것의 카운트다운은 불안만 준다. */}
      {!prep && rest.length > 0 && (
        <ul className="hero__next">
          {rest.slice(0, 3).map((e) => (
            <li key={e.id} className="hero__nextitem">
              <span className="hero__nextdday">{ddayLabel(e.date)}</span>
              <span className="hero__nexttitle">{e.title}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="hero__mini">
        <p className="hero__minilabel">{formatYearMonth(ym)}</p>
        <MonthCalendar ym={ym} events={eventsInMonth(events, ym)} compact />
      </div>

      <Link to={prep || anonymous ? '/schedule' : '/calendar'} className="hero__more">
        {prep ? '전체 입시 일정 보기 →' : '캘린더 전체 보기 →'}
      </Link>
    </section>
  );
}
