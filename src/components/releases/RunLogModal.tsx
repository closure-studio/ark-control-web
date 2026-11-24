import {
  AlertTriangle,
  Check,
  Copy,
  RefreshCw,
  Terminal,
  WrapText
} from "lucide-react";
import { useState } from "react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import {
  EMPTY_COUNT,
  isErrorLogLine,
  LOG_COPY_KEY,
  splitLogLines
} from "@/components/releases/releaseHelpers";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostRun, RunLog } from "@/types";
import { cx, formatDateTime } from "@/utils";

export function RunLogModal({
  error,
  loading,
  log,
  onClose,
  onRefresh,
  run
}: {
  error: string | null;
  loading: boolean;
  log: RunLog | null;
  onClose: () => void;
  onRefresh: () => void;
  run: HostRun | null;
}) {
  const [wrapLines, setWrapLines] = useState(true);
  const { copiedKey, copyText } = useCopyFeedback();
  const copied = copiedKey === LOG_COPY_KEY;
  const rawLog = log?.lastLogTail ?? null;
  const lines = splitLogLines(rawLog);
  const lineCountLabel =
    lines.length === 1 ? "1 line" : `${lines.length} lines`;

  return (
    <FormModal
      onClose={onClose}
      open={run !== null}
      title={run ? `Run log: ${run.hostName}` : "Run log"}
      width="max-w-4xl"
    >
      <div className="grid gap-3.5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge value={run?.status} />
            <span className="break-all font-mono text-xs text-base-content/65">
              {run?.hostIp}
            </span>
            {run?.lastAiStatus ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-base-content/55">
                <span aria-hidden="true">·</span>
                <span>AI</span>
                <StatusBadge value={run.lastAiStatus} />
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-pressed={wrapLines}
              className={cx(
                "btn btn-sm gap-1.5",
                wrapLines && "btn-info btn-soft border border-info/40"
              )}
              onClick={() => setWrapLines((current) => !current)}
              type="button"
            >
              <WrapText aria-hidden="true" size={14} />
              Wrap
            </button>
            <button
              className="btn btn-sm gap-1.5"
              disabled={!rawLog}
              onClick={() => {
                if (rawLog) {
                  void copyText(LOG_COPY_KEY, rawLog);
                }
              }}
              type="button"
            >
              {copied ? (
                <Check aria-hidden="true" className="text-success" size={14} />
              ) : (
                <Copy aria-hidden="true" size={14} />
              )}
              {copied ? "Copied" : "Copy log"}
            </button>
            <button
              className="btn btn-sm gap-1.5"
              disabled={loading}
              onClick={onRefresh}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={loading ? "animate-spin" : undefined}
                size={14}
              />
              Refresh
            </button>
          </div>
        </div>

        {run?.errorMessage ? (
          <div className="alert alert-error alert-soft flex items-start gap-2 rounded-field border border-error/25 px-3 py-2 text-xs leading-5">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
            <p className="min-w-0 break-words font-medium">{run.errorMessage}</p>
          </div>
        ) : null}

        {run?.lastAiReason ? (
          <p className="rounded-field border border-base-300 bg-base-200/45 px-3 py-2 text-xs leading-5 text-base-content/75">
            <strong className="mr-1.5 text-base-content">AI verdict:</strong>
            {run.lastAiReason}
          </p>
        ) : null}

        {error ? <ErrorAlert message={error} onRetry={onRefresh} /> : null}
        {loading && !log ? <LoadingBlock label="Loading run log" /> : null}

        {log ? (
          <>
            <div className="overflow-hidden rounded-box border border-neutral-content/15 bg-neutral text-neutral-content">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-content/14 bg-black/16 px-3.5 py-2 text-[0.7rem] text-neutral-content/70">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Terminal aria-hidden="true" size={13} />
                  Captured log tail
                </span>
                <span className="tabular-nums">
                  {lines.length > EMPTY_COUNT ? lineCountLabel : "Empty"}
                </span>
              </div>

              <div className="scrollbar-thin max-h-[58vh] min-h-52 overflow-auto p-3 font-mono text-xs leading-6">
                {lines.length > EMPTY_COUNT ? (
                  <pre className={cx("m-0", wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                    <code>
                      {lines.map((line, index) => (
                        <span
                          className={cx(
                            "flex gap-3 rounded-sm px-1.5",
                            isErrorLogLine(line) && "bg-error/20"
                          )}
                          key={`${index}-${line}`}
                        >
                          <span
                            aria-hidden="true"
                            className="w-7 shrink-0 select-none text-right tabular-nums text-neutral-content/40"
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">{line === "" ? " " : line}</span>
                        </span>
                      ))}
                    </code>
                  </pre>
                ) : (
                  <p className="p-2 text-neutral-content/60">No stored log output.</p>
                )}
              </div>
            </div>

            <p className="text-xs text-base-content/55">
              Last checked {formatDateTime(log.lastCheckedAt)} · Updated {formatDateTime(log.updatedAt)}
            </p>
          </>
        ) : null}
      </div>
    </FormModal>
  );
}
