import { Injectable, Logger } from '@nestjs/common';
import { HubService, HubAcademicEvent } from '../hub/hub.service';

/** 학교 일정의 성격 — 입시 일정(InfoCategory)과 섞이지 않도록 별도 네임스페이스를 쓴다. */
export type SchoolEventKind = 'SCHOOL_EXAM' | 'SCHOOL_HOLIDAY' | 'SCHOOL_EVENT';

export interface SchoolCalendarEvent {
  id: string;
  /** KST 기준 YYYY-MM-DD */
  date: string;
  title: string;
  kind: SchoolEventKind;
  /** 행사명에서 학년을 읽어낸 경우만 채운다. 비어 있으면 전 학년 대상으로 본다. */
  grades: number[];
}

export interface SchoolCalendarResult {
  /** 학교 연동 여부. false 면 events 는 항상 빈 배열이다. */
  linked: boolean;
  schoolName: string | null;
  events: SchoolCalendarEvent[];
}

/**
 * 시험으로 볼 행사명 키워드.
 * '고사'는 중간고사·기말고사를 한 번에 잡지만 '모의고사'도 잡으므로 따로 두지 않는다.
 */
const EXAM_KEYWORDS = [
  '중간고사', '기말고사', '지필', '고사', '평가원', '학력평가', '모의평가', '수능', '수행평가',
];
const HOLIDAY_KEYWORDS = ['방학', '휴업', '공휴일', '재량', '개교기념'];

/** '1학년', '고1', '3학년 ...' 같은 표기에서 대상 학년을 읽는다. */
const GRADE_PATTERNS: [RegExp, number][] = [
  [/(?:^|[^0-9])1\s*학년|고\s*1/, 1],
  [/(?:^|[^0-9])2\s*학년|고\s*2/, 2],
  [/(?:^|[^0-9])3\s*학년|고\s*3/, 3],
];

@Injectable()
export class SchoolCalendarService {
  private readonly logger = new Logger(SchoolCalendarService.name);

  constructor(private readonly hub: HubService) {}

  async forMonth(userToken: string, year: number, month: number): Promise<SchoolCalendarResult> {
    let raw: HubAcademicEvent[];
    let schoolName: string | null = null;

    try {
      raw = await this.hub.getSchoolSchedule(userToken, year, month);
    } catch (err) {
      // 404 = 학교 미연동(Hub 규약). 그 외는 일시 장애로 보고 빈 결과를 준다.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        this.logger.warn(`학사일정 조회 실패(${status ?? 'network'}): ${(err as Error).message}`);
      }
      return { linked: false, schoolName: null, events: [] };
    }

    try {
      const school = await this.hub.getMySchool(userToken);
      schoolName = (school?.schoolName as string) ?? null;
    } catch {
      // 학교명은 표시용일 뿐이라 실패해도 일정은 그대로 내려준다.
    }

    return { linked: true, schoolName, events: raw.map((e) => this.normalize(e)) };
  }

  private normalize(e: HubAcademicEvent): SchoolCalendarEvent {
    const name = e.eventName.trim();
    return {
      // Hub 가 id 를 주지 않으므로 날짜+행사명으로 안정적인 키를 만든다.
      id: `school-${e.date}-${encodeURIComponent(name)}`,
      date: this.toIsoDate(e.date),
      title: name,
      kind: this.classify(name, e.isHoliday),
      grades: this.readGrades(name),
    };
  }

  private classify(name: string, isHoliday: boolean): SchoolEventKind {
    if (EXAM_KEYWORDS.some((k) => name.includes(k))) return 'SCHOOL_EXAM';
    if (isHoliday || HOLIDAY_KEYWORDS.some((k) => name.includes(k))) return 'SCHOOL_HOLIDAY';
    return 'SCHOOL_EVENT';
  }

  private readGrades(name: string): number[] {
    const out = GRADE_PATTERNS.filter(([re]) => re.test(name)).map(([, g]) => g);
    return out;
  }

  /** NEIS 는 YYYYMMDD 문자열을 준다. */
  private toIsoDate(ymd: string): string {
    return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  }
}
