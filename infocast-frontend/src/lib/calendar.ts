// 입시 캘린더 도메인 로직 — 순수 함수만. 날짜는 항상 KST(Asia/Seoul) 기준으로 다룬다.
// 서버는 UTC timestamptz를 주고, 화면은 한국 달력 날짜로 찍혀야 하므로
// Date의 로컬 타임존에 의존하지 않고 Intl로 'YYYY-MM-DD'를 뽑는다.

import { CATEGORIES } from './tags';

export const KST = 'Asia/Seoul';

/** 캘린더에 올라가는 일정 1건. ic_info_item에서 파생된다. */
export interface CalendarEvent {
  id: string;
  /** KST 기준 'YYYY-MM-DD' */
  date: string;
  title: string;
  body?: string;
  category: string;
  source?: string | null;
  url?: string | null;
  /** 내 프로파일/구독에 매칭된 일정인지 */
  personal: boolean;
  /**
   * '명시적으로 내 것'인 일정 — 내 학년이 대상으로 지정된 입시 일정이거나, 내 학교의 학사일정.
   * 전 학년 공용 일정(학년 태그 없음)은 여기서 제외된다. 히어로가 D-day 로 세울지 판단하는 기준.
   */
  own: boolean;
  reasons: string[];
  score?: number;
}

/** 캘린더 파생 대상이 되는 원본 정보 아이템(피드/전체 목록 공통 최소 형태). */
export interface InfoItemLike {
  id: string;
  title: string;
  body?: string;
  category: string;
  source?: string | null;
  url?: string | null;
  deadlineAt?: string | null;
  score?: number;
  reasons?: string[];
}

// ── 날짜 유틸 ────────────────────────────────────────────────

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** ISO 문자열/Date → KST 기준 'YYYY-MM-DD'. 파싱 불가면 null. */
export function toKstYmd(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return ymdFormatter.format(d); // en-CA = YYYY-MM-DD
}

/** 오늘(KST) 'YYYY-MM-DD'. */
export function todayYmd(): string {
  return ymdFormatter.format(new Date());
}

/** 'YYYY-MM-DD' → UTC 자정 기준 epoch ms (날짜 차이 계산 전용). */
function ymdToUtcMs(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const DAY_MS = 86_400_000;

/** from(기본 오늘)에서 target까지 남은 일수. 미래=양수, 과거=음수. */
export function daysUntil(target: string, from: string = todayYmd()): number {
  return Math.round((ymdToUtcMs(target) - ymdToUtcMs(from)) / DAY_MS);
}

/** D-18 / D-DAY / D+3 형태의 라벨. */
export function ddayLabel(target: string, from: string = todayYmd()): string {
  const n = daysUntil(target, from);
  if (n === 0) return 'D-DAY';
  return n > 0 ? `D-${n}` : `D+${Math.abs(n)}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** '2026-09-07' → '9월 7일 (월)' */
export function formatKoreanDate(ymd: string, withWeekday = true): string {
  const [, m, d] = ymd.split('-').map(Number);
  const label = `${m}월 ${d}일`;
  if (!withWeekday) return label;
  return `${label} (${WEEKDAYS[new Date(ymdToUtcMs(ymd)).getUTCDay()]})`;
}

export const WEEKDAY_LABELS = WEEKDAYS;

// ── 월(月) 유틸 ──────────────────────────────────────────────

/** 'YYYY-MM' 형태의 월 키. */
export type YearMonth = string;

export function toYearMonth(ymd: string): YearMonth {
  return ymd.slice(0, 7);
}

export function currentYearMonth(): YearMonth {
  return toYearMonth(todayYmd());
}

export function isYearMonth(value: string | undefined | null): value is YearMonth {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** 월 키를 delta개월만큼 이동. */
export function shiftYearMonth(ym: YearMonth, delta: number): YearMonth {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  return `${ny}-${String(nm + 1).padStart(2, '0')}`;
}

export function formatYearMonth(ym: YearMonth): string {
  const [y, m] = ym.split('-').map(Number);
  return `${y}년 ${m}월`;
}

export interface MonthCell {
  ymd: string;
  /** 해당 월에 속하는 날짜인지(앞뒤 채움 칸 구분) */
  inMonth: boolean;
}

/**
 * 6주(42칸) 월 그리드. 일요일 시작.
 * 앞뒤 이웃 달 날짜를 채워 항상 고정 높이를 유지한다(레이아웃 시프트 방지).
 */
export function buildMonthGrid(ym: YearMonth): MonthCell[] {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = first.getTime() - first.getUTCDay() * DAY_MS;

  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start + i * DAY_MS);
    const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`;
    cells.push({ ymd, inMonth: d.getUTCMonth() === m - 1 });
  }
  return cells;
}

// ── 파생 · 집계 ──────────────────────────────────────────────

/** 학교 학사일정은 입시 카테고리와 별도 네임스페이스를 쓴다(백엔드 SchoolEventKind 와 일치). */
export const SCHOOL_CATEGORIES = [
  { value: 'SCHOOL_EXAM', label: '학교 시험' },
  { value: 'SCHOOL_EVENT', label: '학교 행사' },
  { value: 'SCHOOL_HOLIDAY', label: '방학·휴업' },
] as const;

export function isSchoolCategory(category: string): boolean {
  return category.startsWith('SCHOOL_');
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries([
  ...CATEGORIES.map((c) => [c.value, c.label]),
  ...SCHOOL_CATEGORIES.map((c) => [c.value, c.label]),
]);

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * 정보 아이템 → 캘린더 이벤트.
 * 규칙: deadlineAt이 있는 항목만 일정이 된다(기획서 §2.1).
 */
export function toCalendarEvent(item: InfoItemLike, personal: boolean): CalendarEvent | null {
  const date = toKstYmd(item.deadlineAt);
  if (!date) return null;
  return {
    id: item.id,
    date,
    title: item.title,
    body: item.body,
    category: item.category,
    source: item.source,
    url: item.url,
    personal,
    // 매칭 엔진이 붙여 주는 사유. '학년 일치'는 내 학년이 명시적 대상이라는 뜻이다.
    own: (item.reasons ?? []).includes('학년 일치'),
    reasons: item.reasons ?? [],
    score: item.score,
  };
}

/**
 * 내 일정 + 전체 일정 병합. 같은 id는 personal 쪽을 우선한다.
 * 정렬: 날짜 → personal → score → 제목.
 */
export function mergeEvents(mine: InfoItemLike[], all: InfoItemLike[] = []): CalendarEvent[] {
  const byId = new Map<string, CalendarEvent>();

  for (const item of all) {
    const ev = toCalendarEvent(item, false);
    if (ev) byId.set(ev.id, ev);
  }
  for (const item of mine) {
    const ev = toCalendarEvent(item, true);
    if (ev) byId.set(ev.id, ev);
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      Number(b.personal) - Number(a.personal) ||
      (b.score ?? 0) - (a.score ?? 0) ||
      a.title.localeCompare(b.title),
  );
}

/** 날짜(YYYY-MM-DD) → 그 날 일정들. */
export function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.date);
    if (list) list.push(ev);
    else map.set(ev.date, [ev]);
  }
  return map;
}

/** 오늘 이후(오늘 포함) 일정만 가까운 순으로. */
export function upcomingEvents(
  events: CalendarEvent[],
  limit?: number,
  from: string = todayYmd(),
): CalendarEvent[] {
  const list = events.filter((e) => e.date >= from);
  return limit == null ? list : list.slice(0, limit);
}

export function eventsInMonth(events: CalendarEvent[], ym: YearMonth): CalendarEvent[] {
  return events.filter((e) => toYearMonth(e.date) === ym);
}

/** 일정이 있는 달 중 기준월에서 가장 가까운 달(빈 상태 점프용). */
export function nearestMonthWithEvents(
  events: CalendarEvent[],
  ym: YearMonth,
): YearMonth | null {
  const months = [...new Set(events.map((e) => toYearMonth(e.date)))];
  if (months.length === 0) return null;
  const key = (v: YearMonth) => {
    const [y, m] = v.split('-').map(Number);
    return y * 12 + m;
  };
  const base = key(ym);
  return months.sort((a, b) => Math.abs(key(a) - base) - Math.abs(key(b) - base))[0];
}
