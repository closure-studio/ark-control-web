export interface GcpAccount {
  id: number;
  name: string;
  projectId: string;
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
  role: VpsRole;
  watcherEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VpsInventoryResponse {
  vps: VpsResource[];
}

export type VpsRole = "redroid" | "arkhost";

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

export type ControlJobName =
  | "apk-delivery"
  | "maintenance-monitor"
  | "maintenance-pre-action"
  | "retention";

export interface SchedulerEnsureResponse {
  ensuredJobs: ControlJobName[];
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
  | "serviceAccountEmail"
  | "workloadIdentityProvider"
  | "defaultZone"
>;

export type VpsProvisioningModel = "SPOT" | "STANDARD";

export interface ProvisionVpsInput {
  cpuCount: number;
  memoryGb: number;
  provisioningModel: VpsProvisioningModel;
  diskSizeGb: number;
}

export interface VpsFormInput {
  name: string;
  address: string;
  port: number;
  username: string;
  role: VpsRole;
  password?: string;
  watcherEnabled: boolean;
}

export type CreateVpsInput = Omit<VpsFormInput, "password"> & { password: string };
export type UpdateVpsInput = Partial<Omit<VpsFormInput, "role">>;

export interface VerifyResult {
  connected: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  success: boolean;
  timedOut: boolean;
}
