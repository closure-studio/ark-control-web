const SCRIPT_PREFIX = String.raw`set -euo pipefail

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
PROJECT_NUMBER="$(gcloud projects describe "\${PROJECT_ID}" --format='value(projectNumber)')"
SERVICE_ACCOUNT_ID="ark-control-vps"
WIF_POOL_ID="ark-control"
WIF_PROVIDER_ID="cloudflare"
SERVICE_ACCOUNT_EMAIL="\${SERVICE_ACCOUNT_ID}@\${PROJECT_ID}.iam.gserviceaccount.com"
WIF_PROVIDER_RESOURCE="//iam.googleapis.com/projects/\${PROJECT_NUMBER}/locations/global/workloadIdentityPools/\${WIF_POOL_ID}/providers/\${WIF_PROVIDER_ID}"
DEFAULT_ZONE="us-central1-c"
ARK_CONTROL_BASE_URL="\${ARK_CONTROL_BASE_URL:-https://ark-control-api.dltest.workers.dev}"`;

const TOKEN_PROMPT_BLOCK = String.raw`read -rsp "Ark Control admin token: " ARK_CONTROL_ADMIN_TOKEN
echo
if [[ -z "\${ARK_CONTROL_ADMIN_TOKEN}" ]]; then
  echo "Ark Control admin token is required." >&2
  exit 1
fi`;

const SCRIPT_BODY = String.raw`gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com compute.googleapis.com
gcloud iam service-accounts describe "\${SERVICE_ACCOUNT_EMAIL}" --project="\${PROJECT_ID}" >/dev/null 2>&1 || gcloud iam service-accounts create "\${SERVICE_ACCOUNT_ID}" --project="\${PROJECT_ID}" --display-name="Ark VPS Manager"
gcloud iam workload-identity-pools describe "\${WIF_POOL_ID}" --project="\${PROJECT_ID}" --location="global" >/dev/null 2>&1 || gcloud iam workload-identity-pools create "\${WIF_POOL_ID}" --project="\${PROJECT_ID}" --location="global" --display-name="Ark Control"
gcloud iam workload-identity-pools providers describe "\${WIF_PROVIDER_ID}" --project="\${PROJECT_ID}" --location="global" --workload-identity-pool="\${WIF_POOL_ID}" >/dev/null 2>&1 || gcloud iam workload-identity-pools providers create-oidc "\${WIF_PROVIDER_ID}" --project="\${PROJECT_ID}" --location="global" --workload-identity-pool="\${WIF_POOL_ID}" --display-name="Ark Control" --issuer-uri="https://ark-control-api.dltest.workers.dev" --allowed-audiences="\${WIF_PROVIDER_RESOURCE}" --attribute-mapping="google.subject=assertion.sub,attribute.purpose=assertion.purpose" --attribute-condition='assertion.purpose=="gcp-wif" && assertion.sub=="ark-gcp-vps-manager"'
gcloud iam service-accounts add-iam-policy-binding "\${SERVICE_ACCOUNT_EMAIL}" --project="\${PROJECT_ID}" --role="roles/iam.workloadIdentityUser" --member="principal://iam.googleapis.com/projects/\${PROJECT_NUMBER}/locations/global/workloadIdentityPools/\${WIF_POOL_ID}/subject/ark-gcp-vps-manager"
gcloud projects add-iam-policy-binding "\${PROJECT_ID}" --member="serviceAccount:\${SERVICE_ACCOUNT_EMAIL}" --role="roles/compute.instanceAdmin.v1"

curl -fsS -X POST "\${ARK_CONTROL_BASE_URL}/api/public/accounts" \
  -H "authorization: Bearer \${ARK_CONTROL_ADMIN_TOKEN}" \
  -H "content-type: application/json" \
  --data "$(cat <<EOF
{
  "name": "\${PROJECT_ID}",
  "projectId": "\${PROJECT_ID}",
  "serviceAccountEmail": "\${SERVICE_ACCOUNT_EMAIL}",
  "workloadIdentityProvider": "\${WIF_PROVIDER_RESOURCE}",
  "defaultZone": "\${DEFAULT_ZONE}"
}
EOF
)"

unset ARK_CONTROL_ADMIN_TOKEN`;

function unescapeTemplateVars(source: string): string {
  return source.replaceAll(String.raw`\${`, "${");
}

function quoteShellSingle(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function normalizeAdminToken(adminToken?: string): string {
  const trimmed = adminToken?.trim() ?? "";
  if (!trimmed || /[\r\n]/u.test(trimmed)) {
    return "";
  }
  return trimmed;
}

export function buildCloudShellScript(adminToken?: string): string {
  const normalizedToken = normalizeAdminToken(adminToken);
  const tokenBlock = normalizedToken
    ? `ARK_CONTROL_ADMIN_TOKEN=${quoteShellSingle(normalizedToken)}`
    : unescapeTemplateVars(TOKEN_PROMPT_BLOCK);

  return [
    unescapeTemplateVars(SCRIPT_PREFIX),
    tokenBlock,
    unescapeTemplateVars(SCRIPT_BODY)
  ].join("\n\n");
}

export const CLOUD_SHELL_SCRIPT = buildCloudShellScript();
