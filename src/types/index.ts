type OperationStatus = "submitted" | "succeeded" | "failed" | "skipped";
export type VpsAction = "start" | "stop" | "delete";

export interface GcpAccount {
  id: number;
  name: string;
  projectId: string;
  projectNumber: string;
  serviceAccountEmail: string;
  workloadIdentityProvider: string;
  defaultZone: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CloudVpsDetails {
  provider: "gcp";
  accountId: number;
  accountName: string;
  projectId: string;
  zone: string;
  instanceName: string;
  status: string | null;
  machineType: string | null;
  internalIps: string[];
  externalIps: string[];
  error: string | null;
}

export interface VpsResource {
  id: number;
  name: string;
  address: string;
  port: number;
  username: string;
  verifyCommand: string | null;
  watcherEnabled: boolean;
  source: "gcp" | "manual";
  cloud: CloudVpsDetails | null;
  createdAt: string;
  updatedAt: string;
}

export interface VpsInventoryResponse {
  vps: VpsResource[];
  errors: Array<{
    scope: "account" | "project" | "instance";
    message: string;
    accountId?: number;
    hostId?: number;
  }>;
}

export interface VpsActionResult {
  hostId: number;
  hostName: string;
  action: VpsAction;
  status: OperationStatus;
  message?: string;
  accountId?: number;
  projectId?: string;
  zone?: string;
  instanceName?: string;
  googleOperationName?: string;
}

export type HostRunStatus = "pending" | "running" | "succeeded" | "failed" | "timed_out";
type AiReviewStatus = "success" | "running" | "failed" | "unknown";

export interface ReleaseSummary {
  id: number;
  apkFilename: string;
  finalUrl: string;
  createdAt: string;
  statusCounts: Partial<Record<HostRunStatus, number>>;
}

export interface ReleasesResponse {
  releases: ReleaseSummary[];
  pagination: { limit: number; offset: number; count: number };
}

export interface HostRun {
  id: number;
  releaseId: number;
  hostId: number | null;
  hostName: string;
  hostIp: string;
  status: HostRunStatus;
  startedAt: string | null;
  nextCheckAt: string | null;
  deadlineAt: string | null;
  lastCheckedAt: string | null;
  lastAiStatus: AiReviewStatus | null;
  lastAiReason: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunLog {
  lastLogTail: string | null;
  lastCheckedAt: string | null;
  updatedAt: string;
}

interface RecentOperation {
  id: number;
  batchId: string;
  hostId: number | null;
  accountId: number | null;
  accountName: string | null;
  projectId: string;
  zone: string;
  instanceName: string;
  action: string;
  status: string;
  message: string | null;
  googleOperationName: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DashboardResponse {
  generatedAt: string;
  summary: {
    accounts: { total: number; enabled: number };
    vps: {
      total: number;
      gcp: number;
      manual: number;
      running: number;
      stopped: number;
      unavailable: number;
      watcherEnabled: number;
    };
    watcher: {
      lastProcessedApkFilename: string | null;
      lastSuccessfulCheckAt: string | null;
      lastCheckError: string | null;
      hasNonTerminalHostRuns: boolean;
      nonTerminalHostRunCount: number;
    };
  };
  recentReleases: ReleaseSummary[];
  recentOperations: RecentOperation[];
  errors: VpsInventoryResponse["errors"];
}

export type AccountInput = Pick<
  GcpAccount,
  | "name"
  | "projectId"
  | "projectNumber"
  | "serviceAccountEmail"
  | "workloadIdentityProvider"
  | "defaultZone"
>;

export interface VpsFormInput {
  name: string;
  address: string;
  port: number;
  username: string;
  password?: string;
  verifyCommand: string | null;
  watcherEnabled?: boolean;
}

export interface VerifyResult {
  connected: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  success: boolean;
  timedOut: boolean;
}
