# 맞춤 입시정보 배달앱 (Infocast)

거북스쿨 생태계의 위성앱. 사용자의 성적·생기부·상황(= Hub 입시 프로파일)에 맞춰 **최신 입시정보를 골라 배달(push)** 한다. 고1~고3 전체(2015·2022 교육과정).

검색앱(Univ_Admissions_Search)과 인증(Hub SSO)·개인화 레이어(Hub 입시 프로파일 API)·기술스택·공유 DB·배포 방식을 공유하며, **콘텐츠 엔진만 다르다**(검색앱=내부 전형 DB 검색(Pull), 배달앱=외부 입시정보 수집·큐레이션 + 알림 발송(Push)).

전체 설계는 [`docs/핸드오프-가이드.md`](docs/핸드오프-가이드.md) 참고.

## 구성

| 워크스페이스 | 스택 | 패키지 매니저 | Dev 포트 |
|---|---|---|---|
| `infocast-backend` | NestJS 10 + Prisma | **yarn** | 4012 |
| `infocast-frontend` | React 18 + Vite + TanStack Router + Zustand + TanStack Query | **npm** | 3012 |

DB는 공유 Cloud SQL PostgreSQL, **스키마 격리**(`infocast` 스키마, 테이블 prefix `ic_`). 본 앱은 자기 스키마만 소유·마이그레이션하며 외부 스키마는 읽기 전용으로만 접근한다.

## 빠른 시작

### Backend

```bash
cd infocast-backend
cp .env.example .env        # 값 채우기 (AUTH_JWT_SECRET 등은 생태계 공유 값)
yarn install
yarn prisma generate
yarn prisma migrate dev     # infocast 스키마만 마이그레이션
yarn start:dev              # http://localhost:4012
```

### Frontend

```bash
cd infocast-frontend
cp .env.example .env        # VITE_API_BASE_URL, VITE_HUB_URL 등
npm install
npm run dev                 # http://localhost:3012
```

## 배포 가드레일 (사고 방지)

- Firebase 배포는 **항상** `firebase deploy --only hosting:infocast-front` (target 생략 금지).
- `.firebaserc`엔 자기 site만, `firebase.json`엔 자기 hosting 블록 하나만.
- Prisma migrate는 `infocast` 스키마만 건드린다. 다른 앱 스키마는 절대 쓰기 금지.

## 명명 (확정 필요 — 가이드 §2)

`infocast`는 가칭. 앱 코드/service/site/스키마/포트 확정 후 일괄 치환.
