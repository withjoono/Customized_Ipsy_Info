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
