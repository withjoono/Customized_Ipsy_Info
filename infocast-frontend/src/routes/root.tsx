import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useAuth } from '../store/auth';

function RootLayout() {
  const { user, logout, loginRedirect } = useAuth();

  return (
    <div className="app">
      <header className="app__header">
        <Link to="/" className="app__brand">
          맞춤 입시정보
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
      <footer className="app__footer">
        입결·합격가능성은 추정이며 보장하지 않습니다. 출처를 확인하세요.
      </footer>
    </div>
  );
}

export const rootRoute = createRootRoute({ component: RootLayout });
