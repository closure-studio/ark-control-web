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

export interface GcpOperationResult {
  accountId: number;
  projectId: string;
  zone: string;
  instanceName: string;
  action: "create" | "start" | "stop" | "delete";
  status: "submitted" | "succeeded" | "failed" | "skipped";
  message?: string;
  googleOperationName?: string;
}

export interface GcpOperation {
  id: number;
  batchId: string;
  accountId: number | null;
  accountName: string | null;
  projectId: string;
  zone: string;
  instanceName: string;
  action: GcpOperationResult["action"];
  status: GcpOperationResult["status"];
  message: string | null;
  googleOperationName: string | null;
  createdAt: string;
}

export interface OperationsResponse {
  operations: GcpOperation[];
  pagination: { limit: number; offset: number; count: number; total: number };
}

export interface VpsResource {
  id: number;
  name: string;
  address: string;
  port: number;
  username: string;
  watcherEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VpsInventoryResponse {
  vps: VpsResource[];
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

export type HostRunListState = "all" | "active" | "terminal";

export interface RunsResponse {
  runs: HostRun[];
  pagination: { limit: number; offset: number; count: number; total: number };
}

export interface RunLog {
  lastLogTail: string | null;
  lastCheckedAt: string | null;
  updatedAt: string;
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
