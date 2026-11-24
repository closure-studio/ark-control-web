import {
  AlertTriangle,
  Check,
  Clock3,
  Copy,
  Maximize2,
  RefreshCw,
  Terminal
} from "lucide-react";
import type { ReactNode } from "react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { HostRunBadge } from "@/components/releases/HostRunBadge";
import {
  ACTIVE_RUN_STATUSES,
  EMPTY_COUNT,
  formatElapsedDuration,
  HOST_IP_COPY_KEY,
  HOST_RUN_PRESENTATION,
  isErrorLogLine,
  LOG_COPY_KEY,
  splitLogLines
} from "@/components/releases/releaseHelpers";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { NumberedLogLine } from "@/components/ui/NumberedLogLine";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TerminalFrame } from "@/components/ui/TerminalFrame";
import type { HostRun, HostRunStatus, RunLog } from "@/types";
import { cx, formatDateTime } from "@/utils";

const PREVIEW_MAX_LINES = 18;

function RunLifecycle({ status }: { status: HostRunStatus }) {
  const { lifecycle, stepClassName } = HOST_RUN_PRESENTATION[status];
  return (
    <ul className="steps steps-horizontal w-full text-xs font-semibold">
      {lifecycle.map(({ label, reached }) => (
        <li className={cx("step", reached && stepClassName)} key={label}>{label}</li>
      ))}
    </ul>
  );
}

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
  const isActive = ACTIVE_RUN_STATUSES.has(run.status);
  const lastChecked = formatDateTime(run.lastCheckedAt);
  const elapsed = formatElapsedDuration(run.startedAt, run.lastCheckedAt ?? run.updatedAt);
  const [scheduleLabel, scheduleDate] = isActive
    ? ["Next check", run.nextCheckAt]
    : ["Deadline", run.deadlineAt];
  const timestamps = [
    ["Started", formatDateTime(run.startedAt)],
    elapsed === null ? ["Last checked", lastChecked] : ["Elapsed", elapsed],
    ["Last checked", lastChecked],
    [scheduleLabel, formatDateTime(scheduleDate)]
  ];

  const rawLog = log?.lastLogTail ?? "";
  const refreshLog = () => onRefreshLog(run);
  let preview: ReactNode;
  if (modalOpenForRun) {
    preview = (
      <div className="grid min-h-28 place-items-center text-center font-sans text-neutral-content/70">
        Viewing this log in the full-screen terminal dialog.
      </div>
    );
  } else if (logError) {
    preview = <div className="font-sans"><ErrorAlert message={logError} onRetry={refreshLog} /></div>;
  } else if (logLoading && !log) {
    preview = (
      <div className="font-sans [&>div]:border-neutral-content/15 [&>div]:text-neutral-content/70">
        <LoadingBlock label="Fetching log tail" />
      </div>
    );
  } else if (rawLog) {
    const allLines = splitLogLines(rawLog);
    const startIndex = Math.max(EMPTY_COUNT, allLines.length - PREVIEW_MAX_LINES);
    preview = (
      <pre className="whitespace-pre-wrap wrap-anywhere">
        <code>
          {allLines.slice(startIndex).map((text, index) => (
            <NumberedLogLine
              isError={isErrorLogLine(text)}
              key={startIndex + index}
              number={startIndex + index + 1}
              text={text}
            />
          ))}
        </code>
      </pre>
    );
  } else {
    preview = <p className="p-1 font-sans text-neutral-content/70">No stored log output yet.</p>;
  }

  return (
    <aside
      aria-label={`Diagnostic inspector for ${run.hostName}`}
      className="grid grid-cols-1 gap-4 p-5 xl:sticky xl:top-20 xl:self-start"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-black text-base-content">{run.hostName}</h3>
            <HostRunBadge status={run.status} />
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
                <><Check aria-hidden="true" className="text-success" size={11} />Copied</>
              ) : (
                <><Copy aria-hidden="true" size={11} />Copy IP</>
              )}
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
        <RunLifecycle status={run.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
        {timestamps.map(([label, value], index) => (
          <div key={index}>
            <dt className="text-[0.68rem] font-bold uppercase text-muted">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-base-content">{value}</dd>
          </div>
        ))}
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

      <TerminalFrame
        actions={
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-ghost btn-xs h-6 min-h-6 gap-1 px-2 text-neutral-content/80 hover:bg-neutral-content/10"
              disabled={!rawLog}
              onClick={() => void copyText(LOG_COPY_KEY, rawLog)}
              type="button"
            >
              {logCopied ? (
                <><Check aria-hidden="true" size={12} />Copied</>
              ) : (
                <><Copy aria-hidden="true" size={12} />Copy</>
              )}
            </button>
            <button
              aria-label={`Refresh log for ${run.hostName}`}
              className="btn group btn-ghost btn-xs btn-square h-6 min-h-6 text-neutral-content/80 hover:bg-neutral-content/10"
              disabled={logLoading}
              onClick={refreshLog}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="group-disabled:animate-spin" size={12} />
            </button>
          </div>
        }
        icon={Terminal}
        title="Live log tail"
        viewportClassName="max-h-64 min-h-36"
      >
        {preview}
      </TerminalFrame>

      {log ? (
        <p className="flex items-center gap-1.5 text-[0.7rem] text-base-content/55">
          <Clock3 aria-hidden="true" size={12} />
          <span>Log updated {formatDateTime(log.updatedAt)}</span>
        </p>
      ) : null}
    </aside>
  );
}
