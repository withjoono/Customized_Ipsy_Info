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

/**
 * 대학명 — 화이트리스트 없이 자유 문자열(캠퍼스 포함 표기: '고려대(세종)').
 * 신설·개명 대학이 계속 생기므로 enum 으로 고정하지 않는다. 정규화는 공백 제거뿐.
 */
export type University = string;

/**
 * 학년: 1·2·3 + 재수생('N'). 전 학년 대상이면 빈 배열(= 제한 없음).
 * 'N'(N수생/졸업생)은 고3과 같은 사이클을 지원하지만 경로가 다르다 —
 * 생기부 마감·학교 학력평가는 무관하고, 수능 원서는 시험지구에 개별 접수한다.
 */
export type Grade = 1 | 2 | 3 | 'N';
export const GRADES: Grade[] = [1, 2, 3, 'N'];
/** 올해 대입에 실제로 지원하는 집단 — 원서접수·면접·발표 일정의 기본 대상. */
export const APPLICANT_GRADES: Grade[] = [3, 'N'];

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
  /** 대상 대학(대학별 면접·발표 일정용). 빈 배열 = 대학 무관(전체 대상). */
  universities: University[];
}

export const EMPTY_TAGSET: TagSet = {
  grades: [],
  tracks: [],
  regions: [],
  admissionTypes: [],
  curricula: [],
  universities: [],
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
      universities: (r.universities as University[]) ?? [],
    };
  }
  return { ...EMPTY_TAGSET };
}
