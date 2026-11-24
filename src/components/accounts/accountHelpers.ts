import type { AccountInput, GcpAccount } from "@/types";

export const COPY_FEEDBACK_DURATION_MS = 1_800;
export const EMPTY_COUNT = 0;
const MAX_PREVIEW_ZONES = 2;
export const MIN_MULTI_ZONE_COUNT = 2;
export const NEW_ACCOUNT_TARGET = "new";
const PERCENT_SCALE = 100;

export const STATUS_FILTER_ALL = "all";
export const STATUS_FILTER_ENABLED = "enabled";
export const STATUS_FILTER_DISABLED = "disabled";
export const ZONE_FILTER_ALL = "all";

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

export type AccountStatusFilter =
  | typeof STATUS_FILTER_ALL
  | typeof STATUS_FILTER_ENABLED
  | typeof STATUS_FILTER_DISABLED;

export interface AccountFilters {
  search: string;
  status: AccountStatusFilter;
  zone: string;
}

export const EMPTY_ACCOUNT_FILTERS: AccountFilters = {
  search: "",
  status: STATUS_FILTER_ALL,
  zone: ZONE_FILTER_ALL
};

export interface ParsedWifProvider {
  pool: string;
  provider: string;
}

export interface AccountSummaryMetrics {
  totalCount: number;
  enabledCount: number;
  disabledCount: number;
  readinessPercent: number;
  uniqueZones: string[];
}

const WIF_PROVIDER_PATTERN =
  /workloadIdentityPools\/([^/]+)\/providers\/([^/]+)$/u;

export function parseWifProvider(value: string): ParsedWifProvider | null {
  const match = WIF_PROVIDER_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, pool, provider] = match;
  if (!pool || !provider) return null;
  return { pool, provider };
}

function extractUniqueZones(accounts: GcpAccount[]): string[] {
  const zones = new Set<string>();
  for (const account of accounts) {
    const trimmed = account.defaultZone.trim();
    if (trimmed) zones.add(trimmed);
  }
  return Array.from(zones).sort((left, right) => left.localeCompare(right));
}

export function summarizeAccounts(accounts: GcpAccount[]): AccountSummaryMetrics {
  const totalCount = accounts.length;
  const enabledCount = accounts.filter((account) => account.enabled).length;
  const disabledCount = totalCount - enabledCount;
  const readinessPercent =
    totalCount === EMPTY_COUNT
      ? EMPTY_COUNT
      : Math.round((enabledCount / totalCount) * PERCENT_SCALE);

  return {
    totalCount,
    enabledCount,
    disabledCount,
    readinessPercent,
    uniqueZones: extractUniqueZones(accounts)
  };
}

export function hasActiveAccountFilters(filters: AccountFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== STATUS_FILTER_ALL ||
    filters.zone !== ZONE_FILTER_ALL
  );
}

export function matchesAccountFilters(
  account: GcpAccount,
  filters: AccountFilters
): boolean {
  if (filters.status === STATUS_FILTER_ENABLED && !account.enabled) return false;
  if (filters.status === STATUS_FILTER_DISABLED && account.enabled) return false;
  if (filters.zone !== ZONE_FILTER_ALL && account.defaultZone !== filters.zone) {
    return false;
  }

  const query = filters.search.trim().toLowerCase();
  if (!query) return true;

  return [
    account.name,
    account.projectId,
    account.defaultZone,
    account.serviceAccountEmail,
    account.workloadIdentityProvider
  ].some((field) => field.toLowerCase().includes(query));
}

export function formatZonePreview(zones: string[]): string {
  if (zones.length === EMPTY_COUNT) return "No default zones";
  const visible = zones.slice(EMPTY_COUNT, MAX_PREVIEW_ZONES);
  const remaining = zones.length - visible.length;
  if (remaining > EMPTY_COUNT) {
    return `${visible.join(" · ")} +${remaining}`;
  }
  return visible.join(" · ");
}

export function hasEmbeddedAdminToken(adminToken?: string): boolean {
  const trimmed = adminToken?.trim() ?? "";
  return trimmed !== "" && !/[\r\n]/u.test(trimmed);
}
