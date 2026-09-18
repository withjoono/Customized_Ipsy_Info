---
name: deploy-and-ownership
description: T맞춤정보의 git remote·Firebase site·App Engine 배포 상태와 시크릿 파일 취급
type: reference
---

# 배포와 소유권

## git remote (2026-09-03 실측)

이 리포는 Saenggi-Book 을 복제해 만들어졌고, 한동안 `origin` 이 원본을 가리켰다. 현재는 교정된 상태다.

```
origin  https://github.com/withjoono/Customized_Ipsy_Info.git (fetch)
origin  https://github.com/withjoono/Customized_Ipsy_Info.git (push)
```

`.git/config` 도 동일. 브랜치 `main`, upstream `origin/main`.

**push 전에 `git remote -v` 를 다시 확인한다.** 어긋나 있으면:

```bash
git remote set-url origin https://github.com/withjoono/Customized_Ipsy_Info.git
```

어긋난 채 push 하면 생기북 리포에 커밋이 들어간다.

## Firebase Hosting

`infocast-frontend/firebase.json` — hosting 블록 **1개**, `"target": "infocast-front"`, `public: "dist"`, SPA rewrite.

`infocast-frontend/.firebaserc`

```json
{ "projects": { "default": "ts-front-479305" },
  "targets": { "ts-front-479305": { "hosting": { "infocast-front": ["infocast-front"] } } } }
```

- 배포는 **항상** `firebase deploy --only hosting:infocast-front`.
- `package.json` 에 배포 스크립트가 **없다.** 손으로 치게 되므로 target 누락 위험이 T검색보다 높다.
- `--only hosting` (target 생략)은 금지. 2026-05-16 에 생기북 빌드가 Hub 의 `ts-front-479305` site 를 덮어써 `www.tskool.kr` 이 생기북을 서빙한 사고가 있었다.

## App Engine

- service 명 `infocast-backend`, 프로젝트 `ts-back-nest-479305`.
- 위성앱 레지스트리 기준 **미배포**. (컨테이너 외부 네트워크가 막혀 live 확인은 못 함 — `gcloud app services list --project ts-back-nest-479305` 로 확인 필요.)
- 커밋된 `app.yaml`: `runtime: nodejs22`, `service: infocast-backend`, `instance_class: F1`, `entrypoint: node dist/main.js`, `automatic_scaling` min 0 / max 2, `handlers: url /.* secure: always`. **시크릿 없음** — 주석에 "여기 평문 금지" 명시.
- `gcp-build` = `prisma generate && nest build`.

## 시크릿 파일

`infocast-backend/app.deploy.yaml` 은 `.gitignore` 에 있어 **추적되지 않는다**(`git ls-files` 확인 — 추적되는 env 계열은 `.env.example` 두 개뿐).

들어 있는 키 (값은 여기 옮기지 않는다):

`NODE_ENV` `PORT` `SERVICE_ID` `VERTEX_LOCATION` `VERTEX_EMBEDDING_MODEL` `DATABASE_URL` `AUTH_JWT_SECRET` `AUTH_SERVICE_SECRET` `HUB_BASE_URL` `HUB_INTERNAL_BASE_URL` `FRONTEND_URL` `ADMIN_EMAILS` `GCP_PROJECT_ID`

값 중 비밀이 아닌 것만 기록해 둔다.

- DB 계정: `infocast_app`, 스키마 `infocast`
- `HUB_BASE_URL` = `HUB_INTERNAL_BASE_URL` = Hub App Engine 기본 도메인 (`https://ts-back-nest-479305.du.r.appspot.com`)
- `FRONTEND_URL` = `https://infocast-front.web.app` (CORS / SSO redirect 허용 대상)
- `AUTH_JWT_SECRET` 은 **생태계 공유 Base64 값. 변경 시 전 위성앱 세션 무효화.**

**규칙**: `app.deploy.yaml` 을 커밋하지 않는다. `.gitignore` 에서 그 줄을 지우지 않는다. `ADMIN_EMAILS` 포함해 값을 문서·이슈·로그로 옮기지 않는다.

## 작업 트리 상태 (2026-09-03)

`git status` 기준 **커밋되지 않은 수정이 다수** 있다 — `CLAUDE.md`, `docs/핸드오프-가이드.md`, `infocast-backend/` 의 `app.module.ts`·`hub.service.ts`·`info-item/*`·`tags/*` 등. 작업을 시작하기 전에 이 변경들이 무엇인지 먼저 확인하고, 남의 진행 중 작업을 덮어쓰지 않도록 한다.
