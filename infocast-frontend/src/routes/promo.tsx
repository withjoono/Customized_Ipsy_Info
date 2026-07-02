import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';

/**
 * 맞춤 입시정보 프로모 (기능 소개 · 사용법 · 블로그)
 * 이 앱은 Tailwind가 없어 인라인 스타일로 자체완결 구성했습니다.
 */

const ACCENT = '#3b3bd6';
const INK = '#1a1a2e';
const MUTED = '#5b5b73';
const BORDER = '#e6e6ef';
const CARD = '#ffffff';
const SOFT = '#f2f3fb';

const TABS = [
  { to: '/promo', label: '기능 소개' },
  { to: '/promo/guide', label: '사용법' },
  { to: '/promo/blog', label: '블로그' },
];

function PromoShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      <nav
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 0',
          borderBottom: `1px solid ${BORDER}`,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              color: MUTED,
              border: `1px solid ${BORDER}`,
              background: CARD,
            }}
            activeProps={{ style: { color: '#fff', background: ACCENT, border: `1px solid ${ACCENT}` } }}
            activeOptions={{ exact: t.to === '/promo' }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

function Hero({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${SOFT} 0%, #fff 100%)`,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 700,
          color: ACCENT,
          background: '#ececfb',
          borderRadius: 999,
          padding: '4px 12px',
          marginBottom: 12,
        }}
      >
        {badge}
      </span>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, margin: '4px 0 10px', lineHeight: 1.35 }}>{title}</h1>
      <p style={{ fontSize: 15, color: MUTED, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>{body}</p>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 19, fontWeight: 800, color: INK, margin: '32px 0 14px' }}>{children}</h2>;
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {children}
    </div>
  );
}

function CTA({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        marginTop: 8,
        padding: '12px 22px',
        borderRadius: 12,
        background: ACCENT,
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      {label}
    </a>
  );
}

// ───────────────────────── 기능 소개 (메인) ─────────────────────────
function PromoHome() {
  return (
    <PromoShell>
      <Hero
        badge="맞춤 입시정보"
        title="관심사에 맞는 입시정보만 매일 골라 드립니다"
        body="관심 대학·전형·키워드를 구독하면, 쏟아지는 입시 소식 중 나에게 필요한 것만 추려 피드로 배달합니다. 마감 임박 정보는 알림으로 놓치지 않게 해 드립니다."
      />
      <SectionTitle>핵심 기능</SectionTitle>
      <Grid>
        <Card title="맞춤 피드" body="구독한 관심사에 맞춰 관련도 순으로 정렬된 입시 소식을 매일 확인합니다." />
        <Card title="키워드·대학 구독" body="관심 대학·전형·키워드를 등록하면 관련 정보만 골라 모아 줍니다." />
        <Card title="마감 알림" body="원서·전형 마감이 임박한 정보를 우선 노출하고 알림으로 알려 줍니다." />
        <Card title="출처 확인" body="모든 정보에 출처를 함께 제공해 신뢰할 수 있는 원문을 바로 확인합니다." />
      </Grid>
      <SectionTitle>더 알아보기</SectionTitle>
      <Grid>
        <Card title="사용법 →" body="구독 설정부터 맞춤 피드 확인까지, 처음 사용자를 위한 단계별 가이드." />
        <Card title="블로그 →" body="입시정보를 똑똑하게 활용하는 방법과 최신 입시 인사이트." />
      </Grid>
      <div style={{ textAlign: 'center' }}>
        <CTA href="/subscribe" label="관심사 구독하고 시작하기" />
      </div>
    </PromoShell>
  );
}

// ───────────────────────── 사용법 ─────────────────────────
const STEPS = [
  { t: '1. 로그인', b: '거북스쿨 Hub 계정으로 로그인합니다. 한 계정으로 다른 앱과 연동됩니다.' },
  { t: '2. 관심사 구독', b: '관심 대학·전형·키워드를 등록해 받아 볼 정보의 범위를 정합니다.' },
  { t: '3. 맞춤 피드 확인', b: '구독 기준에 맞춰 정렬된 피드에서 나에게 필요한 소식을 매일 확인합니다.' },
  { t: '4. 마감 알림 받기', b: '마감 임박 정보를 알림으로 받아 원서·전형 일정을 놓치지 않습니다.' },
];

function PromoGuide() {
  return (
    <PromoShell>
      <Hero
        badge="사용법 가이드"
        title="3분이면 맞춤 입시정보가 시작됩니다"
        body="로그인 → 관심사 구독 → 맞춤 피드 확인. 아래 순서만 따라오면 됩니다."
      />
      <SectionTitle>빠른 시작</SectionTitle>
      <div style={{ display: 'grid', gap: 10 }}>
        {STEPS.map((s) => (
          <div key={s.t} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <strong style={{ color: INK, fontSize: 15 }}>{s.t}</strong>
            <p style={{ color: MUTED, fontSize: 14, margin: '6px 0 0', lineHeight: 1.65 }}>{s.b}</p>
          </div>
        ))}
      </div>
      <SectionTitle>활용 팁</SectionTitle>
      <Grid>
        <Card title="키워드는 구체적으로" body="'의대 논술', '수시 교과'처럼 구체적일수록 더 정확한 정보가 모입니다." />
        <Card title="출처를 꼭 확인" body="입결·합격 가능성은 추정치입니다. 항상 원문 출처를 확인하세요." />
        <Card title="알림을 켜 두기" body="마감 임박 알림을 켜 두면 중요한 원서 일정을 놓치지 않습니다." />
      </Grid>
      <SectionTitle>자주 묻는 질문</SectionTitle>
      <div style={{ display: 'grid', gap: 10 }}>
        <Card title="구독은 여러 개 등록할 수 있나요?" body="네. 관심 대학·전형·키워드를 여러 개 등록해 폭넓게 받아 볼 수 있습니다." />
        <Card title="정보 출처는 어디인가요?" body="공식 발표·모집요강 등을 기반으로 하며, 각 항목에 출처 링크를 함께 제공합니다." />
      </div>
      <div style={{ textAlign: 'center' }}>
        <CTA href="/subscribe" label="지금 구독 설정하기" />
      </div>
    </PromoShell>
  );
}

// ───────────────────────── 블로그 ─────────────────────────
interface Post {
  title: string;
  category: string;
  date: string;
  excerpt: string;
}
const POSTS: Post[] = [
  { title: '쏟아지는 입시정보, 나에게 맞는 것만 걸러내는 법', category: '활용법', date: '2026-06-18', excerpt: '관심사 구독으로 정보 과부하를 줄이고 필요한 소식만 받는 방법을 정리했습니다.' },
  { title: '원서 마감, 알림 하나로 놓치지 않기', category: '일정 관리', date: '2026-06-10', excerpt: '마감 임박 정보를 우선 노출·알림으로 관리하는 실전 팁.' },
  { title: '입시정보의 출처를 확인해야 하는 이유', category: '신뢰성', date: '2026-06-02', excerpt: '추정 입결과 공식 자료를 구분하고 원문을 확인하는 습관.' },
  { title: '관심 키워드, 이렇게 설정하면 정확도가 올라갑니다', category: '활용법', date: '2026-05-25', excerpt: '구체적 키워드 설정으로 맞춤 피드 정확도를 높이는 노하우.' },
];

function PromoBlog() {
  const [featured, ...rest] = POSTS;
  return (
    <PromoShell>
      <Hero
        badge="블로그 · 입시 인사이트"
        title="입시정보를 똑똑하게 쓰는 법"
        body="정보 과부하 없이 맞춤 입시정보를 활용하는 노하우와 최신 인사이트를 전합니다."
      />
      <div
        style={{
          marginTop: 20,
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 22,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{featured.category}</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: INK, margin: '8px 0' }}>{featured.title}</h2>
        <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.7 }}>{featured.excerpt}</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>{featured.date}</p>
      </div>
      <SectionTitle>최근 글</SectionTitle>
      <Grid>
        {rest.map((p) => (
          <div key={p.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{p.category}</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, margin: '6px 0' }}>{p.title}</h3>
            <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.6 }}>{p.excerpt}</p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{p.date}</p>
          </div>
        ))}
      </Grid>
    </PromoShell>
  );
}

// ───────────────────────── 라우트 정의 ─────────────────────────
export const promoIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/promo',
  component: PromoHome,
});
export const promoGuideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/promo/guide',
  component: PromoGuide,
});
export const promoBlogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/promo/blog',
  component: PromoBlog,
});
