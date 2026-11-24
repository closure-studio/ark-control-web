import {
  AlertTriangle,
  Check,
  Copy,
  RefreshCw,
  Search,
  Terminal,
  WrapText,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
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

interface NumberedLine {
  number: number;
  text: string;
  isError: boolean;
}

function LogTerminalBody({
  countLabel,
  totalLines,
  visibleLines,
  wrapLines
}: {
  countLabel: string;
  totalLines: number;
  visibleLines: NumberedLine[];
  wrapLines: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-box border border-neutral-content/15 bg-neutral text-neutral-content">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-content/14 bg-black/16 px-3.5 py-2 text-[0.7rem] text-neutral-content/70">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Terminal aria-hidden="true" size={13} />
          Captured log tail
        </span>
        <span className="tabular-nums">
          {totalLines > EMPTY_COUNT ? countLabel : "Empty"}
        </span>
      </div>

      <div className="scrollbar-thin max-h-[54vh] min-h-52 overflow-auto p-3 font-mono text-xs leading-6">
        {totalLines === EMPTY_COUNT ? (
          <p className="p-2 text-neutral-content/60">No stored log output.</p>
        ) : visibleLines.length === EMPTY_COUNT ? (
          <p className="p-2 text-neutral-content/60">No log lines match the current filter.</p>
        ) : (
          <pre
            className={cx(
              "m-0",
              wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}
          >
            <code>
              {visibleLines.map((line) => (
                <span
                  className={cx(
                    "flex gap-3 rounded-sm px-1.5",
                    line.isError && "bg-error/20"
                  )}
                  key={`${line.number}-${line.text}`}
                >
                  <span
                    aria-hidden="true"
                    className="w-7 shrink-0 select-none text-right tabular-nums text-neutral-content/40"
                  >
                    {line.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    {line.text === "" ? " " : line.text}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}

function LogSearchControls({
  errorLineCount,
  errorsOnly,
  onQueryChange,
  onToggleErrorsOnly,
  searchQuery
}: {
  errorLineCount: number;
  errorsOnly: boolean;
  onQueryChange: (value: string) => void;
  onToggleErrorsOnly: () => void;
  searchQuery: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label className="input input-sm flex w-full items-center gap-2 sm:w-72">
        <Search aria-hidden="true" className="shrink-0 text-base-content/45" size={14} />
        <input
          aria-label="Filter log output"
          className="min-w-0 grow"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter log lines"
          value={searchQuery}
        />
        {searchQuery !== "" ? (
          <button
            aria-label="Clear log filter"
            className="text-base-content/45 hover:text-base-content"
            onClick={() => onQueryChange("")}
            type="button"
          >
            <X aria-hidden="true" size={14} />
          </button>
        ) : null}
      </label>

      <button
        aria-pressed={errorsOnly}
        className={cx(
          "btn btn-sm gap-1.5",
          errorsOnly && "btn-error btn-soft border border-error/40"
        )}
        disabled={errorLineCount === EMPTY_COUNT && !errorsOnly}
        onClick={onToggleErrorsOnly}
        type="button"
      >
        <AlertTriangle aria-hidden="true" size={13} />
        Errors only ({errorLineCount})
      </button>
    </div>
  );
}

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
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { copiedKey, copyText } = useCopyFeedback();
  const copied = copiedKey === LOG_COPY_KEY;
  const rawLog = log?.lastLogTail ?? null;

  const numberedLines = useMemo<NumberedLine[]>(
    () =>
      splitLogLines(rawLog).map((text, index) => ({
        number: index + 1,
        text,
        isError: isErrorLogLine(text)
      })),
    [rawLog]
  );

  const errorLineCount = useMemo(
    () => numberedLines.filter((line) => line.isError).length,
    [numberedLines]
  );

  const visibleLines = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return numberedLines.filter((line) => {
      if (errorsOnly && !line.isError) return false;
      if (normalized !== "" && !line.text.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [errorsOnly, numberedLines, searchQuery]);

  const totalLabel =
    numberedLines.length === 1 ? "1 line" : `${numberedLines.length} lines`;
  const countLabel =
    visibleLines.length === numberedLines.length
      ? totalLabel
      : `${visibleLines.length} of ${totalLabel}`;

  function handleClose() {
    setSearchQuery("");
    setErrorsOnly(false);
    onClose();
  }

  return (
    <FormModal
      onClose={handleClose}
      open={run !== null}
      title={run ? `Run log: ${run.hostName}` : "Run log"}
      width="max-w-5xl"
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
            {numberedLines.length > EMPTY_COUNT ? (
              <LogSearchControls
                errorLineCount={errorLineCount}
                errorsOnly={errorsOnly}
                onQueryChange={setSearchQuery}
                onToggleErrorsOnly={() => setErrorsOnly((current) => !current)}
                searchQuery={searchQuery}
              />
            ) : null}

            <LogTerminalBody
              countLabel={countLabel}
              totalLines={numberedLines.length}
              visibleLines={visibleLines}
              wrapLines={wrapLines}
            />

            <p className="text-xs text-base-content/55">
              Last checked {formatDateTime(log.lastCheckedAt)} · Updated{" "}
              {formatDateTime(log.updatedAt)}
            </p>
          </>
        ) : null}
      </div>
    </FormModal>
  );
}
