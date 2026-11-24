import type { HostRun, HostRunStatus, ReleaseSummary } from "@/types";

export const EMPTY_COUNT = 0;
export const FIRST_PAGE_OFFSET = 0;
export const PAGE_SIZE = 25;
export const RELEASE_POLL_INTERVAL_MS = 15_000;
export const RELEASE_POLL_INTERVAL_SECONDS = 15;
export const PERCENT_SCALE = 100;
export const LOG_COPY_KEY = "run-log";
export const APK_URL_COPY_KEY = "apk-url";
export const HOST_IP_COPY_KEY = "host-ip";

const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const RUN_STATUS_PENDING = "pending" as const satisfies HostRunStatus;
export const RUN_STATUS_RUNNING = "running" as const satisfies HostRunStatus;
export const RUN_STATUS_SUCCEEDED = "succeeded" as const satisfies HostRunStatus;
export const RUN_STATUS_FAILED = "failed" as const satisfies HostRunStatus;
export const RUN_STATUS_TIMED_OUT = "timed_out" as const satisfies HostRunStatus;

export const ACTIVE_RUN_STATUSES: ReadonlySet<HostRunStatus> = new Set([
  RUN_STATUS_PENDING,
  RUN_STATUS_RUNNING
]);

export const ATTENTION_RUN_STATUSES: ReadonlySet<HostRunStatus> = new Set([
  RUN_STATUS_FAILED,
  RUN_STATUS_TIMED_OUT
]);

export const RUN_FILTER_ALL = "all";
export const RUN_FILTER_ATTENTION = "attention";
export const RUN_FILTER_ACTIVE = "active";
export const RUN_FILTER_SUCCEEDED = "succeeded";

export type RunFilter =
  | typeof RUN_FILTER_ALL
  | typeof RUN_FILTER_ATTENTION
  | typeof RUN_FILTER_ACTIVE
  | typeof RUN_FILTER_SUCCEEDED;

export const VIEW_MODE_SPLIT = "split";
export const VIEW_MODE_MATRIX = "matrix";

export type WorkbenchViewMode = typeof VIEW_MODE_SPLIT | typeof VIEW_MODE_MATRIX;

export const RELEASE_HEALTH_EMPTY = "empty";
export const RELEASE_HEALTH_ATTENTION = "attention";
export const RELEASE_HEALTH_ACTIVE = "active";
export const RELEASE_HEALTH_HEALTHY = "healthy";

export type ReleaseHealth =
  | typeof RELEASE_HEALTH_EMPTY
  | typeof RELEASE_HEALTH_ATTENTION
  | typeof RELEASE_HEALTH_ACTIVE
  | typeof RELEASE_HEALTH_HEALTHY;

export const STATUS_BAR_SEGMENTS: ReadonlyArray<{
  key: HostRunStatus;
  className: string;
}> = [
  { key: RUN_STATUS_SUCCEEDED, className: "bg-success" },
  { key: RUN_STATUS_RUNNING, className: "bg-info" },
  { key: RUN_STATUS_PENDING, className: "bg-warning" },
  { key: RUN_STATUS_FAILED, className: "bg-error" },
  { key: RUN_STATUS_TIMED_OUT, className: "bg-neutral" }
];

export const RELEASE_HEALTH_META: Record<
  ReleaseHealth,
  {
    label: string;
    badgeClassName: string;
    radialClassName: string;
  }
> = {
  [RELEASE_HEALTH_HEALTHY]: {
    label: "All verified",
    badgeClassName: "border-success/30 bg-success/10 text-success",
    radialClassName: "text-success"
  },
  [RELEASE_HEALTH_ACTIVE]: {
    label: "Deploying",
    badgeClassName: "border-info/30 bg-info/10 text-info",
    radialClassName: "text-info"
  },
  [RELEASE_HEALTH_ATTENTION]: {
    label: "Needs attention",
    badgeClassName: "border-error/30 bg-error/10 text-error",
    radialClassName: "text-error"
  },
  [RELEASE_HEALTH_EMPTY]: {
    label: "No runs",
    badgeClassName: "border-base-300 bg-base-200 text-base-content/60",
    radialClassName: "text-base-content/35"
  }
};

export interface ReleaseCountSummary {
  total: number;
  succeeded: number;
  running: number;
  pending: number;
  failed: number;
  timedOut: number;
  active: number;
  attention: number;
  passRate: number;
  health: ReleaseHealth;
}

export function summarizeReleaseCounts(
  counts: ReleaseSummary["statusCounts"]
): ReleaseCountSummary {
  const succeeded = counts[RUN_STATUS_SUCCEEDED] ?? EMPTY_COUNT;
  const running = counts[RUN_STATUS_RUNNING] ?? EMPTY_COUNT;
  const pending = counts[RUN_STATUS_PENDING] ?? EMPTY_COUNT;
  const failed = counts[RUN_STATUS_FAILED] ?? EMPTY_COUNT;
  const timedOut = counts[RUN_STATUS_TIMED_OUT] ?? EMPTY_COUNT;
  const active = running + pending;
  const attention = failed + timedOut;
  const total = succeeded + active + attention;
  const passRate =
    total === EMPTY_COUNT ? EMPTY_COUNT : Math.round((succeeded / total) * PERCENT_SCALE);

  let health: ReleaseHealth = RELEASE_HEALTH_EMPTY;
  if (attention > EMPTY_COUNT) {
    health = RELEASE_HEALTH_ATTENTION;
  } else if (active > EMPTY_COUNT) {
    health = RELEASE_HEALTH_ACTIVE;
  } else if (total > EMPTY_COUNT) {
    health = RELEASE_HEALTH_HEALTHY;
  }

  return {
    total,
    succeeded,
    running,
    pending,
    failed,
    timedOut,
    active,
    attention,
    passRate,
    health
  };
}

export interface RunFilterCounts {
  all: number;
  attention: number;
  active: number;
  succeeded: number;
}

export function summarizeRunFilters(runs: HostRun[]): RunFilterCounts {
  let attention = EMPTY_COUNT;
  let active = EMPTY_COUNT;
  let succeeded = EMPTY_COUNT;

  for (const run of runs) {
    if (ATTENTION_RUN_STATUSES.has(run.status)) {
      attention += 1;
    } else if (ACTIVE_RUN_STATUSES.has(run.status)) {
      active += 1;
    } else if (run.status === RUN_STATUS_SUCCEEDED) {
      succeeded += 1;
    }
  }

  return {
    all: runs.length,
    attention,
    active,
    succeeded
  };
}

const RUN_FILTER_PREDICATES: Record<RunFilter, (run: HostRun) => boolean> = {
  [RUN_FILTER_ALL]: () => true,
  [RUN_FILTER_ATTENTION]: (run) => ATTENTION_RUN_STATUSES.has(run.status),
  [RUN_FILTER_ACTIVE]: (run) => ACTIVE_RUN_STATUSES.has(run.status),
  [RUN_FILTER_SUCCEEDED]: (run) => run.status === RUN_STATUS_SUCCEEDED
};

export function matchesRunFilter(run: HostRun, filter: RunFilter, query: string): boolean {
  if (!RUN_FILTER_PREDICATES[filter](run)) {
    return false;
  }
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return true;
  }
  const searchable = [
    run.hostName,
    run.hostIp,
    run.lastAiReason ?? "",
    run.errorMessage ?? ""
  ];
  return searchable.some((value) => value.toLowerCase().includes(normalized));
}

export function formatReleaseRange(offset: number, count: number): string {
  if (count === EMPTY_COUNT) {
    return "0";
  }
  const start = offset + 1;
  const end = offset + count;
  return `${start}–${end}`;
}

const APK_ARCH_PATTERN = /\b(arm64-v8a|armeabi-v7a|arm64|x86_64|universal)\b/i;
const APK_VERSION_PATTERN = /\b(\d{4}[.-]\d{2}[.-]\d{2}|v?\d+\.\d+(?:\.\d+)?)\b/i;

export interface ParsedApkMetadata {
  arch: string | null;
  version: string | null;
}

export function parseApkMetadata(filename: string): ParsedApkMetadata {
  const archMatch = APK_ARCH_PATTERN.exec(filename);
  const versionMatch = APK_VERSION_PATTERN.exec(filename);
  return {
    arch: archMatch ? archMatch[1].toLowerCase() : null,
    version: versionMatch ? versionMatch[1] : null
  };
}

export function formatElapsedDuration(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): string | null {
  if (!startIso || !endIso) {
    return null;
  }
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return null;
  }
  const totalSeconds = Math.floor((endMs - startMs) / MS_PER_SECOND);
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `${totalSeconds}s`;
  }
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (totalMinutes < MINUTES_PER_HOUR) {
    return seconds > EMPTY_COUNT ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return minutes > EMPTY_COUNT ? `${hours}h ${minutes}m` : `${hours}h`;
}

export interface LifecycleStep {
  key: string;
  label: string;
  tone: string;
}

const RUN_LIFECYCLE_STEPS: Record<HostRunStatus, readonly LifecycleStep[]> = {
  [RUN_STATUS_PENDING]: [
    { key: "dispatch", label: "Queued", tone: "step-warning" },
    { key: "verify", label: "Verify", tone: "" },
    { key: "outcome", label: "Complete", tone: "" }
  ],
  [RUN_STATUS_RUNNING]: [
    { key: "dispatch", label: "Dispatched", tone: "step-info" },
    { key: "verify", label: "Verifying", tone: "step-info" },
    { key: "outcome", label: "Complete", tone: "" }
  ],
  [RUN_STATUS_SUCCEEDED]: [
    { key: "dispatch", label: "Dispatched", tone: "step-success" },
    { key: "verify", label: "Verified", tone: "step-success" },
    { key: "outcome", label: "Succeeded", tone: "step-success" }
  ],
  [RUN_STATUS_FAILED]: [
    { key: "dispatch", label: "Dispatched", tone: "step-error" },
    { key: "verify", label: "Checked", tone: "step-error" },
    { key: "outcome", label: "Failed", tone: "step-error" }
  ],
  [RUN_STATUS_TIMED_OUT]: [
    { key: "dispatch", label: "Dispatched", tone: "step-error" },
    { key: "verify", label: "Expired", tone: "step-error" },
    { key: "outcome", label: "Timed out", tone: "step-error" }
  ]
};

export function lifecycleStepsForRun(status: HostRunStatus): readonly LifecycleStep[] {
  return RUN_LIFECYCLE_STEPS[status];
}

const LOG_ERROR_LINE_PATTERN = /\b(error|failed|fatal|exception|traceback|exited with)\b/i;

export function isErrorLogLine(line: string): boolean {
  return LOG_ERROR_LINE_PATTERN.test(line);
}

export function splitLogLines(rawLog: string | null): string[] {
  if (!rawLog) {
    return [];
  }
  return rawLog.replace(/\r\n/gu, "\n").split("\n");
}
