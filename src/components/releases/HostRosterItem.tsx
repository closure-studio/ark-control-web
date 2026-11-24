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
  ATTENTION_RUN_STATUSES,
  formatElapsedDuration,
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

export function HostRosterItem({
  onOpenLog,
  onSelect,
  run,
  selected
}: {
  onOpenLog: (run: HostRun) => void;
  onSelect: (run: HostRun) => void;
  run: HostRun;
  selected: boolean;
}) {
  const statusVisual = RUN_STATUS_ICON[run.status];
  const StatusIcon = statusVisual.icon;
  const isAttention = ATTENTION_RUN_STATUSES.has(run.status);
  const elapsed = formatElapsedDuration(run.startedAt, run.lastCheckedAt ?? run.updatedAt);

  return (
    <div
      className={cx(
        "flex flex-col gap-2.5 px-4 py-3.5 transition-colors sm:px-5",
        selected
          ? "bg-info/8 shadow-[inset_3px_0_0_var(--color-info)]"
          : isAttention
            ? "bg-error/[0.03] hover:bg-error/[0.06]"
            : "hover:bg-base-content/[0.03]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
          onClick={() => onSelect(run)}
          type="button"
        >
          <StatusIcon
            aria-hidden="true"
            className={cx("mt-0.5 shrink-0", statusVisual.className)}
            size={16}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-words text-sm font-extrabold leading-snug text-base-content">
                {run.hostName}
              </span>
              {elapsed ? (
                <span className="rounded bg-base-200 px-1.5 py-0.5 text-[0.68rem] font-semibold tabular-nums text-base-content/65">
                  {elapsed}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 break-all font-mono text-xs text-base-content/55">
              {run.hostIp}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
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

      {run.errorMessage ? (
        <p className="flex items-start gap-1.5 pl-6.5 text-xs leading-5 text-error">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
          <span className="line-clamp-2 break-words font-medium">{run.errorMessage}</span>
        </p>
      ) : run.lastAiReason ? (
        <p className="line-clamp-2 pl-6.5 text-xs leading-5 text-base-content/70">
          {run.lastAiReason}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pl-6.5 text-[0.7rem] text-base-content/50">
        <span>Checked {formatDateTime(run.lastCheckedAt)}</span>
        {run.lastAiStatus ? (
          <span className="inline-flex items-center gap-1.5">
            <span>AI</span>
            <StatusBadge value={run.lastAiStatus} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
