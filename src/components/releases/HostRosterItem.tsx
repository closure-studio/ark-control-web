import { AlertTriangle, FileText } from "lucide-react";
import { HostRunBadge } from "@/components/releases/HostRunBadge";
import {
  ATTENTION_RUN_STATUSES,
  formatElapsedDuration,
  HOST_RUN_PRESENTATION
} from "@/components/releases/releaseHelpers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostRun } from "@/types";
import { cx, formatDateTime } from "@/utils";

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
  const { icon: StatusIcon, iconAnimation, textClassName } = HOST_RUN_PRESENTATION[run.status];
  const isAttention = ATTENTION_RUN_STATUSES.has(run.status);
  const elapsed = formatElapsedDuration(run.startedAt, run.lastCheckedAt ?? run.updatedAt);

  return (
    <div
      className={cx(
        "flex flex-col gap-2.5 border-s-3 px-4 py-3.5 transition-colors sm:px-5",
        selected
          ? "border-s-info bg-info/8"
          : isAttention
            ? "border-s-transparent bg-error/3 hover:bg-error/6"
            : "border-s-transparent hover:bg-base-content/3"
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
            className={cx("mt-0.5 shrink-0", iconAnimation, textClassName)}
            size={16}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold leading-snug wrap-anywhere text-base-content">
                {run.hostName}
              </span>
              {elapsed ? (
                <span className="rounded bg-base-200 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted">
                  {elapsed}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 break-all font-mono text-xs text-muted">
              {run.hostIp}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <HostRunBadge status={run.status} />
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
          <span className="line-clamp-2 font-medium wrap-anywhere">{run.errorMessage}</span>
        </p>
      ) : run.lastAiReason ? (
        <p className="line-clamp-2 pl-6.5 text-xs leading-5 wrap-anywhere text-muted">
          {run.lastAiReason}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pl-6.5 text-xs text-muted">
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
