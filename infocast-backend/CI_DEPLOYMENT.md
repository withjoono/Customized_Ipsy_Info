# Backend deployment authentication

This repository uses GitHub OIDC to impersonate the existing deployment account. No GCP_SA_KEY is required.

- GitHub variables: GCP_WIF_PROVIDER, GCP_DEPLOY_SERVICE_ACCOUNT.
- GitHub encrypted secret: BACKEND_APP_YAML_B64 (this app's production YAML).
- Trust is limited to this repository ID, owner ID, main branch, workflow_dispatch, and deploy-backend.yml.
- Run Deploy Backend with validate_only=true (default) to check credentials, live service read access, deployment permissions, runtime account actAs, upload exclusions, and pool policy without deploying or starting Cloud Build.
- Set validate_only=false explicitly to deploy. Deployment remains manual-only and preserves the existing instance class and minimum0/maximum1 policy.
- Temporary configuration is removed even on failure; do not print or upload configuration or auth credentials as artifacts.
- Verification does not access the application database or execute migrations. It is not a completed production deployment test.
- For private repositories, confirm included Actions minutes before running hosted verification if no additional charges are permitted.
