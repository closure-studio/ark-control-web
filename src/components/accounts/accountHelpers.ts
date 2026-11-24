import type { AccountInput } from "@/types";

export const COPY_FEEDBACK_DURATION_MS = 1_800;
export const EMPTY_COUNT = 0;
export const NEW_ACCOUNT_TARGET = "new";

const DEFAULT_GCP_ZONE = "us-central1-c";
export const COMMON_GCP_ZONES = [
  "us-central1-c",
  "us-west1-b",
  "asia-east1-b",
  "europe-west1-b"
] as const;

export const EMPTY_ACCOUNT_INPUT: AccountInput = {
  name: "",
  projectId: "",
  serviceAccountEmail: "",
  workloadIdentityProvider: "",
  defaultZone: DEFAULT_GCP_ZONE
};

export function hasEmbeddedAdminToken(adminToken?: string): boolean {
  const trimmed = adminToken?.trim() ?? "";
  return trimmed !== "" && !/[\r\n]/u.test(trimmed);
}
