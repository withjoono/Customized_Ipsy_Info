import { Grade } from '../info-item/tags/tag.types';

/**
 * 학생 아이디에서 학년을 파생한다.
 *
 * 규약: `26h3` = **2026학년도에 고3**. 아이디는 고정이고 해가 바뀌면 자동으로 나이를 먹는다.
 *   · `h1`·`h2`·`h3` = 고1·고2·고3
 *   · `h4` 이상 = 재수생(별도 표기)
 *   · 학년도가 지나면 승급하고, 고3을 넘기면 재수생('N')으로 본다.
 *     예) `26h3` 은 2027년 3월부터 재수생.
 *
 * Hub 프로파일의 `grade: number` 로는 재수생을 표현할 수 없으므로,
 * **아이디 파싱 결과를 Hub 값보다 우선**한다(학년도 정보까지 담고 있어 더 정확하다).
 */

/**
 * 아이디 어디에 있든 `26h3` 패턴을 찾는다(접두사·접미사 허용 — `26h3001` 같은 학번도 인식).
 * 앞쪽 숫자 경계는 막아 `2026h3` 처럼 4자리 연도를 쓴 값이 오탐되지 않게 한다.
 */
const ID_PATTERN = /(?<![0-9])(\d{2})h(\d)/i;

/** 아이디가 들어 있을 만한 JWT 클레임 후보. */
const ID_CLAIMS = ['sub', 'loginId', 'login_id', 'userId', 'user_id', 'username', 'studentId'];

/**
 * 학년도 경계는 3월이다. 2027년 1월의 `26h3` 은 아직 고3(정시 응시 중),
 * 2027년 3월부터 재수생이 된다.
 */
export function academicYear(now: Date = new Date()): number {
  // KST 기준으로 판정한다(서버 타임존에 의존하지 않도록).
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  return month >= 3 ? year : year - 1;
}

/** 아이디 문자열 하나에서 학년 파생. 패턴이 없으면 null. */
export function parseGradeFromId(id: string | undefined | null, now?: Date): Grade | null {
  if (!id) return null;
  const m = ID_PATTERN.exec(id);
  if (!m) return null;

  const cohortYear = 2000 + Number(m[1]);
  const code = Number(m[2]);
  if (code >= 4) return 'N'; // 재수생 전용 표기

  const delta = academicYear(now) - cohortYear;
  if (delta < 0) return code as Grade; // 미래 코호트 — 표기 그대로 신뢰
  const grade = code + delta;
  return grade > 3 ? 'N' : (grade as Grade);
}

/** JWT payload 의 여러 클레임을 훑어 학년을 찾는다. */
export function parseGradeFromClaims(
  payload: Record<string, unknown> | undefined,
  now?: Date,
): Grade | null {
  if (!payload) return null;

  for (const key of ID_CLAIMS) {
    const found = parseGradeFromId(
      typeof payload[key] === 'string' ? (payload[key] as string) : null,
      now,
    );
    if (found !== null) return found;
  }

  // 이메일은 로컬파트만 본다(도메인의 숫자 조합이 오탐되지 않도록).
  const email = typeof payload.email === 'string' ? payload.email.split('@')[0] : null;
  return parseGradeFromId(email, now);
}
