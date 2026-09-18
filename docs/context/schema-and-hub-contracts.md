---
name: schema-and-hub-contracts
description: infocast 스키마 소유 범위와 마이그레이션 폭발 반경, Hub SSO·프로파일·NEIS 계약, 발송 스케줄러
type: reference
---

# 스키마와 Hub 계약

## 공유 DB, 스키마 격리

Cloud SQL `ts-back-nest-479305:asia-northeast3:geobuk-db` → DB `geobukschool_prod`(dev 는 `geobukschool_dev`).
전 생태계가 하나의 DB 를 schema 로 격리해 공유한다. 본 앱은 **`infocast` 스키마** 소유, 테이블 prefix `ic_`.

## Prisma 폭발 반경

`infocast-backend/prisma/schema.prisma` (실측):

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema", "postgresqlExtensions"]
}
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  schemas    = ["infocast"]     // ← 여기 하나뿐
  extensions = [vector]         // pgvector
}
```

- 모든 모델에 `@@schema("infocast")`. **관리 대상은 `infocast` 스키마 하나**다.
- **`schemas` 배열에 다른 스키마를 추가하지 말 것.** `multiSchema` 가 켜져 있으므로, `hub`·`susi`·`jungsi`·`search` 를 여기 적으면 그 순간 마이그레이션이 남의 스키마에 DDL 을 날릴 수 있다. 이게 이 리포에서 가장 큰 단일 위험이다.
- **`prisma db push` 금지.** 2026-07 에 `db push` 가 공용 hub 스키마를 wipe 시킨 사고가 3회 있었다. `prisma migrate dev` / `prisma migrate deploy` 만.
- 실행 전 공통 규칙 1의 신원 게이트로 접속 대상을 확인한다. 로컬에도 같은 이름의 `geobukschool_prod` 가 있다.
- 외부 스키마 읽기가 필요하면 `DATABASE_READONLY_URL`(별도 읽기전용 계정) + `$queryRaw` 격리로만. `.env.example` 에 선택 항목으로 준비돼 있다.

## 소유 모델

`ic_info_item`(입시정보 1건 — `targetTags` jsonb, `publishedAt`, `deadlineAt`, `status` DRAFT/APPROVED …), `ic_info_embedding`(pgvector), `ic_delivery`, `ic_subscription`, `ic_match_log`.

**캘린더 일정은 전용 테이블이 없다.** `ic_info_item` 중 `deadlineAt` 이 있는 `APPROVED` 항목에서 파생한다. 표시는 항상 KST(`src/lib/calendar.ts`). 시드는 `prisma/seed/*.json` → `yarn seed:calendar`.

시드 출처는 **항목별 신뢰도가 다르다.** 학력평가는 '시행 일정(안)' 근거라 본문·source 에 재확인 안내를 노출한다. 평가원·교육부 사이트는 robots.txt 차단으로 원문 확인이 불가하다.

## Hub 계약 (소비만 한다)

### 1) SSO 토큰교환 — `src/auth/`

`client → Hub /login?redirect= → sso_code(Redis 5분) → 본 backend 가 Hub POST /auth/sso/verify-code`
구현: `auth.service.ts` 의 `verifyCode(ssoCode)`. 베이스 URL 은 `HUB_BASE_URL`(폴백 `http://localhost:4000`).
JWT 는 HS512 + **Base64 secret**. `AUTH_JWT_SECRET` 은 생태계 공유 값 — **절대 변경·재발급 금지**(전 위성앱 세션 무효화).
가드: `jwt-auth.guard.ts`(사용자), `service-auth.guard.ts`(서버-서버), `admin.guard.ts`(`ADMIN_EMAILS` 화이트리스트).

### 2) 입시 프로파일 — `src/hub/hub.service.ts`

```
GET {HUB_INTERNAL_BASE_URL}/api/internal/users/:hubUserId/admission-profile
Authorization: Bearer <AUTH_SERVICE_SECRET>
X-Service-Id: infocast
```

응답: `curriculum`, `grade`, `naesin_summary`, `csat_mock_summary`, `saenggibu_summary`, `susi_fit_signals`, `jungsi_fit_signals`.
**소스(생기부·모고·수시·정시)를 직접 읽지 않는다.** 이 API 만 소비한다.

### 3) 학교 학사일정(NEIS) — `src/school/`

```
GET {HUB_BASE_URL}/neis/schedule?year=&month=      # 사용자 JWT, 학교 미연동 시 404, Redis 24h 캐시
GET {HUB_BASE_URL}/neis/my-school                  # 사용자 JWT
```

본 앱은 이를 `GET /api/calendar/school` 로 **프록시**한다. **NEIS 를 직접 붙이지 말 것.**
**학교 일정을 `ic_info_item` 에 절대 넣지 않는다**(공용 테이블 오염).
Hub 응답에 학년 필드가 없어, 행사명의 '3학년'·'고2' 표기로만 대상 학년을 판별한다.

캘린더는 3계층이다 — ① 공용 입시 일정(`ic_info_item`) ② 내 학교 일정(Hub NEIS) ③ 개인 일정(미구현).
학교 일정은 레이어 토글(시험만 기본 / 전체 / 끄기)로 올리고, 학교 시험은 `own: true` 라 고1·고2 히어로의 D-day 후보가 된다.

## 발송 스케줄러

`deploy/scheduler.md` 기준.

```
POST {BACKEND_URL}/api/internal/delivery/run
Authorization: Bearer <AUTH_SERVICE_SECRET>
X-Service-Id: infocast-cron
```

`DeliveryService.runDue()` 가 실행된다(활성 구독 → 빈도·방해금지 반영 → 적재 → 발송). `ServiceAuthGuard` 로 보호된다.
Cloud Scheduler 예시 스케줄은 `"0 8,18 * * *"` / `--time-zone "Asia/Seoul"`.
채널 어댑터는 `src/delivery/channels/` 에 kakao·sms·push·email 이 있다.

> **확인 필요**: 스케줄러 문서의 호출 URL 은 `https://infocast-backend-dot-ts-back-nest-479305.appspot.com/...` 인데, 백엔드는 아직 미배포다. 실제 Scheduler job 이 생성돼 있는지, 있다면 실패 중인지 확인이 필요하다.
