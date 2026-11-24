import { CircleCheck, CircleX, Clock3, LoaderCircle, TimerOff, type LucideIcon } from "lucide-react";
import { HOST_RUN_STATUS, type HostRun, type HostRunStatus, type ReleaseSummary } from "@/types";

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

export const ACTIVE_RUN_STATUSES: ReadonlySet<HostRunStatus> = new Set([
  HOST_RUN_STATUS.PENDING,
  HOST_RUN_STATUS.RUNNING
]);

export const ATTENTION_RUN_STATUSES: ReadonlySet<HostRunStatus> = new Set([
  HOST_RUN_STATUS.FAILED,
  HOST_RUN_STATUS.TIMED_OUT
]);

export const RUN_FILTER_ALL = "all";
export const RUN_FILTER_ATTENTION = "attention";
export const RUN_FILTER_ACTIVE = "active";
export const RUN_FILTER_SUCCEEDED = HOST_RUN_STATUS.SUCCEEDED;

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

type HostRunTone = "success" | "info" | "warning" | "error";

// Tailwind needs literal class names to generate the styles.
const RUN_TONE_STYLES: {
  [Tone in HostRunTone]: {
    barClassName: `bg-${Tone}`;
    badgeClassName: `badge-${Tone}`;
    textClassName: `text-${Tone}`;
    stepClassName: `step-${Tone}`;
  };
} = {
  success: {
    barClassName: "bg-success",
    badgeClassName: "badge-success",
    textClassName: "text-success",
    stepClassName: "step-success"
  },
  info: {
    barClassName: "bg-info",
    badgeClassName: "badge-info",
    textClassName: "text-info",
    stepClassName: "step-info"
  },
  warning: {
    barClassName: "bg-warning",
    badgeClassName: "badge-warning",
    textClassName: "text-warning",
    stepClassName: "step-warning"
  },
  error: {
    barClassName: "bg-error",
    badgeClassName: "badge-error",
    textClassName: "text-error",
    stepClassName: "step-error"
  }
};

type LifecycleStep = Readonly<{ label: string; reached: boolean }>;

export const HOST_RUN_PRESENTATION: Readonly<Record<
  HostRunStatus,
  (typeof RUN_TONE_STYLES)[HostRunTone] & {
    label: string;
    icon: LucideIcon;
    iconAnimation?: string;
    lifecycle: readonly [LifecycleStep, LifecycleStep, LifecycleStep];
  }
>> = {
  [HOST_RUN_STATUS.SUCCEEDED]: {
    ...RUN_TONE_STYLES.success,
    label: "Succeeded",
    icon: CircleCheck,
    lifecycle: [
      { label: "Dispatched", reached: true },
      { label: "Verified", reached: true },
      { label: "Succeeded", reached: true }
    ]
  },
  [HOST_RUN_STATUS.RUNNING]: {
    ...RUN_TONE_STYLES.info,
    label: "Running",
    icon: LoaderCircle,
    iconAnimation: "animate-spin",
    lifecycle: [
      { label: "Dispatched", reached: true },
      { label: "Verifying", reached: true },
      { label: "Complete", reached: false }
    ]
  },
  [HOST_RUN_STATUS.PENDING]: {
    ...RUN_TONE_STYLES.warning,
    label: "Pending",
    icon: Clock3,
    lifecycle: [
      { label: "Queued", reached: true },
      { label: "Verify", reached: false },
      { label: "Complete", reached: false }
    ]
  },
  [HOST_RUN_STATUS.FAILED]: {
    ...RUN_TONE_STYLES.error,
    label: "Failed",
    icon: CircleX,
    lifecycle: [
      { label: "Dispatched", reached: true },
      { label: "Checked", reached: true },
      { label: "Failed", reached: true }
    ]
  },
  [HOST_RUN_STATUS.TIMED_OUT]: {
    ...RUN_TONE_STYLES.error,
    label: "Timed out",
    icon: TimerOff,
    lifecycle: [
      { label: "Dispatched", reached: true },
      { label: "Expired", reached: true },
      { label: "Timed out", reached: true }
    ]
  }
};

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
  const succeeded = counts[HOST_RUN_STATUS.SUCCEEDED] ?? EMPTY_COUNT;
  const running = counts[HOST_RUN_STATUS.RUNNING] ?? EMPTY_COUNT;
  const pending = counts[HOST_RUN_STATUS.PENDING] ?? EMPTY_COUNT;
  const failed = counts[HOST_RUN_STATUS.FAILED] ?? EMPTY_COUNT;
  const timedOut = counts[HOST_RUN_STATUS.TIMED_OUT] ?? EMPTY_COUNT;
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
    } else if (run.status === HOST_RUN_STATUS.SUCCEEDED) {
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
  [RUN_FILTER_SUCCEEDED]: (run) => run.status === HOST_RUN_STATUS.SUCCEEDED
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
