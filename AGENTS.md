# AGENTS.md — Customized_Ipsy_Info (T맞춤정보 / Infocast)

> Codex가 이 파일을 자동으로 읽는다. **여기 적힌 것은 링크가 아니라 규칙이다.**
> 세부 배경은 `docs/context/` 에 있고, 아래 색인에서 필요한 것만 열어 본다.

## 이 리포는 무엇인가

**T맞춤정보(Infocast)** — Hub 의 입시 프로파일(성적·생기부·상황)에 맞춰 최신 입시정보를 골라 **배달(push)** 하는 T스쿨 위성앱.
T검색과 인증·개인화·스택·DB·배포 방식을 공유하고, **콘텐츠 엔진(수집 → 태깅 → 매칭 → 발송)만 다르다.**
대표 화면은 **맞춤 입시 캘린더**이며, 대상은 고1~재수생이다.

- `infocast-backend/` — NestJS 10 + Prisma (**yarn**), dev **4012**
- `infocast-frontend/` — React 18 + Vite + TanStack Router + Zustand + TanStack Query (**npm**), dev **3012**
- 프로덕션 프론트: https://infocast-front.web.app (Firebase site `infocast-front`)
- 백엔드 App Engine service `infocast-backend` — **레지스트리상 미배포**

전체 설계는 `docs/핸드오프-가이드.md`, 캘린더 설계는 `docs/입시캘린더-기획.md`.
`infocast` 는 가칭이다. 확정되면 일괄 치환 대상이다.

## 🚨 생태계 공통 규칙 (읽지 않고 작업 금지)

이 5개는 링크가 아니라 본문이다. 전 리포 공통이며, 위반 시 프로덕션 데이터가 깨진다.

### 1. DB 접속 직후 신원 게이트 — 생략 금지

**"접속 성공"은 prod에 붙었다는 증거가 전혀 아니다.** 로컬에도 `geobukschool_prod` 라는 **같은 이름의 DB**가 있고 `tsuser` 자격증명까지 통과하므로, 포트·DB명·유저·비밀번호가 **전 단계 모두 통과**하면서도 엉뚱한 DB를 보게 된다.

> 실제 사고 (2026-08-19): `cloud-sql-proxy --port 5433` 이 로컬 postgres의 5433 점유로 기동 실패했는데 `netstat` LISTENING만 보고 떴다고 오인. prod를 "환산식 0행 / susi_unit 없음"으로 보고했으나 실제 prod는 formula 1,267행·susi_unit 33,770행으로 정상 가동 중이었다. 멀쩡한 작업 메모를 거짓으로 판정할 뻔했다.

접속 직후 **무조건** 이 쿼리부터 실행한다:

```sql
SELECT current_database(), inet_server_port(), version();
--  prod  = "PostgreSQL 14.x on x86_64-pc-linux-gnu"
--  로컬  = "PostgreSQL 18.x on x86_64-windows"   ← 즉시 중단

SELECT count(*) FROM susi.susi_calculation_formula;  -- prod ≈ 1,267 (year 2027)
SELECT count(*) FROM susi.susi_unit;                 -- prod ≈ 33,770
```

행 수가 기대치와 다르면 **그건 prod가 아니다.** 스키마 존재 여부만으로 판정하지 말 것 — 로컬에도 같은 스키마가 있다.

- **5433을 프록시 포트로 쓰지 말 것.** 로컬 Windows postgres 상시 점유 대역이다. 15432·15433 등 비어 있는 포트를 쓴다.
- 프록시는 **분리 실행**하고 기동 성공을 프로세스/로그로 확인한다. `netstat` LISTENING은 근거가 안 된다(누가 듣고 있는지 알 수 없음).
- `app.yaml` 은 Secret에서 재생성되므로 그 파일의 접속 정보를 신뢰하지 말 것.
- 메모에 "prod 실측 확인"이라 적을 때는 **위 게이트 출력을 함께 붙인다.** 출력이 없으면 미확인으로 취급한다.
- 저장된 메모와 실측이 충돌하면 **메모보다 접속 대상을 먼저 의심한다.**

### 2. 척도 3컬럼 — `max_score` / `real_max_score` / `score_scale`

`susi.susi_calculation_formula` 의 세 컬럼은 서로 다른 척도다. 혼동하면 환산점수가 통째로 틀린다.

| 컬럼 | 의미 |
|---|---|
| `max_score` | **환산식 내부 만점.** 대학마다 제각각(1·10·100·125·400·720…). 시드 JSON 유래. |
| `real_max_score` | **대학별 실제 환산 만점**(유웨이 크롤값). `rescale-formulas.py` 의 `UW_MAXSCORE` 딕셔너리가 원본. |
| `score_scale` | `real_max_score / max_score`. 엔진 raw 점수를 **입결 척도로 올리는 배율**. |

적용 지점:

- **저장** — 엔진 원점수(raw) 그대로 저장한다. 척도 보정을 하지 않는다.
- **조회** — `convertedScore = raw × score_scale`. **조회 시점 적용**이므로 값을 바꿔도 `susi_user_factor_score` 재계산·캐시 무효화가 필요 없다.
- **백분율 분모** — `real_max_score` 우선, 없으면 `max_score` 폴백. 내 환산점수와 예상컷(환산 50컷/70컷)이 **둘 다 입결 척도**이므로 분모도 입결 척도여야 한다.
- 엔진이 실척도를 직접 산출하는 경우 `score_scale` 은 **반드시 1** — 이중 보정 금지.

### 3. 권위 테이블은 `susi.susi_unit`

- `susi.susi_unit` — **2027 모집단위 권위 테이블** (prod 33,770행). `conversion_factor_id` 가 이미 붙어 있다.
- `hub.susi_kyokwa_recruitment` — **비어 있는 레거시.** 개념 중복이 아니라 그냥 빈 테이블이다.

→ `susi_unit` 생성·적재·크로스워크 작업은 **전부 불필요하다.** 이 테이블을 "만들어야 한다"고 판단했다면 잘못된 DB를 보고 있는 것이다(규칙 1로 돌아갈 것).

### 4. DRY-RUN 기본, 쓰기는 `--apply` 명시

DB를 수정하는 모든 스크립트는 **인자 없이 실행하면 DRY-RUN**이어야 한다.

- 기본 동작: 변경 대상과 before/after를 출력만 하고 **커밋하지 않는다**(`conn.rollback()`).
- 실제 쓰기: `--apply` 를 **명시적으로** 붙였을 때만. `conn.autocommit = False` + 명시적 `commit()`.
- 출력에 현재 접속 대상(규칙 1의 게이트 출력)과 영향 행 수를 반드시 찍는다.
- 기존 스크립트에 이 플래그가 없다면 **먼저 추가하고 나서** 실행한다. 예외 없다.

### 5. 어디가 대조 베이스라인 50.2% — 떨어지면 즉시 롤백

환산 엔진 관련 변경은 반드시 **어디가 대조를 재실행**해서 검증한다.

- 현재 베이스라인: **일치 + 근사 50.2%** (화이트리스트 대학 기준).
- 변경 후 이 수치보다 **올라가야 정상**이다. 떨어지면 **즉시 롤백**한다.
- 나머지 절반은 엔진을 켜면 틀린 환산점수를 노출하므로 **화이트리스트 대학만** 엔진을 적용한다.
- 배율이 큰 대학(가톨릭대 10배)·하향 조정 대학(건국대)은 자동 수치만 믿지 말고 **개별 육안 확인**한다.

---

## 🔒 T맞춤정보 고유 규칙

### 1. git `origin` 확인 후 push — 생기북 복제 계열이다

이 리포는 **Saenggi-Book 을 복제해서 만들었다.** 한때 `origin` 이 `withjoono/Saenggi-Book.git` 을 그대로 가리켜, push 하면 **남의 리포에 커밋이 들어가는** 상태였다.

**2026-09-03 실측 결과 — 현재는 교정되어 있다:**

```
origin  https://github.com/withjoono/Customized_Ipsy_Info.git (fetch)
origin  https://github.com/withjoono/Customized_Ipsy_Info.git (push)
```

- push 전에 **반드시** `git remote -v` 로 확인한다. 폴더를 복사하거나 예전 클론을 되살리면 다시 어긋난다.
- 어긋나 있으면 교정: `git remote set-url origin https://github.com/withjoono/Customized_Ipsy_Info.git`
- 정식 repo 는 `withjoono/Customized_Ipsy_Info` 다.

### 2. 배포된 프론트 번들이 깨져 있다 — 손대기 전에 이것부터 안다

`infocast-frontend` 는 API 주소·Hub 주소를 **폴백 없이** 환경변수로만 받는다.

```ts
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, ... });
// store/auth.ts
const hub = import.meta.env.VITE_HUB_URL;
const redirect = `${import.meta.env.VITE_APP_URL}/auth/callback`;
```

**커밋된 `infocast-frontend/dist/` 번들 실측 결과, 이 값들이 빌드 시점에 비어 있었다:**

```
baseURL:void 0
...href=`undefined/login?redirect=${encodeURIComponent("undefined/auth/callback")}`
```

즉 배포본에서 로그인 버튼은 `undefined/login` 으로 가고, 모든 API 호출은 상대경로가 되어 `infocast-front.web.app/api/...` 를 때린다 — SPA rewrite 때문에 **404 가 아니라 `index.html`(HTML) 이 200 으로 돌아온다.** 실패가 조용히 성공처럼 보인다.

→ **재빌드·재배포 시 반드시 `VITE_API_BASE_URL` / `VITE_HUB_URL` / `VITE_APP_URL` 을 채운 뒤 빌드한다.** Vite 는 빌드 타임 인라인이라 런타임 주입이 불가능하다. 리포에는 `.env` 가 없고 `.env.example` 만 있다(값은 전부 localhost 예시).
→ 이 앱의 버그 리포트를 받으면 **먼저 번들에 값이 박혔는지** 확인한다. 코드를 고칠 문제가 아닐 가능성이 크다.

### 3. Firebase 배포 target 생략 금지

- **항상 `firebase deploy --only hosting:infocast-front`.** `--only hosting` 단독 금지(2026-05-16 Hub site 덮어쓰기 사고).
- `firebase.json` 의 hosting 블록은 `"target": "infocast-front"` **하나뿐**, `.firebaserc` 도 `infocast-front` 만 매핑한다. 다른 앱 블록을 추가하지 말 것.
- 참고: `infocast-frontend/package.json` 에는 배포 스크립트가 **없다.** 손으로 치게 되니 target 을 빠뜨리기 쉽다 — 위 명령을 그대로 복사해 쓸 것.

### 4. `infocast` 스키마만 소유 — 폭발 반경

`infocast-backend/prisma/schema.prisma` (실측):

```prisma
generator client { previewFeatures = ["multiSchema", "postgresqlExtensions"] }
datasource db {
  url     = env("DATABASE_URL")
  schemas = ["infocast"]      // ← 선언된 스키마는 이것 하나뿐
  extensions = [vector]
}
```

- 모든 모델에 `@@schema("infocast")` 가 붙어 있다. 마이그레이션 폭발 반경은 **`infocast` 스키마 하나**다.
- **`schemas` 배열에 다른 앱 스키마(`hub`·`susi`·`jungsi`·`search`)를 추가하지 말 것.** 추가하는 순간 마이그레이션이 남의 스키마를 관리 대상으로 삼는다.
- **`prisma db push` 금지.** 2026-07 에 `db push` 가 공용 hub 스키마를 wipe 시킨 사고가 3회 있었다. `prisma migrate dev` / `prisma migrate deploy` 만 쓴다.
- 실행 전 공통 규칙 1의 신원 게이트로 접속 대상을 확인한다. 로컬에도 같은 이름의 `geobukschool_prod` 가 있다.
- 외부 스키마 읽기가 필요하면 별도 읽기전용 계정 + `$queryRaw` 격리로만. 운영 DB 계정은 `infocast_app`.

### 5. 인증은 Hub 위임. 자체 로그인 금지

- Hub 가 JWT 발급(HS512, **Base64 secret** — `Buffer.from(secret,'base64')`). `AUTH_JWT_SECRET` 은 생태계 공유 값이라 **변경하면 전 위성앱 세션이 한 번에 무효화된다.**
- 토큰교환: client → Hub `/login?redirect=` → `sso_code`(Redis 5분) → 본 backend 가 Hub `/auth/sso/verify-code` 호출 (`src/auth/auth.service.ts`).
- 서버-서버 호출은 `AUTH_SERVICE_SECRET` + 헤더 `X-Service-Id: infocast`.
- 개인화 입력은 **Hub 프로파일 API 만 소비**한다. 생기북·모고·susi·jungsi 를 직접 읽지 않는다.
- **NEIS 를 직접 붙이지 말 것.** Hub `GET /neis/schedule` 을 `GET /api/calendar/school` 로 프록시한다(`src/school/`). 학교 일정은 **절대 `ic_info_item` 에 넣지 않는다**(공용 테이블 오염).

### 6. 배포용 시크릿은 `app.deploy.yaml` — 리포에 없다

- `infocast-backend/app.deploy.yaml` 은 `.gitignore` 에 걸려 **추적되지 않는다.** 로컬에만 있고 DB 비밀번호·`AUTH_JWT_SECRET`·`AUTH_SERVICE_SECRET` 이 **평문**으로 들어 있다.
- 커밋된 `app.yaml` 은 시크릿 없는 껍데기다(주석에 "여기 평문 금지" 명시).
- **커밋 금지. 값을 문서·이슈·로그로 옮기지 말 것.** `.gitignore` 에서 그 줄을 지우지 말 것.
- `ADMIN_EMAILS` 로 관리자 화이트리스트가 잡힌다(`src/auth/admin.guard.ts`). 배포 설정에도 실제 이메일이 들어 있으니 함께 취급 주의.

### 7. 화면 위계와 학년 분기 — 임의로 바꾸지 말 것

- 대시보드(`/`)는 **① 입시 캘린더 D-day 히어로 + 미니 캘린더 → ② 맞춤 피드 → ③ 구독 요약** 순서. 캘린더가 항상 최상단·최대 면적·유일한 채색 블록이다.
- `/schedule` 은 **로그인 불필요 공개 페이지**(`GET /api/public/calendar`, 가드 없음). **개인정보를 절대 태우지 말 것.**
- 일정은 전용 테이블 없이 **`ic_info_item` 중 `deadlineAt` 이 있는 `APPROVED` 항목에서 파생**된다. 표시는 항상 **KST**(`src/lib/calendar.ts`).
- 고3·재수생 = 실행 모드(D-day), 고1·고2 = 준비 모드. **같은 화면을 주지 말 것.**
- 학년은 **학생 아이디에서 파생**한다(`26h3` = 2026학년도 고3, 경계는 3월 KST, 고3을 넘기면 `'N'`). 구현 `src/auth/grade-from-id.ts`. **아이디 > Hub 프로파일** 우선 — Hub 의 `grade: number` 로는 재수생을 표현할 수 없다.
- **함정**: Hub 라우트의 `h` 번호(`/h3`=고2, 고3은 `/j`)와 학생 아이디의 `h`(`26h3`=고3)는 **다른 체계**다.

### 8. 개발 포트 3012/4012 — 변경 금지

포트는 생태계 전역 레지스트리다. Infocast 는 **3012(front) / 4012(back)** 고정.
※ Hub `CLAUDE.md` 의 전역 포트 목록에는 3012/4012 가 **빠져 있다.** 다른 앱이 집어가지 않도록 Hub 목록에 추가가 필요하다(확인 필요).

### 9. 패키지 매니저 고정

backend = **yarn**, frontend = **npm**. 섞지 말 것. 두 lockfile 이 모두 커밋돼 있다.

---

## 📇 파일 색인 — `docs/context/`

| 파일 | 언제 읽나 |
|---|---|
| `deploy-and-ownership.md` | 배포·Firebase target·git remote·시크릿 파일을 건드릴 때 |
| `schema-and-hub-contracts.md` | Prisma 마이그레이션, Hub API 계약, 발송 스케줄러 작업 |
| `frontend-build-env.md` | 프론트 빌드·환경변수·배포본이 깨진 원인을 볼 때 |

---

## 명령어

```bash
# 백엔드 (infocast-backend/, yarn)
yarn start:dev            # :4012
yarn build                # nest build
yarn typecheck            # tsc --noEmit
yarn prisma:migrate       # prisma migrate dev — infocast 스키마만
yarn prisma:deploy        # prisma migrate deploy (운영)
yarn seed:calendar        # prisma/seed/*.json → 캘린더 시드

# 프론트엔드 (infocast-frontend/, npm)
npm run dev               # Vite :3012 (/api → localhost:4012 프록시)
npm run build             # tsc -b && vite build — 환경변수 채우고 빌드할 것
npm run typecheck

# 배포 (프론트)
firebase deploy --only hosting:infocast-front
```

**금지:** `prisma db push` · `firebase deploy --only hosting` (target 생략) · `app.deploy.yaml` 커밋 · 환경변수 없이 프론트 빌드.
