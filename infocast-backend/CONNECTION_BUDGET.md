# Shared DB connection budget

This service (infocast-backend) uses at most one connection per ORM pool and App Engine automatic scaling min_instances=0/max_instances=1. Susi has a separate Prisma and TypeORM pool, each limited to one. Database tier and application instance class are unchanged.

After generating app.yaml from secrets, run `python apply-connection-policy.py app.yaml` and `python apply-connection-policy.py app.yaml --check` immediately before deployment. Never print or commit generated app.yaml. A missing URL, another service, or another scaling mode fails closed. Runtime source also enforces the limit (including pg adapters).

`Verify connection budget` tests fake URLs and source integration without cloud credentials or DB access. The deployment workflow runs the same tests before applying the YAML policy. No migration changes are part of this policy.

Deployment is manual-only and uses GitHub OIDC (no GCP_SA_KEY). Repository variables GCP_WIF_PROVIDER and GCP_DEPLOY_SERVICE_ACCOUNT and encrypted secret BACKEND_APP_YAML_B64 are configured. See CI_DEPLOYMENT.md. The default validate_only=true mode checks authentication, deployment permissions, source exclusions and budget without deploying or starting Cloud Build. Set validate_only=false explicitly for an actual deployment. Confirm included Actions minutes before running hosted jobs in a private repository when no additional charges are allowed.
