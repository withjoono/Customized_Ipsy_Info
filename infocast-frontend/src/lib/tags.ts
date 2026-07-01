// 백엔드 tag.types.ts 와 동일한 분류 (UI 옵션용).

export const CATEGORIES = [
  { value: 'GUIDELINE_CHANGE', label: '모집요강 변경' },
  { value: 'SCHEDULE', label: '원서접수/일정' },
  { value: 'COMPETITION_RATE', label: '경쟁률 속보' },
  { value: 'POLICY_NEWS', label: '정책·뉴스' },
  { value: 'BRIEFING', label: '대학 설명회' },
  { value: 'DEADLINE', label: '마감 임박' },
  { value: 'NEW_ADMISSION', label: '새 전형' },
] as const;

export const GRADES = [1, 2, 3] as const;

export const TRACKS = [
  { value: 'HUMANITIES', label: '인문' },
  { value: 'NATURAL', label: '자연' },
  { value: 'ARTS_SPORTS', label: '예체능' },
  { value: 'COMMON', label: '공통' },
] as const;

export const ADMISSION_TYPES = [
  { value: 'GYOGWA', label: '학생부교과' },
  { value: 'JONGHAP', label: '학생부종합' },
  { value: 'NONSUL', label: '논술' },
  { value: 'SILGI', label: '실기/실적' },
  { value: 'JEONGSI', label: '정시' },
] as const;

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const;

export const CURRICULA = ['2015', '2022'] as const;
