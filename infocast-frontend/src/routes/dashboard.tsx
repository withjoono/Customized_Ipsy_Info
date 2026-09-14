import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { useCalendarEvents } from '../lib/useCalendarEvents';
import { useProfile, isUnderclassman, gradeLabel } from '../lib/useProfile';
import { useSchoolEvents } from '../lib/useSchoolEvents';
import { currentYearMonth, shiftYearMonth } from '../lib/calendar';
import { DdayHero } from '../components/DdayHero';
import { FeedList, type FeedItem } from '../components/FeedList';
import { ADMISSION_TYPES, TRACKS } from '../lib/tags';
import { WelcomeDashboard } from '../components/WelcomeDashboard';

const FEED_PREVIEW = 5;

interface SubscriptionSummary {
  interests?: { regions?: string[]; tracks?: string[]; admissionTypes?: string[] };
  channels?: Record<string, boolean>;
  frequency?: 'REALTIME' | 'DAILY' | 'WEEKLY';
  enabled?: boolean;
}

const FREQ_LABEL: Record<string, string> = {
  REALTIME: '실시간',
  DAILY: '매일',
  WEEKLY: '매주',
};
const CHANNEL_LABEL: Record<string, string> = {
  kakao: '카카오',
  sms: 'SMS',
  push: '푸시',
  email: '이메일',
};

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find((x) => x.value === value)?.label ?? value;
}

/**
 * 대시보드. 섹션 우선순위:
 *   ① 입시 캘린더(D-day 히어로 + 미니 캘린더) — 최상단·최대 면적·유일한 채색 블록
 *   ② 내 맞춤 정보 미리보기
 *   ③ 구독 상태 요약
 */
function Dashboard() {
  const { token, loginRedirect } = useAuth();
  const { events, isLoading: calLoading } = useCalendarEvents('mine');
  const { grade, isLoading: profileLoading } = useProfile();
  // 히어로가 다음 달 시험까지 볼 수 있도록 이번 달 + 두 달을 함께 조회한다.
  const months = [0, 1, 2].map((d) => shiftYearMonth(currentYearMonth(), d));
  const school = useSchoolEvents(months, grade);

  const feed = useQuery({
    queryKey: ['matches', 'me'],
    queryFn: async () => {
      const res = await api.get('/matches/me');
      return (res.data?.data ?? res.data) as FeedItem[];
    },
    enabled: !!token,
  });

  const sub = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/me');
      return (res.data?.data ?? res.data) as SubscriptionSummary | null;
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <WelcomeDashboard onLogin={loginRedirect} />
    );
  }

  const items = feed.data ?? [];
  const s = sub.data;
  const activeChannels = Object.entries(s?.channels ?? {})
    .filter(([, on]) => on)
    .map(([k]) => CHANNEL_LABEL[k] ?? k);
  const interestTags = [
    ...(s?.interests?.admissionTypes ?? []).map((v) => label(ADMISSION_TYPES, v)),
    ...(s?.interests?.tracks ?? []).map((v) => label(TRACKS, v)),
    ...(s?.interests?.regions ?? []),
  ];

  return (
    <div className="dash">
      <div className="page-intro"><div><p className="eyebrow">MY ADMISSIONS</p><h1>나의 입시 대시보드</h1><p>오늘 확인할 일정과 나에게 필요한 정보를 모았어요.</p></div><span className="intro-tag">{gradeLabel(grade) || '맞춤 입시정보'}</span></div>
      {/* ① 가장 주요한 섹션 */}
      <DdayHero
        events={[...events, ...school.events]}
        isLoading={calLoading || profileLoading}
        grade={grade}
        schoolLinked={school.linked}
      />

      {/* ② 맞춤 피드 */}
      <section className="dash__section">
        <div className="dash__sechead">
          <h2 className="dash__h2">
            {isUnderclassman(grade) ? `${gradeLabel(grade)} · 지금 볼 정보` : '내 맞춤 정보'}
          </h2>
          <Link to="/feed" className="app__link">
            전체 보기 →
          </Link>
        </div>
        {feed.isLoading && <p className="muted">맞춤 정보를 고르는 중…</p>}
        {feed.error && <p className="admin__error">정보를 불러오지 못했습니다.</p>}
        {!feed.isLoading && !feed.error && items.length === 0 && (
          <p className="muted">아직 맞춤 정보가 없어요. 관심사를 설정하면 더 정확해집니다.</p>
        )}
        {items.length > 0 && <FeedList items={items.slice(0, FEED_PREVIEW)} compact />}
      </section>

      {/* ③ 구독 요약 */}
      <section className="dash__section">
        <div className="dash__sechead">
          <h2 className="dash__h2">구독 상태</h2>
          <Link to="/subscribe" className="app__link">
            설정 →
          </Link>
        </div>
        {sub.isLoading ? <p className="muted" role="status">구독 설정을 불러오고 있어요…</p> : sub.error ? <p className="admin__error" role="alert">구독 상태를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p> : !s ? <p className="muted">아직 구독을 설정하지 않았어요. 관심사를 골라 나에게 맞는 정보를 받아보세요.</p> : <>
        <dl className="dash__summary">
          <div>
            <dt>알림</dt>
            <dd>{s?.enabled === false ? '꺼짐' : '켜짐'}</dd>
          </div>
          <div>
            <dt>빈도</dt>
            <dd>{FREQ_LABEL[s?.frequency ?? 'DAILY']}</dd>
          </div>
          <div>
            <dt>채널</dt>
            <dd>{activeChannels.length > 0 ? activeChannels.join(' · ') : '미설정'}</dd>
          </div>
        </dl>
        <div className="admin__chips">
          {interestTags.length > 0 ? (
            interestTags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))
          ) : (
            <span className="muted">관심 태그가 없어요 — 설정하면 매칭 정확도가 올라갑니다.</span>
          )}
        </div>
        </>}
      </section>
    </div>
  );
}

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});
