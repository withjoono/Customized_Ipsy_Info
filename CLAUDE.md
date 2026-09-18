# CLAUDE.md — Infocast (맞춤 입시정보 배달앱)

거북스쿨 생태계 위성앱. 작업 전 이 파일을 항상 먼저 읽는다. 전체 설계는 `docs/핸드오프-가이드.md`.

## 한 줄 정의
Hub 입시 프로파일(성적·생기부·상황)에 맞춰 최신 입시정보를 골라 **배달(push)** 하는 앱. 검색앱과 인증·개인화·스택·DB·배포는 공유, **콘텐츠 엔진(외부 수집 + 푸시)만 다름**.

## 모노레포 구조
- `infocast-backend/` — NestJS 10 + Prisma, 패키지 매니저 **yarn**, 포트 **4012**.
- `infocast-frontend/` — React 18 + Vite + TanStack Router + Zustand + TanStack Query, **npm**, 포트 **3012**.

## 절대 규칙 (가드레일)
1. **스키마 격리**: 본 앱은 `infocast` 스키마(prefix `ic_`)만 소유·마이그레이션. 다른 앱 스키마는 **쓰기 금지**, 읽기는 읽기전용 계정 + `$queryRaw` 격리만.
2. **Firebase 배포**: 항상 `firebase deploy --only hosting:infocast-front`. target 생략 금지(다른 앱 site 덮어쓰기 사고 이력).
3. **AUTH_JWT_SECRET**: 생태계 공유 Base64 값. 절대 변경/재발급 금지. `Buffer.from(secret,'base64')`로 사용.
4. **패키지 매니저 고정**: backend=yarn, frontend=npm. 섞지 말 것.

## 인증 (Hub SSO — 검색앱과 100% 동일)
- Hub가 JWT 발급(HS512, Base64 secret).
- 토큰교환 방식: client → Hub `login?redirect=` → `sso_code`(Redis 5분) → client backend가 Hub `/auth/sso/verify-code` 호출.
- 서버-서버 호출은 `AUTH_SERVICE_SECRET` + 헤더 `X-Service-Id: infocast`.

## 개인화 입력 (소비만)
`GET {HUB}/api/internal/users/:hubUserId/admission-profile` (ServiceAuth, `X-Service-Id: infocast`).
응답: `curriculum`, `grade`, `naesin_summary`, `csat_mock_summary`, `saenggibu_summary`, `susi_fit_signals`, `jungsi_fit_signals`. 소스(생기부/모고/수시/정시)는 직접 안 읽고 이 API만 소비.

## 대표 화면 — 맞춤 입시 캘린더
대시보드(`/`)는 **① 입시 캘린더 D-day 히어로 + 미니 캘린더 → ② 맞춤 피드 → ③ 구독 요약** 순으로 배치한다. 캘린더가 항상 최상단·최대 면적·유일한 채색 블록이며, 이 위계를 바꾸지 말 것.
`/calendar` = 월간 그리드(달력/목록 토글, 내 일정/전체 토글, 카테고리 필터). `/schedule` = **공개 페이지(로그인 불필요)** — 날짜별 전체 일정, `GET /api/public/calendar`(가드 없음, 개인정보 금지). 일정은 **`ic_info_item` 중 `deadlineAt`이 있는 APPROVED 항목에서 파생**(전용 테이블 없음), 표시는 항상 **KST 기준**(`src/lib/calendar.ts`). 태그에 **`universities` 차원**이 있어(가중치 4, 최고) 관심 대학을 고르면 그 대학 면접·발표 일정이 상단에 온다. 시드: `prisma/seed/{calendar,interview,announcement,exam}-2027.json` → `yarn seed:calendar`(`--dry` 미리보기). 현재 **580건**. 면접 393건은 **대교협 공식 PDF** 기반이며 지역 태그까지 있다. 시드 메타의 `replacesSource` 는 교체된 출처의 잔존 항목을 ARCHIVED 로 내린다. 일정이 수백 건이라 **기간 필터 필수** — `/info-items?from=&to=&hasDeadline=true&take=` 로 받고, 안 쓰면 take 상한에서 조용히 잘린다. 설계: `docs/입시캘린더-기획.md`.

## 학년별 화면 분기 (고1~재수생)
대상은 고1~재수생. **같은 화면을 주지 말 것.** 고3·재수생 = 실행 모드(D-day 카운트다운), 고1·고2 = 준비 모드(D-day 없음, "지금은 내신·과목 선택의 시기"). 학년은 `GET /api/profile/me`(학년·교육과정만 노출) → `useProfile()`.
`Grade = 1|2|3|'N'`(N=재수생). **학년은 학생 아이디에서 파생한다** — `26h3` = 2026학년도에 고3, 해가 바뀌면 자동 승급하고 고3을 넘기면 `'N'`. 학년도 경계는 3월(KST). 구현 `src/auth/grade-from-id.ts`. **아이디 > Hub 프로파일** 우선(Hub의 `grade: number`로는 재수생 표현 불가). `h4` 이상은 재수생 전용 표기로 간주(정확한 표기 미확정).
일정 태깅: 올해 지원자 `[3,'N']`, 재학생 전용(생기부 마감) `[3]`, 학력평가는 회차별 대상(`[1,2]`/`[3]`/`[1,2,3]`), 나머지 전체 일정은 비움.
히어로 준비 모드는 **학년이 아니라 '내 학년 대상 일정(매칭 사유 `학년 일치`) 유무'로 판정**한다 — 고1·고2도 학력평가 D-day는 봐야 한다.
시드 출처는 **항목별 신뢰도가 다르다** — 학력평가는 '시행 일정(안)' 근거라 본문·source에 재확인 안내를 노출한다. 평가원·교육부 사이트는 robots.txt 차단으로 원문 확인 불가.

## 학교 학사일정 (3계층 캘린더)
캘린더 = ① 공용 입시 일정(`ic_info_item`) + ② 내 학교 일정(Hub NEIS) + ③ 개인 일정(미구현).
**NEIS 를 직접 붙이지 말 것** — Hub `GET {HUB}/neis/schedule?year=&month=`(**사용자 JWT**, 학교 미연동 시 404, Redis 24h 캐시)를 `GET /api/calendar/school` 로 프록시한다(`src/school/`). 학교 일정은 절대 `ic_info_item` 에 넣지 않는다(공용 테이블 오염).
Hub 응답에 학년 필드가 없어 행사명의 '3학년'·'고2' 표기로만 대상 학년을 판별한다.
캘린더에는 **학교 일정 레이어 토글**(시험만 기본 / 전체 / 끄기)로 올린다. 학교 시험은 `own: true` — 고1·고2 히어로의 D-day 후보.
**함정**: Hub 라우트의 `h` 번호(`/h3`=고2, 고3은 `/j`)와 학생 아이디의 `h`(`26h3`=고3)는 **다른 체계**다.

## 콘텐츠 엔진 (이 앱 고유)
수집 → 정규화(`ic_info_item`) → 태깅(학년/계열/지역/전형/curriculum) → (선택)임베딩 → 매칭 → 발송 큐 → 채널 발송(카카오/SMS/푸시/이메일) → 로그.
1차 수집은 관리자 입력 우선. 크롤링은 robots/약관 준수.

## 스키마 (`infocast`, prefix `ic_`)
`ic_info_item`, `ic_info_embedding`(pgvector), `ic_delivery`, `ic_subscription`, `ic_match_log`.

## 구현 순서
Phase 0 스캐폴드(현재) → 1 콘텐츠 인입 → 2 구독·매칭 → 3 발송 → 4 시멘틱 → 5 운영.

## 명령어
- backend: `yarn start:dev`, `yarn prisma migrate dev`, `yarn build`, `yarn lint`.
- frontend: `npm run dev`, `npm run build`, `npm run typecheck`.

## 주의
입결/합격가능성은 추정·보장 아님을 항상 명시. 외부 출처 표기·링크 유지.
`infocast`는 가칭 — 확정 시 일괄 치환.
