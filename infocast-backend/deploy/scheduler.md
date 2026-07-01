# 주기 발송 — Cloud Scheduler 설정

`POST {BACKEND_URL}/api/internal/delivery/run` 을 주기적으로 호출하면
`DeliveryService.runDue()` 가 실행된다(활성 구독 → 빈도·방해금지 반영 → 적재 → 발송).

이 엔드포인트는 `ServiceAuthGuard` 로 보호된다. 호출 시 헤더 필요:

```
Authorization: Bearer <AUTH_SERVICE_SECRET>
X-Service-Id: infocast-cron
```

## Cloud Scheduler (gcloud)

```bash
gcloud scheduler jobs create http infocast-delivery \
  --project ts-back-nest-479305 \
  --location asia-northeast3 \
  --schedule "0 8,18 * * *" \           # 매일 08·18시 (KST는 TZ 지정)
  --time-zone "Asia/Seoul" \
  --uri "https://infocast-backend-dot-ts-back-nest-479305.appspot.com/api/internal/delivery/run" \
  --http-method POST \
  --headers "X-Service-Id=infocast-cron,Authorization=Bearer ${AUTH_SERVICE_SECRET}"
```

> 빈도(REALTIME/DAILY/WEEKLY)는 회원 구독 설정에서 `isDue()` 로 필터되므로,
> 스케줄러는 자주(예: 시간당) 호출해도 회원별 빈도가 지켜진다.
> REALTIME 회원까지 빠르게 받으려면 스케줄을 더 촘촘히(`0 * * * *`) 둔다.

## App Engine cron.yaml (대안)

App Engine 표준 cron 은 같은 service 로만 요청을 보내고 커스텀 헤더를 못 붙인다.
ServiceAuth 헤더가 필요하므로 **Cloud Scheduler 사용을 권장**.
부득이 cron.yaml 을 쓰면 내부 IP 신뢰(`X-Appengine-Cron: true`) 검사로 가드를 대체해야 한다.
