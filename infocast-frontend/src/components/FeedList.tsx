import { categoryLabel } from '../lib/calendar';

export interface FeedItem {
  id: string;
  title: string;
  body: string;
  category: string;
  source?: string | null;
  url?: string | null;
  deadlineAt?: string | null;
  score?: number;
  reasons?: string[];
}

interface Props {
  items: FeedItem[];
  /** 요약 모드: 본문 줄임 */
  compact?: boolean;
}

export function FeedList({ items, compact = false }: Props) {
  return (
    <ul className="feed__list">
      {items.map((item) => (
        <li key={item.id} className="feed__item">
          <div className="feed__meta">
            <span className="feed__category">{categoryLabel(item.category)}</span>
            {(item.reasons ?? []).map((r) => (
              <span key={r} className="feed__reason">
                {r}
              </span>
            ))}
          </div>
          <h2>{item.title}</h2>
          {!compact && <p>{item.body}</p>}
          <div className="evt__foot">
            {item.source && <small className="muted">출처: {item.source}</small>}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="app__link">
                원문 보기
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
