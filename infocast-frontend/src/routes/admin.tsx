import { createRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import {
  ADMISSION_TYPES,
  CATEGORIES,
  CURRICULA,
  GRADES,
  REGIONS,
  TRACKS,
} from '../lib/tags';

interface TagState {
  grades: number[];
  tracks: string[];
  regions: string[];
  admissionTypes: string[];
  curricula: string[];
}

const EMPTY_TAGS: TagState = {
  grades: [],
  tracks: [],
  regions: [],
  admissionTypes: [],
  curricula: [],
};

interface InfoItem {
  id: string;
  title: string;
  category: string;
  status: string;
  source?: string;
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Admin() {
  const { token, loginRedirect } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0].value);
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [tags, setTags] = useState<TagState>(EMPTY_TAGS);

  const list = useQuery({
    queryKey: ['admin', 'info-items'],
    queryFn: async () => {
      const res = await api.get('/info-items', { params: { take: 100 } });
      return (res.data?.data ?? res.data) as InfoItem[];
    },
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        body,
        category,
        source: source || undefined,
        url: url || undefined,
        deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
        targetTags: tags,
      };
      const res = await api.post('/info-items', payload);
      return res.data;
    },
    onSuccess: () => {
      setTitle('');
      setBody('');
      setSource('');
      setUrl('');
      setDeadlineAt('');
      setTags(EMPTY_TAGS);
      void qc.invalidateQueries({ queryKey: ['admin', 'info-items'] });
    },
  });

  const approveMut = useMutation({
    mutationFn: async (id: string) => api.patch(`/info-items/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'info-items'] }),
  });

  if (!token) {
    return (
      <section className="empty">
        <p>관리자 로그인이 필요합니다.</p>
        <button onClick={loginRedirect}>로그인</button>
      </section>
    );
  }

  return (
    <section className="admin">
      <h1>콘텐츠 입력 (관리자)</h1>

      <form
        className="admin__form"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <label>
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          본문
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
        </label>
        <label>
          분류
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="admin__row">
          <label>
            출처
            <input value={source} onChange={(e) => setSource(e.target.value)} />
          </label>
          <label>
            원문 URL
            <input value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <label>
            마감일
            <input
              type="date"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
            />
          </label>
        </div>

        <fieldset className="admin__tags">
          <legend>대상 태그 (비우면 전체 대상)</legend>

          <TagGroup label="학년">
            {GRADES.map((g) => (
              <Chip
                key={g}
                active={tags.grades.includes(g)}
                onClick={() => setTags((t) => ({ ...t, grades: toggle(t.grades, g) }))}
              >
                {g}학년
              </Chip>
            ))}
          </TagGroup>

          <TagGroup label="계열">
            {TRACKS.map((tk) => (
              <Chip
                key={tk.value}
                active={tags.tracks.includes(tk.value)}
                onClick={() => setTags((t) => ({ ...t, tracks: toggle(t.tracks, tk.value) }))}
              >
                {tk.label}
              </Chip>
            ))}
          </TagGroup>

          <TagGroup label="전형">
            {ADMISSION_TYPES.map((a) => (
              <Chip
                key={a.value}
                active={tags.admissionTypes.includes(a.value)}
                onClick={() =>
                  setTags((t) => ({ ...t, admissionTypes: toggle(t.admissionTypes, a.value) }))
                }
              >
                {a.label}
              </Chip>
            ))}
          </TagGroup>

          <TagGroup label="교육과정">
            {CURRICULA.map((c) => (
              <Chip
                key={c}
                active={tags.curricula.includes(c)}
                onClick={() => setTags((t) => ({ ...t, curricula: toggle(t.curricula, c) }))}
              >
                {c}
              </Chip>
            ))}
          </TagGroup>

          <TagGroup label="지역">
            {REGIONS.map((r) => (
              <Chip
                key={r}
                active={tags.regions.includes(r)}
                onClick={() => setTags((t) => ({ ...t, regions: toggle(t.regions, r) }))}
              >
                {r}
              </Chip>
            ))}
          </TagGroup>
        </fieldset>

        <button type="submit" disabled={createMut.isPending}>
          {createMut.isPending ? '저장 중…' : '정보 등록 (DRAFT)'}
        </button>
        {createMut.isError && <p className="admin__error">등록 실패 — 권한·입력값을 확인하세요.</p>}
      </form>

      <h2>등록된 정보</h2>
      {list.isLoading ? (
        <p>불러오는 중…</p>
      ) : (
        <table className="admin__table">
          <thead>
            <tr>
              <th>제목</th>
              <th>분류</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.status}</td>
                <td>
                  {item.status === 'DRAFT' && (
                    <button onClick={() => approveMut.mutate(item.id)}>승인</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TagGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin__taggroup">
      <span className="admin__taglabel">{label}</span>
      <div className="admin__chips">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`chip${active ? ' chip--on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: Admin,
});
