/**
 * 2027학년도 입시 일정 시드.
 *
 *   yarn seed:calendar          # DRY-RUN: DB 대상과 before/after 확인, 쓰지 않음
 *   yarn seed:calendar --apply  # 검증 후 하나의 트랜잭션으로 적재(upsert)
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
    /** 이 시드가 대체하는 기존 출처명 (여러 개면 배열) */
    replacesSource?: string | string[];
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

/** 외부 스키마는 별도 연결의 읽기 전용 트랜잭션에서 신원 확인에만 사용한다. */
async function verifyReferenceCounts() {
  const readonlyUrl = process.env.DATABASE_READONLY_URL;
  if (!readonlyUrl) throw new Error('신원 검증용 DATABASE_READONLY_URL이 필요합니다.');
  const writer = new URL(process.env.DATABASE_URL!);
  const reader = new URL(readonlyUrl);
  if (
    writer.host !== reader.host ||
    writer.pathname !== reader.pathname ||
    writer.searchParams.get('host') !== reader.searchParams.get('host') ||
    writer.username === reader.username
  ) {
    throw new Error('읽기 전용 연결은 동일 서버/DB의 별도 계정이어야 합니다.');
  }
  const gate = new PrismaClient({ datasources: { db: { url: readonlyUrl } } });
  try {
    await gate.$transaction(
      async (tx) => {
        const identity = await tx.$queryRaw<
          { database: string; port: number | null; version: string }[]
        >`SELECT current_database() AS database, inet_server_port() AS port, version()`;
        console.log('Read-only DB identity:', identity);
        if (
          identity[0]?.database !== 'geobukschool_prod' ||
          !/PostgreSQL 14\..*x86_64-pc-linux-gnu/.test(identity[0]?.version ?? '')
        ) {
          throw new Error('읽기 전용 DB 신원 불일치');
        }
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const formulas = await tx.$queryRaw<
          { count: bigint }[]
        >`SELECT count(*) FROM susi.susi_calculation_formula`;
        const units = await tx.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM susi.susi_unit`;
        console.log('DB gate:', {
          formulas: String(formulas[0].count),
          units: String(units[0].count),
        });
        if (Number(formulas[0].count) !== 1267 || Number(units[0].count) !== 33770) {
          throw new Error('운영 DB 기준 행 수 불일치 — 적재 중단');
        }
      },
      { timeout: 30_000 },
    );
  } finally {
    await gate.$disconnect();
  }
}

async function loadAndSeed(db: Prisma.TransactionClient, fileName: string, dry: boolean) {
  const seed = JSON.parse(readFileSync(join(__dirname, fileName), 'utf-8')) as SeedFile;
  const primary = seed.meta.sources[0];
  const sorted = [...seed.items].sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));

  console.log(`\n▸ ${fileName} — ${seed.meta.scope}`);
  console.log(`  ${sorted.length}건 · 출처: ${primary.name}`);

  for (const item of sorted) {
    const when = new Date(item.deadlineAt);
    if (Number.isNaN(when.getTime())) throw new Error(`잘못된 날짜: ${item.id} ${item.deadlineAt}`);

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

    if (dry) {
      const before = await db.infoItem.findUnique({ where: { id: item.id } });
      const fields = Object.keys(common) as (keyof typeof common)[];
      const changes = fields.filter(
        (key) => JSON.stringify(before?.[key]) !== JSON.stringify(common[key]),
      );
      console.log(
        JSON.stringify({
          id: item.id,
          action: before ? 'update' : 'create',
          before: before ? Object.fromEntries(changes.map((key) => [key, before[key]])) : null,
          after: Object.fromEntries(changes.map((key) => [key, common[key]])),
        }),
      );
      continue;
    }

    await db.infoItem.upsert({
      where: { id: item.id },
      create: { id: item.id, publishedAt: new Date(), ...common },
      update: common,
    });
  }

  let archived = 0;
  if (seed.meta.replacesSource) {
    // 교체된 출처의 잔존 항목 정리 — 삭제하지 않고 ARCHIVED 로 내려 이력을 남긴다.
    const where: Prisma.InfoItemWhereInput = {
      source: { in: ([] as string[]).concat(seed.meta.replacesSource) },
      status: ItemStatus.APPROVED,
      id: { notIn: sorted.map((i) => i.id) },
    };
    const candidates = await db.infoItem.findMany({
      where,
      select: { id: true, title: true, status: true },
    });
    if (dry) {
      archived = candidates.length;
      for (const item of candidates)
        console.log(
          JSON.stringify({
            id: item.id,
            title: item.title,
            before: item.status,
            after: ItemStatus.ARCHIVED,
          }),
        );
    } else {
      const result = await db.infoItem.updateMany({
        where,
        data: { status: ItemStatus.ARCHIVED },
      });
      archived = result.count;
    }
    if (archived > 0) {
      console.log(
        `  ↓ 교체된 출처('${([] as string[]).concat(seed.meta.replacesSource).join("', '")}') 잔존 ${archived}건을 ARCHIVED 처리`,
      );
    }
  }

  if (!dry) console.log(`  ✓ ${sorted.length}건 적재 완료`);
  return { count: sorted.length, archived, disclaimer: seed.meta.disclaimer };
}

async function main() {
  const args = process.argv.slice(2);
  if (
    args.some((arg) => !['--dry', '--apply'].includes(arg)) ||
    (args.includes('--dry') && args.includes('--apply'))
  ) {
    throw new Error('사용법: yarn seed:calendar [--dry | --apply]');
  }
  const dry = !args.includes('--apply');
  const identity = await prisma.$queryRaw<
    { database: string; port: number; version: string }[]
  >`SELECT current_database() AS database, inet_server_port() AS port, version()`;
  console.log('DB identity:', identity);
  if (
    identity[0]?.database !== 'geobukschool_prod' ||
    !/PostgreSQL 14\..*x86_64-pc-linux-gnu/.test(identity[0]?.version ?? '')
  ) {
    throw new Error('운영 DB 신원 불일치 — 적재 중단');
  }
  await verifyReferenceCounts();
  console.log(dry ? 'DRY-RUN (rollback)' : 'APPLY (transaction)');
  let total = 0;
  let archivedTotal = 0;
  const notes: string[] = [];

  const rollback = new Error('DRY_RUN_ROLLBACK');
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const file of FILES) {
          const r = await loadAndSeed(tx, file, dry);
          total += r.count;
          archivedTotal += r.archived;
          notes.push(r.disclaimer);
        }
        if (dry) throw rollback;
      },
      { timeout: 180_000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }

  console.log(`\n총 ${total}건 ${dry ? '(dry run — 적재하지 않음)' : '적재 완료'}`);
  if (archivedTotal > 0) console.log(`교체로 내려간 항목 ${archivedTotal}건 (ARCHIVED)`);
  for (const n of new Set(notes)) console.log(`※ ${n}`);
}

main()
  .catch((e) => {
    console.error(
      e instanceof Error
        ? e.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[REDACTED_DATABASE_URL]')
        : 'Seed failed',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
