import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  Clock3,
  FileText,
  LoaderCircle,
  TimerOff
} from "lucide-react";
import {
  ACTIVE_RUN_STATUSES,
  ATTENTION_RUN_STATUSES,
  RUN_STATUS_FAILED,
  RUN_STATUS_PENDING,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_TIMED_OUT
} from "@/components/releases/releaseHelpers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostRun, HostRunStatus } from "@/types";
import { cx, formatDateTime } from "@/utils";

const RUN_STATUS_ICON: Record<
  HostRunStatus,
  { icon: typeof CircleCheck; className: string }
> = {
  [RUN_STATUS_SUCCEEDED]: { icon: CircleCheck, className: "text-success" },
  [RUN_STATUS_RUNNING]: { icon: LoaderCircle, className: "animate-spin text-info" },
  [RUN_STATUS_PENDING]: { icon: Clock3, className: "text-warning" },
  [RUN_STATUS_FAILED]: { icon: CircleX, className: "text-error" },
  [RUN_STATUS_TIMED_OUT]: { icon: TimerOff, className: "text-error" }
};

export function HostRunRow({
  onOpenLog,
  run
}: {
  onOpenLog: (run: HostRun) => void;
  run: HostRun;
}) {
  const statusVisual = RUN_STATUS_ICON[run.status];
  const StatusIcon = statusVisual.icon;
  const isAttention = ATTENTION_RUN_STATUSES.has(run.status);
  const isActive = ACTIVE_RUN_STATUSES.has(run.status);
  const showAiReview = run.lastAiStatus !== null || run.lastAiReason !== null;

  return (
    <article
      className={cx(
        "px-5 py-4 transition-colors sm:px-6",
        isAttention
          ? "bg-error/[0.03] hover:bg-error/[0.055]"
          : "hover:bg-base-content/[0.025]"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <StatusIcon
            aria-hidden="true"
            className={cx("mt-0.5 shrink-0", statusVisual.className)}
            size={17}
          />
          <div className="min-w-0">
            <h3 className="break-words text-sm font-extrabold leading-snug text-base-content">
              {run.hostName}
            </h3>
            <p className="mt-0.5 break-all font-mono text-xs text-base-content/55">
              {run.hostIp}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
          <StatusBadge value={run.status} />
          <button
            className="btn btn-sm gap-1.5 bg-base-100"
            onClick={() => onOpenLog(run)}
            type="button"
          >
            <FileText aria-hidden="true" size={14} />
            Log
          </button>
        </div>
      </div>

      {showAiReview || run.errorMessage ? (
        <div className="mt-3 grid gap-2.5 sm:pl-7">
          {showAiReview ? (
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-base-content/60">AI review</span>
                <StatusBadge value={run.lastAiStatus} />
              </div>
              {run.lastAiReason ? (
                <p className="break-words text-xs leading-5 text-base-content/75">
                  {run.lastAiReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {run.errorMessage ? (
            <div className="alert alert-error alert-soft flex items-start gap-2 rounded-field border border-error/25 px-3 py-2 text-xs leading-5">
              <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
              <p className="min-w-0 break-words font-medium">{run.errorMessage}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-base-content/55 sm:pl-7">
        <span className="inline-flex items-center gap-1">
          <Clock3 aria-hidden="true" size={12} />
          Checked {formatDateTime(run.lastCheckedAt)}
        </span>
        {run.startedAt ? (
          <span>Started {formatDateTime(run.startedAt)}</span>
        ) : null}
        {isActive && run.nextCheckAt ? (
          <span className="font-semibold text-info">
            Next check {formatDateTime(run.nextCheckAt)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
