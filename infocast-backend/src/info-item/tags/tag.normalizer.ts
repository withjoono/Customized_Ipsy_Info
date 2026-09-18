import { BadRequestException } from '@nestjs/common';
import {
  AdmissionType,
  ADMISSION_TYPES,
  Curriculum,
  CURRICULA,
  EMPTY_TAGSET,
  Grade,
  GRADES,
  Region,
  REGIONS,
  TagSet,
  Track,
  TRACKS,
  University,
} from './tag.types';

/** 대학 태그 상한 — 실수로 수천 개가 들어오는 것 방지. */
const MAX_UNIVERSITIES = 200;
const MAX_UNIVERSITY_LEN = 40;

/** 임의 입력(부분/문자열)을 받아 canonical TagSet 으로 정규화한다. */
export class TagNormalizer {
  /** 지역 별칭 → canonical 시·도 */
  private static readonly REGION_ALIASES: Record<string, Region> = {
    서울특별시: '서울',
    부산광역시: '부산',
    대구광역시: '대구',
    인천광역시: '인천',
    광주광역시: '광주',
    대전광역시: '대전',
    울산광역시: '울산',
    세종특별자치시: '세종',
    경기도: '경기',
    강원도: '강원',
    강원특별자치도: '강원',
    충청북도: '충북',
    충청남도: '충남',
    전라북도: '전북',
    전북특별자치도: '전북',
    전라남도: '전남',
    경상북도: '경북',
    경상남도: '경남',
    제주도: '제주',
    제주특별자치도: '제주',
  };

  static normalize(raw: unknown): TagSet {
    if (raw == null) return { ...EMPTY_TAGSET };
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      throw new BadRequestException('targetTags 는 객체여야 합니다.');
    }
    const r = raw as Record<string, unknown>;

    return {
      grades: this.normGrades(r.grades),
      tracks: this.normEnum(r.tracks, TRACKS as Track[], 'tracks'),
      regions: this.normRegions(r.regions),
      admissionTypes: this.normEnum(
        r.admissionTypes,
        ADMISSION_TYPES as AdmissionType[],
        'admissionTypes',
      ),
      curricula: this.normCurricula(r.curricula),
      universities: this.normUniversities(r.universities),
    };
  }

  private static asArray(v: unknown): unknown[] {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  private static dedupe<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  /**
   * 재수생 별칭 → 'N'.
   * Hub 프로파일이 재수생을 어떤 값으로 내려줄지 규약이 아직 확정되지 않아,
   * 흔한 표현을 모두 흡수한다. 규약 확정 시 이 목록을 좁힐 것.
   */
  private static readonly REPEATER_ALIASES = new Set([
    'N', 'n', '재수', '재수생', 'N수', 'N수생', '졸업', '졸업생', '검정고시', '0', '4',
  ]);

  private static normGrades(v: unknown): Grade[] {
    const out: Grade[] = [];
    for (const item of this.asArray(v)) {
      const s = String(item).trim();
      if (this.REPEATER_ALIASES.has(s)) {
        out.push('N');
        continue;
      }
      const n = Number(s);
      if (!GRADES.includes(n as Grade)) {
        throw new BadRequestException(`잘못된 학년: ${s} (1·2·3 또는 재수생 N)`);
      }
      out.push(n as Grade);
    }
    return this.dedupe(out).sort((a, b) => String(a).localeCompare(String(b)));
  }

  private static normEnum<T extends string>(v: unknown, allowed: T[], field: string): T[] {
    const out: T[] = [];
    for (const item of this.asArray(v)) {
      const s = String(item).trim().toUpperCase() as T;
      if (!allowed.includes(s)) {
        throw new BadRequestException(`잘못된 ${field}: ${String(item)}`);
      }
      out.push(s);
    }
    return this.dedupe(out);
  }

  private static normRegions(v: unknown): Region[] {
    const out: Region[] = [];
    for (const item of this.asArray(v)) {
      const s = String(item).trim();
      const canonical = (REGIONS as readonly string[]).includes(s)
        ? (s as Region)
        : this.REGION_ALIASES[s];
      if (!canonical) {
        throw new BadRequestException(`잘못된 지역: ${s}`);
      }
      out.push(canonical);
    }
    return this.dedupe(out);
  }

  /**
   * 대학명 — 화이트리스트가 없으므로 형식만 검사한다.
   * 표기 흔들림('차 의과학대' / '차의과학대')을 막기 위해 공백을 모두 제거해 저장한다.
   */
  private static normUniversities(v: unknown): University[] {
    const out: University[] = [];
    for (const item of this.asArray(v)) {
      const s = String(item).replace(/\s+/g, '').trim();
      if (!s) continue;
      if (s.length > MAX_UNIVERSITY_LEN) {
        throw new BadRequestException(`대학명이 너무 깁니다: ${s.slice(0, 20)}…`);
      }
      out.push(s);
    }
    const deduped = this.dedupe(out);
    if (deduped.length > MAX_UNIVERSITIES) {
      throw new BadRequestException(`대학은 최대 ${MAX_UNIVERSITIES}개까지 선택할 수 있습니다.`);
    }
    return deduped.sort();
  }

  private static normCurricula(v: unknown): Curriculum[] {
    const out: Curriculum[] = [];
    for (const item of this.asArray(v)) {
      const s = String(item).trim() as Curriculum;
      if (!CURRICULA.includes(s)) {
        throw new BadRequestException(`잘못된 교육과정: ${String(item)} (2015·2022)`);
      }
      out.push(s);
    }
    return this.dedupe(out);
  }
}
