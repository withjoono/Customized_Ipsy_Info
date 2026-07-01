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
} from './tag.types';

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
    };
  }

  private static asArray(v: unknown): unknown[] {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }

  private static dedupe<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  private static normGrades(v: unknown): Grade[] {
    const out: Grade[] = [];
    for (const item of this.asArray(v)) {
      const n = Number(item);
      if (!GRADES.includes(n as Grade)) {
        throw new BadRequestException(`잘못된 학년: ${String(item)} (1·2·3만 허용)`);
      }
      out.push(n as Grade);
    }
    return this.dedupe(out).sort();
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
