import { createRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rootRoute } from './root';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { ADMISSION_TYPES, REGIONS, TRACKS } from '../lib/tags';

interface Subscription {
  interests?: { regions?: string[]; tracks?: string[]; admissionTypes?: string[] };
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
    setChannels((s.channels as Record<string, boolean>) ?? {});
    setFrequency(s.frequency ?? 'DAILY');
    setQuietStart(s.quietStart != null ? String(s.quietStart) : '');
    setQuietEnd(s.quietEnd != null ? String(s.quietEnd) : '');
    setEnabled(s.enabled ?? true);
  }, [sub.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        interests: { regions, tracks, admissionTypes },
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
        <p>구독 설정을 위해 로그인하세요.</p>
        <button onClick={loginRedirect}>로그인</button>
      </section>
    );
  }

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
