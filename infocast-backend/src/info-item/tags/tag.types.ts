// 입시정보 태깅 분류 체계 (ic_info_item.target_tags 에 jsonb 로 저장).
// DB enum 이 아니라 애플리케이션 레벨 분류 — 유연성 위해 jsonb 유지.

/** 교육과정 */
export type Curriculum = '2015' | '2022';
export const CURRICULA: Curriculum[] = ['2015', '2022'];

/** 계열 */
export enum Track {
  HUMANITIES = 'HUMANITIES', // 인문
  NATURAL = 'NATURAL', // 자연
  ARTS_SPORTS = 'ARTS_SPORTS', // 예체능
  COMMON = 'COMMON', // 공통/문이과 무관
}
export const TRACKS = Object.values(Track);

/** 전형유형 */
export enum AdmissionType {
  GYOGWA = 'GYOGWA', // 학생부교과
  JONGHAP = 'JONGHAP', // 학생부종합
  NONSUL = 'NONSUL', // 논술
  SILGI = 'SILGI', // 실기/실적
  JEONGSI = 'JEONGSI', // 정시(수능)
}
export const ADMISSION_TYPES = Object.values(AdmissionType);

/** 지역 — 17개 시·도 (광역 단위). */
export const REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;
export type Region = (typeof REGIONS)[number];

/** 학년: 1·2·3. 전 학년 대상이면 빈 배열(= 제한 없음). */
export type Grade = 1 | 2 | 3;
export const GRADES: Grade[] = [1, 2, 3];

/**
 * 정규화된 태그 집합.
 * 빈 배열/누락 = "제한 없음"(모든 값에 매칭). curriculum 누락 = 양 교육과정 모두.
 */
export interface TagSet {
  grades: Grade[];
  tracks: Track[];
  regions: Region[];
  admissionTypes: AdmissionType[];
  curricula: Curriculum[];
}

export const EMPTY_TAGSET: TagSet = {
  grades: [],
  tracks: [],
  regions: [],
  admissionTypes: [],
  curricula: [],
};

/** 저장된 jsonb 값을 TagSet 으로 안전 변환. */
export function toTagSet(raw: unknown): TagSet {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      grades: (r.grades as Grade[]) ?? [],
      tracks: (r.tracks as Track[]) ?? [],
      regions: (r.regions as Region[]) ?? [],
      admissionTypes: (r.admissionTypes as AdmissionType[]) ?? [],
      curricula: (r.curricula as Curriculum[]) ?? [],
    };
  }
  return { ...EMPTY_TAGSET };
}
