import { Footer } from "../components/footer";
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '../store/auth';

function RootLayout() {
  const { user, logout, loginRedirect } = useAuth();

  return (
    <div className="app">
      <header className="app__header">
        <Link to="/" className="app__brand">
          <img src="https://www.tskool.kr/logo.png" alt="티스쿨 로고" width={40} height={40} />
          T맞춤정보
        </Link>
        <nav className="app__nav">
          {user ? (
            <>
              <Link to="/subscribe" className="app__link">
                구독
              </Link>
              <Link to="/admin" className="app__link">
                관리자
              </Link>
              <span className="app__user">{user.name ?? user.email ?? user.id}</span>
              <button onClick={logout}>로그아웃</button>
            </>
          ) : (
            <button onClick={loginRedirect}>로그인</button>
          )}
        </nav>
      </header>
      <main className="app__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const rootRoute = createRootRoute({ component: RootLayout });
