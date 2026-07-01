import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

interface MatchedItem {
  id: string;
  title: string;
  body: string;
  category: string;
  source?: string | null;
  url?: string | null;
  deadlineAt?: string | null;
  score: number;
  reasons: string[];
}

function Feed() {
  const { token, loginRedirect } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['matches', 'me'],
    queryFn: async () => {
      const res = await api.get('/matches/me');
      return (res.data?.data ?? res.data) as MatchedItem[];
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <section className="empty">
        <h1>맞춤 입시정보 배달</h1>
        <p>성적·생기부·상황에 맞춘 최신 입시정보를 받아보세요.</p>
        <button onClick={loginRedirect}>로그인하고 시작하기</button>
      </section>
    );
  }

  if (isLoading) return <p>맞춤 정보를 고르는 중…</p>;
  if (error) return <p>정보를 불러오지 못했습니다.</p>;

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <section className="empty">
        <p>아직 맞춤 정보가 없습니다.</p>
        <Link to="/subscribe">관심사를 설정하면 더 정확해져요 →</Link>
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
      <ul className="feed__list">
        {items.map((item) => (
          <li key={item.id} className="feed__item">
            <div className="feed__meta">
              <span className="feed__category">{item.category}</span>
              {item.reasons.map((r) => (
                <span key={r} className="feed__reason">
                  {r}
                </span>
              ))}
            </div>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            {item.source && <small>출처: {item.source}</small>}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer">
                원문 보기
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Feed,
});
