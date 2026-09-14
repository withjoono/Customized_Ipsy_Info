import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { FeedList, type FeedItem } from '../components/FeedList';

function Feed() {
  const { token, loginRedirect } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['matches', 'me'],
    queryFn: async () => {
      const res = await api.get('/matches/me');
      return (res.data?.data ?? res.data) as FeedItem[];
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <section className="empty">
        <h1>내 입시정보 피드</h1>
        <p>성적·생기부·상황에 맞춘 최신 입시정보를 받아보세요.</p>
        <button onClick={loginRedirect}>로그인하고 시작하기</button>
      </section>
    );
  }

  if (isLoading) return <p className="muted">맞춤 정보를 고르는 중…</p>;
  if (error) return <p className="admin__error">정보를 불러오지 못했습니다.</p>;

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <section className="empty">
        <p>아직 맞춤 정보가 없습니다.</p>
        <Link to="/subscribe" className="app__link">
          관심사를 설정하면 더 정확해져요 →
        </Link>
      </section>
    );
  }

  return (
    <section className="feed">
      <div className="feed__head">
        <h1>내 입시정보 피드</h1>
        <Link to="/subscribe" className="app__link">
          구독 설정
        </Link>
      </div>
      <FeedList items={items} />
    </section>
  );
}

export const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: Feed,
});
