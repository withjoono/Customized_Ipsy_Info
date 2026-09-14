import { Footer } from "../components/footer";
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '../store/auth';

function RootLayout() {
  const { user, logout, loginRedirect } = useAuth();

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">본문으로 바로가기</a>
      <header className="app__header">
        <Link to="/" className="app__brand">
          <span className="brand-mark" aria-hidden="true">T<span>·</span></span>
          <span>맞춤정보<small>BY TSKOOL</small></span>
        </Link>
        <nav className="app__nav" aria-label="주 메뉴">
          <Link to="/" className="app__link" activeOptions={{ exact: true }}>대시보드</Link>
          <Link to="/schedule" className="app__link">
            전체 일정
          </Link>
          <Link to="/feed" className="app__link">맞춤 피드</Link>
          <Link to="/subscribe" className="app__link">구독 설정</Link>
          {user ? (
            <>
              <Link to="/calendar" className="app__link">
                캘린더
              </Link>
              <Link to="/admin" className="app__link">
                관리자
              </Link>
              <span className="app__user">{user.name ?? user.email ?? user.id}</span>
              <button onClick={logout}>로그아웃</button>
            </>
          ) : (
            <button onClick={loginRedirect} className="header-login">T스쿨 로그인 <span aria-hidden="true">↗</span></button>
          )}
        </nav>
      </header>
      <main id="main-content" className="app__main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const rootRoute = createRootRoute({ component: RootLayout });
