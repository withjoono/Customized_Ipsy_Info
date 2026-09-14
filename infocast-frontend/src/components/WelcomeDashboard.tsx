import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { usePublicCalendar } from '../lib/usePublicCalendar';
import { currentYearMonth, shiftYearMonth, formatYearMonth, eventsInMonth, formatKoreanDate, upcomingEvents, ddayLabel } from '../lib/calendar';
import { MonthCalendar } from './MonthCalendar';

export function WelcomeDashboard({ onLogin }: { onLogin: () => void }) {
  const [ym, setYm] = useState(currentYearMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const { events, isLoading, error } = usePublicCalendar();
  const upcoming = upcomingEvents(events, 3);
  const visible = selected ? events.filter((e) => e.date === selected) : upcoming;
  const changeMonth = (delta: number) => { setYm(shiftYearMonth(ym, delta)); setSelected(null); };

  return (
    <div className="dash welcome">
      <div className="page-intro">
        <div><p className="eyebrow">YOUR NEXT STEP</p><h1>입시 준비, 한눈에 가볍게.</h1><p>중요한 일정부터 나에게 꼭 맞는 정보까지.</p></div>
        <span className="intro-tag">고1부터 재수생까지</span>
      </div>

      <section className="welcome-calendar" aria-labelledby="welcome-calendar-title">
        <div className="welcome-calendar__story">
          <span className="hero__badge">나의 입시 캘린더</span>
          <h2 id="welcome-calendar-title">다음 일정을 알면,<br />준비가 한결 편해져요.</h2>
          <p>원서접수부터 합격자 발표까지.<br />내 학년·전형·관심 대학에 맞춰 챙겨보세요.</p>
          <div className="welcome-calendar__actions"><button onClick={onLogin}>내 맞춤 일정 시작하기 <span aria-hidden="true">↗</span></button><Link to="/schedule">전체 일정 둘러보기 →</Link></div>
          <div className="welcome-calendar__note"><span aria-hidden="true">✓</span> 전체 입시 일정은 로그인 없이 볼 수 있어요.</div>
        </div>
        <div className="welcome-calendar__month">
          <div className="month-heading"><strong>{formatYearMonth(ym)}</strong><div><button aria-label="이전 달" onClick={() => changeMonth(-1)}>‹</button><button onClick={() => { setYm(currentYearMonth()); setSelected(null); }}>오늘</button><button aria-label="다음 달" onClick={() => changeMonth(1)}>›</button></div></div>
          <MonthCalendar ym={ym} events={eventsInMonth(events, ym)} selected={selected} onSelect={setSelected} />
          <div className="month-caption"><span className="calendar-key" /> 오늘 <span>날짜를 선택해 일정을 확인하세요</span></div>
        </div>
        <div className="welcome-calendar__upcoming" aria-live="polite">
          <strong>{selected ? formatKoreanDate(selected, false) : '다가오는 일정'}</strong>
          {isLoading ? <span>공개 일정을 불러오고 있어요…</span> : error ? <span>일정을 불러오지 못했어요. <Link to="/schedule">전체 일정에서 다시 확인</Link></span> : visible.length ? <div className="upcoming-inline">{visible.slice(0, 3).map((event) => <Link to="/schedule" key={event.id}><b>{ddayLabel(event.date)}</b><span>{event.title}</span></Link>)}</div> : <span>{selected ? '이 날짜에 등록된 공개 일정이 없어요.' : '새로운 공개 일정이 등록되면 여기에 표시돼요.'}</span>}
        </div>
      </section>

      <section className="dash__section welcome-feed">
        <div className="dash__sechead"><div><p className="eyebrow">FOR YOU</p><h2 className="dash__h2">수많은 정보 중, 나에게 필요한 것만</h2></div><Link to="/feed" className="app__link">맞춤 피드 보기 ↗</Link></div>
        <div className="benefit-grid">
          <article><span className="benefit-number">01 / PROFILE</span><h3>내 상황에 맞는 정보</h3><p>학년과 입시 프로파일을 바탕으로<br />지금 확인할 정보를 골라드려요.</p></article>
          <article><span className="benefit-number">02 / INTEREST</span><h3>관심 대학 소식 모아보기</h3><p>모집요강 변경부터 전형 소식까지,<br />관심 대학의 정보를 한곳에서.</p></article>
          <article><span className="benefit-number">03 / TIMING</span><h3>준비 단계에 맞는 안내</h3><p>고1·고2는 차근차근 준비하고,<br />고3·재수생은 다가오는 일정에 집중해요.</p></article>
        </div>
      </section>

      <section className="dash__section welcome-subscribe"><div><p className="eyebrow">STAY UPDATED</p><h2 className="dash__h2">필요한 소식을, 원하는 주기로</h2><p className="muted">관심사를 고르고 알림 채널과 주기를 설정해 보세요.</p></div><button className="button-secondary" onClick={onLogin}>로그인하고 구독 설정 <span aria-hidden="true">→</span></button></section>
    </div>
  );
}
