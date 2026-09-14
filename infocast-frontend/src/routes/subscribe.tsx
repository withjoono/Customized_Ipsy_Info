import { createRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { ADMISSION_TYPES, REGIONS, TRACKS } from '../lib/tags';
import { UNIVERSITIES } from '../lib/universities';

interface Subscription {
  interests?: {
    regions?: string[];
    tracks?: string[];
    admissionTypes?: string[];
    universities?: string[];
  };
  channels?: { kakao?: boolean; sms?: boolean; push?: boolean; email?: boolean };
  frequency?: 'REALTIME' | 'DAILY' | 'WEEKLY';
  quietStart?: number | null;
  quietEnd?: number | null;
  enabled?: boolean;
}

const CHANNELS = [
  { key: 'kakao', label: '카카오' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: '푸시' },
  { key: 'email', label: '이메일' },
] as const;

const FREQUENCIES = [
  { value: 'REALTIME', label: '실시간' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '매주' },
] as const;

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Subscribe() {
  const { token, loginRedirect } = useAuth();
  const qc = useQueryClient();

  const [regions, setRegions] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [uniQuery, setUniQuery] = useState('');
  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [frequency, setFrequency] = useState<'REALTIME' | 'DAILY' | 'WEEKLY'>('DAILY');
  const [quietStart, setQuietStart] = useState<string>('');
  const [quietEnd, setQuietEnd] = useState<string>('');
  const [enabled, setEnabled] = useState(true);

  const sub = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/me');
      return (res.data?.data ?? res.data) as Subscription | null;
    },
    enabled: !!token,
  });

  useEffect(() => {
    const s = sub.data;
    if (!s) return;
    setRegions(s.interests?.regions ?? []);
    setTracks(s.interests?.tracks ?? []);
    setAdmissionTypes(s.interests?.admissionTypes ?? []);
    setUniversities(s.interests?.universities ?? []);
    setChannels((s.channels as Record<string, boolean>) ?? {});
    setFrequency(s.frequency ?? 'DAILY');
    setQuietStart(s.quietStart != null ? String(s.quietStart) : '');
    setQuietEnd(s.quietEnd != null ? String(s.quietEnd) : '');
    setEnabled(s.enabled ?? true);
  }, [sub.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        interests: { regions, tracks, admissionTypes, universities },
        channels,
        frequency,
        quietStart: quietStart === '' ? undefined : Number(quietStart),
        quietEnd: quietEnd === '' ? undefined : Number(quietEnd),
        enabled,
      };
      return api.put('/subscriptions/me', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['subscription', 'me'] });
      void qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  if (!token) {
    return (
      <section className="empty">
        <p className="eyebrow">STAY UPDATED</p>
        <h1>내게 필요한 소식만 받아보세요</h1>
        <p>로그인 후 관심 대학·전형과 알림 주기를 설정할 수 있어요.</p>
        <button onClick={loginRedirect}>T스쿨로 시작하기</button>
      </section>
    );
  }

  if (sub.isLoading) return <section className="empty" role="status"><h1>구독 설정</h1><p>저장된 관심사를 불러오고 있어요…</p></section>;
  if (sub.error) return <section className="empty"><h1>구독 설정을 불러오지 못했어요</h1><p>잠시 후 다시 시도해 주세요.</p><button onClick={() => void sub.refetch()}>다시 불러오기</button></section>;

  return (
    <section className="admin">
      <h1>구독 설정</h1>
      <p className="muted">학년·교육과정은 입시 프로파일에서 자동 반영됩니다. 관심사만 고르세요.</p>

      <form
        className="admin__form"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <fieldset className="admin__tags">
          <legend>관심 태그</legend>
          <div className="admin__taggroup">
            <span className="admin__taglabel">전형</span>
            <div className="admin__chips">
              {ADMISSION_TYPES.map((a) => (
                <button
                  type="button"
                  key={a.value}
                  className={`chip${admissionTypes.includes(a.value) ? ' chip--on' : ''}`}
                  onClick={() => setAdmissionTypes((s) => toggle(s, a.value))}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin__taggroup">
            <span className="admin__taglabel">계열</span>
            <div className="admin__chips">
              {TRACKS.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  className={`chip${tracks.includes(t.value) ? ' chip--on' : ''}`}
                  onClick={() => setTracks((s) => toggle(s, t.value))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin__taggroup">
            <span className="admin__taglabel">대학</span>
            <div className="uni">
              {universities.length > 0 && (
                <div className="admin__chips">
                  {universities.map((u) => (
                    <button
                      type="button"
                      key={u}
                      className="chip chip--on"
                      onClick={() => setUniversities((s) => s.filter((x) => x !== u))}
                      aria-label={`${u} 선택 해제`}
                    >
                      {u} ×
                    </button>
                  ))}
                </div>
              )}
              <input
                type="search"
                className="uni__search"
                value={uniQuery}
                onChange={(e) => setUniQuery(e.target.value)}
                placeholder="대학명 검색 (예: 고려, 한양)"
                aria-label="관심 대학 검색"
              />
              {uniQuery.trim() && (
                <div className="uni__results admin__chips">
                  {UNIVERSITIES.filter(
                    (u) => u.includes(uniQuery.trim()) && !universities.includes(u),
                  )
                    .slice(0, 20)
                    .map((u) => (
                      <button
                        type="button"
                        key={u}
                        className="chip"
                        onClick={() => {
                          setUniversities((s) => [...s, u]);
                          setUniQuery('');
                        }}
                      >
                        + {u}
                      </button>
                    ))}
                  {UNIVERSITIES.filter(
                    (u) => u.includes(uniQuery.trim()) && !universities.includes(u),
                  ).length === 0 && <span className="muted">일치하는 대학이 없어요.</span>}
                </div>
              )}
              <p className="muted">
                관심 대학을 고르면 그 대학의 면접일·합격자 발표일이 캘린더 맨 위로 올라옵니다.
              </p>
            </div>
          </div>
          <div className="admin__taggroup">
            <span className="admin__taglabel">지역</span>
            <div className="admin__chips">
              {REGIONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`chip${regions.includes(r) ? ' chip--on' : ''}`}
                  onClick={() => setRegions((s) => toggle(s, r))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="admin__tags">
          <legend>알림 채널</legend>
          <div className="admin__chips">
            {CHANNELS.map((c) => (
              <button
                type="button"
                key={c.key}
                className={`chip${channels[c.key] ? ' chip--on' : ''}`}
                onClick={() => setChannels((s) => ({ ...s, [c.key]: !s[c.key] }))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="admin__row">
          <label>
            빈도
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            방해금지 시작 (0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </label>
          <label>
            방해금지 끝 (0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </label>
        </div>

        <label className="admin__inline">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          알림 받기
        </label>

        <button type="submit" disabled={saveMut.isPending}>
          {saveMut.isPending ? '저장 중…' : '저장'}
        </button>
        {saveMut.isSuccess && <p className="muted">저장되었습니다.</p>}
        {saveMut.isError && <p className="admin__error">저장 실패 — 입력값을 확인하세요.</p>}
      </form>
    </section>
  );
}

export const subscribeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscribe',
  component: Subscribe,
});
