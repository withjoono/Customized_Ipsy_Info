import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

/**
 * Hub SSO 콜백.
 * Hub가 ?code=<sso_code> 로 리다이렉트 → backend /auth/sso/exchange 로 교환 → 세션 저장.
 */
function AuthCallback() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const [status, setStatus] = useState<'pending' | 'error'>('pending');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setStatus('error');
      return;
    }

    api
      .post('/auth/sso/exchange', { code })
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setSession(payload.accessToken, payload.user);
        navigate({ to: '/' });
      })
      .catch(() => setStatus('error'));
  }, [navigate, setSession]);

  if (status === 'error') {
    return (
      <section className="empty">
        <p>로그인에 실패했습니다.</p>
        <button onClick={() => navigate({ to: '/' })}>홈으로</button>
      </section>
    );
  }

  return <p>로그인 처리 중…</p>;
}

export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallback,
});
