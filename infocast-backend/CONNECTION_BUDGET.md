# Shared DB connection budget

This service (infocast-backend) uses at most one connection per ORM pool and App Engine automatic scaling min_instances=0/max_instances=1. Susi has a separate Prisma and TypeORM pool, each limited to one. Database tier and application instance class are unchanged.

After generating app.yaml from secrets, run `python apply-connection-policy.py app.yaml` and `python apply-connection-policy.py app.yaml --check` immediately before deployment. Never print or commit generated app.yaml. A missing URL, another service, or another scaling mode fails closed. Runtime source also enforces the limit (including pg adapters).

`Verify connection budget` tests fake URLs and source integration without cloud credentials or DB access. The deployment workflow runs the same tests before applying the YAML policy. No migration changes are part of this policy.

This repository previously had no deployment CI. The new deployment workflow is manual-only and requires repository secrets GCP_SA_KEY and BACKEND_APP_YAML_B64. They were absent when the policy was added; validation CI does not require them. The YAML secret must name this service and preserve its current production configuration.
