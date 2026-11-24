import {
  AlertTriangle,
  Check,
  Clock3,
  Copy,
  Maximize2,
  RefreshCw,
  Terminal
} from "lucide-react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import {
  ACTIVE_RUN_STATUSES,
  EMPTY_COUNT,
  formatElapsedDuration,
  HOST_IP_COPY_KEY,
  isErrorLogLine,
  lifecycleStepsForRun,
  LOG_COPY_KEY,
  splitLogLines
} from "@/components/releases/releaseHelpers";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostRun, RunLog } from "@/types";
import { cx, formatDateTime } from "@/utils";

const PREVIEW_MAX_LINES = 18;

export function HostDiagnosticInspector({
  log,
  logError,
  logLoading,
  modalOpenForRun,
  onOpenFullLog,
  onRefreshLog,
  run
}: {
  log: RunLog | null;
  logError: string | null;
  logLoading: boolean;
  modalOpenForRun: boolean;
  onOpenFullLog: (run: HostRun) => void;
  onRefreshLog: (run: HostRun) => void;
  run: HostRun;
}) {
  const { copiedKey, copyText } = useCopyFeedback();
  const ipCopied = copiedKey === HOST_IP_COPY_KEY;
  const logCopied = copiedKey === LOG_COPY_KEY;
  const steps = lifecycleStepsForRun(run.status);
  const isActive = ACTIVE_RUN_STATUSES.has(run.status);
  const elapsed = formatElapsedDuration(run.startedAt, run.lastCheckedAt ?? run.updatedAt);
  const rawLog = log?.lastLogTail ?? null;
  const allLines = splitLogLines(rawLog);
  const previewLines = allLines.slice(-PREVIEW_MAX_LINES);
  const previewStartIndex = Math.max(EMPTY_COUNT, allLines.length - previewLines.length);

  return (
    <aside
      aria-label={`Diagnostic inspector for ${run.hostName}`}
      className="grid gap-4 p-5 xl:sticky xl:top-20 xl:self-start"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-base-content">{run.hostName}</h3>
            <StatusBadge value={run.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="break-all text-xs text-base-content/65">{run.hostIp}</code>
            <button
              aria-label={`Copy IP for ${run.hostName}`}
              className="btn btn-ghost btn-xs h-6 min-h-6 gap-1 border border-base-300 px-2 text-[0.68rem]"
              onClick={() => void copyText(HOST_IP_COPY_KEY, run.hostIp)}
              type="button"
            >
              {ipCopied ? (
                <Check aria-hidden="true" className="text-success" size={11} />
              ) : (
                <Copy aria-hidden="true" size={11} />
              )}
              {ipCopied ? "Copied" : "Copy IP"}
            </button>
          </div>
        </div>

        <button
          className="btn btn-sm gap-1.5"
          onClick={() => onOpenFullLog(run)}
          type="button"
        >
          <Maximize2 aria-hidden="true" size={13} />
          Full terminal
        </button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-200/35 px-3 py-3">
        <ul className="steps steps-horizontal w-full text-xs font-semibold">
          {steps.map((step) => (
            <li className={cx("step", step.tone)} key={step.key}>
              {step.label}
            </li>
          ))}
        </ul>
      </div>

      <dl className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-field border border-base-300 bg-base-200/30 px-3 py-2">
          <dt className="text-[0.68rem] font-bold uppercase text-base-content/50">Started</dt>
          <dd className="mt-0.5 font-semibold text-base-content/85">
            {formatDateTime(run.startedAt)}
          </dd>
        </div>
        <div className="rounded-field border border-base-300 bg-base-200/30 px-3 py-2">
          <dt className="text-[0.68rem] font-bold uppercase text-base-content/50">
            {elapsed ? "Elapsed" : "Last checked"}
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-base-content/85">
            {elapsed ?? formatDateTime(run.lastCheckedAt)}
          </dd>
        </div>
        <div className="rounded-field border border-base-300 bg-base-200/30 px-3 py-2">
          <dt className="text-[0.68rem] font-bold uppercase text-base-content/50">Last checked</dt>
          <dd className="mt-0.5 font-semibold text-base-content/85">
            {formatDateTime(run.lastCheckedAt)}
          </dd>
        </div>
        <div className="rounded-field border border-base-300 bg-base-200/30 px-3 py-2">
          <dt className="text-[0.68rem] font-bold uppercase text-base-content/50">
            {isActive ? "Next check" : "Deadline"}
          </dt>
          <dd
            className={cx(
              "mt-0.5 font-semibold",
              isActive && run.nextCheckAt ? "text-info" : "text-base-content/85"
            )}
          >
            {isActive ? formatDateTime(run.nextCheckAt) : formatDateTime(run.deadlineAt)}
          </dd>
        </div>
      </dl>

      {run.errorMessage ? (
        <div className="alert alert-error alert-soft flex items-start gap-2 rounded-field border border-error/25 px-3 py-2.5 text-xs leading-5">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
          <p className="min-w-0 break-words font-medium">{run.errorMessage}</p>
        </div>
      ) : null}

      {run.lastAiStatus !== null || run.lastAiReason !== null ? (
        <div className="rounded-field border border-base-300 bg-base-200/35 px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-base-content/70">AI verification verdict</span>
            <StatusBadge value={run.lastAiStatus} />
          </div>
          {run.lastAiReason ? (
            <p className="mt-2 break-words text-xs leading-5 text-base-content/80">
              {run.lastAiReason}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-box border border-neutral-content/15 bg-neutral text-neutral-content">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-content/15 bg-black/18 px-3 py-2 text-[0.7rem]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-content/80">
            <Terminal aria-hidden="true" size={13} />
            Live log tail
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-ghost btn-xs h-6 min-h-6 gap-1 px-2 text-neutral-content/80 hover:bg-neutral-content/10"
              disabled={!rawLog}
              onClick={() => {
                if (rawLog) {
                  void copyText(LOG_COPY_KEY, rawLog);
                }
              }}
              type="button"
            >
              {logCopied ? <Check aria-hidden="true" size={12} /> : <Copy aria-hidden="true" size={12} />}
              {logCopied ? "Copied" : "Copy"}
            </button>
            <button
              aria-label={`Refresh log for ${run.hostName}`}
              className="btn btn-ghost btn-xs btn-square h-6 min-h-6 text-neutral-content/80 hover:bg-neutral-content/10"
              disabled={logLoading}
              onClick={() => onRefreshLog(run)}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={logLoading ? "animate-spin" : undefined}
                size={12}
              />
            </button>
          </div>
        </div>

        {modalOpenForRun ? (
          <div className="flex min-h-36 items-center justify-center px-4 text-center text-xs text-neutral-content/65">
            Viewing this log in the full-screen terminal dialog.
          </div>
        ) : logError ? (
          <div className="bg-base-100 p-3 text-base-content">
            <ErrorAlert message={logError} onRetry={() => onRefreshLog(run)} />
          </div>
        ) : logLoading && !log ? (
          <div className="bg-base-100 text-base-content">
            <LoadingBlock label="Fetching log tail" />
          </div>
        ) : (
          <div className="scrollbar-thin max-h-64 min-h-36 overflow-auto p-3 font-mono text-xs leading-5">
            {previewLines.length > EMPTY_COUNT ? (
              <pre className="m-0 whitespace-pre-wrap break-words">
                <code>
                  {previewLines.map((line, index) => (
                    <span
                      className={cx(
                        "flex gap-2.5 rounded-xs px-1",
                        isErrorLogLine(line) && "bg-error/20"
                      )}
                      key={`${previewStartIndex + index}-${line}`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-6 shrink-0 select-none text-right tabular-nums text-neutral-content/40"
                      >
                        {previewStartIndex + index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{line === "" ? " " : line}</span>
                    </span>
                  ))}
                </code>
              </pre>
            ) : (
              <p className="p-1 text-neutral-content/60">No stored log output yet.</p>
            )}
          </div>
        )}
      </div>

      {log ? (
        <p className="flex items-center gap-1.5 text-[0.7rem] text-base-content/55">
          <Clock3 aria-hidden="true" size={12} />
          <span>Log updated {formatDateTime(log.updatedAt)}</span>
        </p>
      ) : null}
    </aside>
  );
}
