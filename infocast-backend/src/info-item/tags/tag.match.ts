import { TagSet } from './tag.types';

/** 요청된 태그 필터(부분). 각 필드 누락/빈배열 = 해당 차원 무시. */
export interface TagQuery {
  grades?: (number | string)[];
  tracks?: string[];
  regions?: string[];
  admissionTypes?: string[];
  curricula?: string[];
}

/** 콤마구분 문자열 → 배열. */
export function splitCsv(v?: string): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 한 차원 매칭 규칙:
 * - 요청 필터가 비어 있으면(이 차원 무시) → 통과.
 * - 아이템 태그가 비어 있으면(제한 없음 = 전체 대상) → 통과.
 * - 둘 다 값이 있으면 교집합이 있어야 통과.
 * 이 규칙은 Phase 2 사용자-매칭에서도 동일하게 재사용한다.
 */
function dimMatches(itemValues: (string | number)[], queryValues: (string | number)[]): boolean {
  if (queryValues.length === 0) return true;
  if (itemValues.length === 0) return true;
  const set = new Set(itemValues.map(String));
  return queryValues.some((q) => set.has(String(q)));
}

/** 정규화된 아이템 TagSet 이 요청 필터를 만족하는지. */
export function itemMatchesQuery(tags: TagSet, query: TagQuery): boolean {
  return (
    dimMatches(tags.grades, query.grades ?? []) &&
    dimMatches(tags.tracks, query.tracks ?? []) &&
    dimMatches(tags.regions, query.regions ?? []) &&
    dimMatches(tags.admissionTypes, query.admissionTypes ?? []) &&
    dimMatches(tags.curricula, query.curricula ?? [])
  );
}

/** 차원별 가중치 (정형 태그 우선 — 전형·계열을 학년·지역보다 무겁게). */
const DIM_WEIGHTS = {
  admissionTypes: 3,
  tracks: 3,
  curricula: 2,
  grades: 2,
  regions: 1,
} as const;

function dimScore(
  itemValues: (string | number)[],
  queryValues: (string | number)[],
  weight: number,
): number {
  if (queryValues.length === 0) return 0; // 사용자가 관심 안 둔 차원
  if (itemValues.length === 0) return weight * 0.4; // 아이템이 전체 대상(약한 적합)
  const set = new Set(itemValues.map(String));
  return queryValues.some((q) => set.has(String(q))) ? weight : 0;
}

/**
 * 관련도 점수 (0~1 정규화). itemMatchesQuery 가 true 인 아이템에만 의미 있음.
 * 명시적 교집합일수록 높고, 아이템이 전체 대상(무제한)이면 약하게 가산.
 */
export function scoreMatch(tags: TagSet, query: TagQuery): number {
  const max =
    DIM_WEIGHTS.admissionTypes +
    DIM_WEIGHTS.tracks +
    DIM_WEIGHTS.curricula +
    DIM_WEIGHTS.grades +
    DIM_WEIGHTS.regions;
  const raw =
    dimScore(tags.admissionTypes, query.admissionTypes ?? [], DIM_WEIGHTS.admissionTypes) +
    dimScore(tags.tracks, query.tracks ?? [], DIM_WEIGHTS.tracks) +
    dimScore(tags.curricula, query.curricula ?? [], DIM_WEIGHTS.curricula) +
    dimScore(tags.grades, query.grades ?? [], DIM_WEIGHTS.grades) +
    dimScore(tags.regions, query.regions ?? [], DIM_WEIGHTS.regions);
  return Math.round((raw / max) * 1000) / 1000;
}
