/**
 * 2027학년도 입시 일정 시드.
 *
 *   yarn seed:calendar        # 적재(upsert)
 *   yarn seed:calendar --dry  # 적재 없이 목록만 출력
 *
 * 적재 대상
 *   · calendar-2027.json      — 전체 일정(원서접수·수능·등록 등). 대부분 태그 없음 = 전 사용자 대상
 *   · interview-2027.json     — 대학별 수시 면접고사(대교협 공식). 대학·지역 태그로 개인화
 *   · announcement-2027.json  — 대학별 수시 합격자 발표일
 *   · stage1-2027.json        — 대학별 수시 1단계 합격자 발표일. 수시 DB(susi.susi_schedule_event)에서 생성
 *                               — 원본: Susi/2027_susi/일정DB/export_2027.py (직접 수정 금지, 재생성할 것)
 *   · exam-2027.json          — 학력평가·모의평가·수능 응시원서. 항목마다 대상 학년이 다르다
 *
 * 규칙
 *   · id 를 고정 UUID 로 박아 두어 재실행해도 중복 생성되지 않는다(upsert).
 *   · 기간 일정은 시작일에 배치하고 본문에 전체 기간을 표기한다(현 스키마는 시점 1개만 표현).
 *   · targetTags 는 TagNormalizer 를 거치지 않고 그대로 저장하므로 JSON 쪽 값이 canonical 이어야 한다.
 *   · 출처는 파일 단위(meta.sources[0])가 기본이고, 항목이 source/url 을 직접 가지면 그쪽이 우선한다.
 *   · meta.replacesSource 가 있으면, 그 출처로 들어가 있던 기존 항목 중 이번 시드에 없는 것을
 *     ARCHIVED 로 내린다(출처를 더 신뢰할 수 있는 자료로 교체할 때 쓴다).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { InfoCategory, ItemStatus, PrismaClient, Prisma } from '@prisma/client';

interface SeedItem {
  id: string;
  title: string;
  body: string;
  category: keyof typeof InfoCategory;
  deadlineAt: string;
  targetTags?: Record<string, unknown>;
  /** 항목별 출처. 없으면 파일의 meta.sources[0] 을 쓴다. */
  source?: string;
  url?: string;
}

interface SeedFile {
  meta: {
    schoolYear: string;
    scope: string;
    sources: { name: string; url: string }[];
    disclaimer: string;
    /** 이 시드가 대체하는 기존 출처명 */
    replacesSource?: string;
  };
  items: SeedItem[];
}

const FILES = [
  'calendar-2027.json',
  'interview-2027.json',
  'announcement-2027.json',
  'stage1-2027.json',
  'exam-2027.json',
];

const prisma = new PrismaClient();

async function loadAndSeed(fileName: string, dry: boolean) {
  const seed = JSON.parse(readFileSync(join(__dirname, fileName), 'utf-8')) as SeedFile;
  const primary = seed.meta.sources[0];
  const sorted = [...seed.items].sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));

  console.log(`\n▸ ${fileName} — ${seed.meta.scope}`);
  console.log(`  ${sorted.length}건 · 출처: ${primary.name}`);

  for (const item of sorted) {
    const when = new Date(item.deadlineAt);
    if (Number.isNaN(when.getTime())) throw new Error(`잘못된 날짜: ${item.id} ${item.deadlineAt}`);

    if (dry) {
      console.log(`  [dry] ${item.deadlineAt.slice(0, 10)}  ${item.title}`);
      continue;
    }

    const common = {
      title: item.title,
      body: item.body,
      category: InfoCategory[item.category],
      source: item.source ?? primary.name,
      url: item.url ?? primary.url ?? null,
      targetTags: (item.targetTags ?? {}) as Prisma.InputJsonValue,
      deadlineAt: when,
      status: ItemStatus.APPROVED,
    };

    await prisma.infoItem.upsert({
      where: { id: item.id },
      create: { id: item.id, publishedAt: new Date(), ...common },
      update: common,
    });
  }

  let archived = 0;
  if (seed.meta.replacesSource && !dry) {
    // 교체된 출처의 잔존 항목 정리 — 삭제하지 않고 ARCHIVED 로 내려 이력을 남긴다.
    const result = await prisma.infoItem.updateMany({
      where: {
        source: seed.meta.replacesSource,
        status: ItemStatus.APPROVED,
        id: { notIn: sorted.map((i) => i.id) },
      },
      data: { status: ItemStatus.ARCHIVED },
    });
    archived = result.count;
    if (archived > 0) {
      console.log(`  ↓ 교체된 출처('${seed.meta.replacesSource}') 잔존 ${archived}건을 ARCHIVED 처리`);
    }
  }

  if (!dry) console.log(`  ✓ ${sorted.length}건 적재 완료`);
  return { count: sorted.length, archived, disclaimer: seed.meta.disclaimer };
}

async function main() {
  const dry = process.argv.includes('--dry');
  let total = 0;
  let archivedTotal = 0;
  const notes: string[] = [];

  for (const file of FILES) {
    const r = await loadAndSeed(file, dry);
    total += r.count;
    archivedTotal += r.archived;
    notes.push(r.disclaimer);
  }

  console.log(`\n총 ${total}건 ${dry ? '(dry run — 적재하지 않음)' : '적재 완료'}`);
  if (archivedTotal > 0) console.log(`교체로 내려간 항목 ${archivedTotal}건 (ARCHIVED)`);
  for (const n of new Set(notes)) console.log(`※ ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
