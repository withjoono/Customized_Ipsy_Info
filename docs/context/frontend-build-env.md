---
name: frontend-build-env
description: 프론트 환경변수가 빌드 타임 인라인이라는 점과, 현재 배포본에 undefined 가 박혀 있는 사실
type: feedback
---

# 프론트 빌드 환경변수 — 배포본이 깨져 있다

## 사실

`infocast-frontend` 는 세 개의 Vite 환경변수를 쓰고, **어느 것에도 폴백이 없다**(`src/vite-env.d.ts` 에 선언).

| 변수 | 쓰는 곳 | 용도 |
|---|---|---|
| `VITE_API_BASE_URL` | `src/lib/api.ts` | axios `baseURL` |
| `VITE_HUB_URL` | `src/store/auth.ts` | Hub 로그인 리다이렉트 대상 |
| `VITE_APP_URL` | `src/store/auth.ts` | Hub `login?redirect=` 에 넘길 자기 주소 |

커밋된 배포 산출물 `infocast-frontend/dist/assets/index-CKuJYbUm.js` (빌드 2026-08-12) 를 실제로 열어 보면:

```
baseURL:void 0
nRedirect:()=>{const n="undefined/auth/callback";
  window.location.href=`undefined/login?redirect=${encodeURIComponent(n)}`}
```

**세 값이 모두 비어 있는 채로 빌드됐다.** 리포에는 `.env` 가 없고 `.env.example`(localhost 예시)만 있다.

## 결과

- **로그인**: 버튼을 누르면 `undefined/login?...` 으로 이동한다. SSO 진입 자체가 불가능하다.
- **API**: `baseURL` 이 `undefined` 라 axios 가 상대경로로 호출한다 → `https://infocast-front.web.app/api/...`
  Firebase Hosting 의 SPA rewrite(`**` → `/index.html`) 때문에 **404 가 아니라 `index.html` 이 200 으로 돌아온다.**
  → axios 는 성공으로 판단하고, 파싱 단계에서야 이상해진다. **실패가 조용하다.** "데이터가 안 보인다" 류의 리포트가 이 경로로 들어온다.
- 백엔드(`infocast-backend`)도 레지스트리상 미배포이므로, 값을 채워 재빌드해도 **호출 대상이 아직 없다.**

## 규칙

1. 프론트를 재빌드·재배포할 때는 **반드시** `.env`(또는 CI 시크릿)에 세 값을 채운다. Vite 는 **빌드 타임에 문자열을 인라인**하므로 런타임 주입이 불가능하다.
2. 배포 전 검증: 빌드 산출물에 `undefined/login` 또는 `baseURL:void 0` 이 남아 있는지 grep 한다.

```bash
grep -o "undefined/login\|baseURL:void 0" dist/assets/*.js   # 아무것도 안 나와야 정상
```

3. 배포 명령은 항상 `firebase deploy --only hosting:infocast-front`.
4. 버그 리포트를 받으면 **코드보다 번들에 박힌 값을 먼저 본다.**

## 참고 — 프론트 라우트

`src/routes/`: `root` · `dashboard` · `feed` · `calendar` · `schedule`(공개, 로그인 불필요) · `subscribe` · `admin` · `promo` · `auth-callback`.
`api.ts` 인터셉터는 요청에 `Authorization: Bearer <token>` 을 붙이고, 401 응답 시 `useAuth.logout()` 으로 세션을 비운다. 토큰은 `localStorage` 에 보관한다.
빌드는 `tsc -b && vite build` 라 **타입 에러로 빌드가 깨진다**(Hub 프론트와 다르다).
