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
import { HostRunBadge } from "@/components/releases/HostRunBadge";
import {
  EMPTY_COUNT,
  isErrorLogLine,
  LOG_COPY_KEY,
  splitLogLines
} from "@/components/releases/releaseHelpers";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { NumberedLogLine } from "@/components/ui/NumberedLogLine";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TerminalFrame } from "@/components/ui/TerminalFrame";
import type { HostRun, RunLog } from "@/types";
import { formatDateTime } from "@/utils";

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
  const [label, emptyMessage] = totalLines > EMPTY_COUNT
    ? [countLabel, "No log lines match the current filter."]
    : ["Empty", "No stored log output."];

  return (
    <TerminalFrame
      actions={<span className="tabular-nums text-neutral-content/70">{label}</span>}
      icon={Terminal}
      title="Captured log tail"
      viewportClassName="max-h-[54vh] min-h-52"
    >
      {visibleLines.length === EMPTY_COUNT ? (
        <p className="p-2 font-sans text-neutral-content/70">{emptyMessage}</p>
      ) : (
        <pre
          className="whitespace-pre data-[wrap=true]:whitespace-pre-wrap data-[wrap=true]:wrap-anywhere"
          data-wrap={wrapLines}
        >
          <code>
            {visibleLines.map(({ number, text, isError }) => (
              <NumberedLogLine isError={isError} key={number} number={number} text={text} />
            ))}
          </code>
        </pre>
      )}
    </TerminalFrame>
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
        <Search aria-hidden="true" className="shrink-0 text-muted" size={14} />
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
            className="text-muted hover:text-base-content"
            onClick={() => onQueryChange("")}
            type="button"
          >
            <X aria-hidden="true" size={14} />
          </button>
        ) : null}
      </label>

      <button
        aria-pressed={errorsOnly}
        className="btn btn-sm gap-1.5 aria-pressed:border-error/40 aria-pressed:bg-error/10 aria-pressed:text-error"
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
  const rawLog = log?.lastLogTail ?? "";

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
    return numberedLines.filter((line) =>
      (!errorsOnly || line.isError) && (!normalized || line.text.toLowerCase().includes(normalized))
    );
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

  if (run === null) return null;

  return (
    <FormModal kind="log" onClose={handleClose} open title={`Run log: ${run.hostName}`}>
      <div className="grid grid-cols-1 gap-3.5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <HostRunBadge status={run.status} />
            <span className="break-all font-mono text-xs text-muted">{run.hostIp}</span>
            {run.lastAiStatus && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span aria-hidden="true">·</span>
                <span>AI</span>
                <StatusBadge value={run.lastAiStatus} />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-pressed={wrapLines}
              className="btn btn-sm gap-1.5 aria-pressed:border-info/40 aria-pressed:bg-info/10 aria-pressed:text-info"
              onClick={() => setWrapLines((current) => !current)}
              type="button"
            >
              <WrapText aria-hidden="true" size={14} />
              Wrap
            </button>
            <button
              className="btn btn-sm gap-1.5"
              disabled={!rawLog}
              onClick={() => void copyText(LOG_COPY_KEY, rawLog)}
              type="button"
            >
              {copied ? (
                <><Check aria-hidden="true" className="text-success" size={14} />Copied</>
              ) : (
                <><Copy aria-hidden="true" size={14} />Copy log</>
              )}
            </button>
            <button
              className="btn group btn-sm gap-1.5"
              disabled={loading}
              onClick={onRefresh}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="group-disabled:animate-spin" size={14} />
              Refresh
            </button>
          </div>
        </div>

        {run.errorMessage && (
          <div className="alert alert-error alert-soft flex items-start gap-2 rounded-field border border-error/25 px-3 py-2 text-xs leading-5">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
            <p className="min-w-0 wrap-anywhere font-medium">{run.errorMessage}</p>
          </div>
        )}
        {run.lastAiReason && (
          <p className="text-xs leading-5 text-muted wrap-anywhere">
            <strong className="mr-1.5 text-base-content">AI verdict:</strong>
            {run.lastAiReason}
          </p>
        )}
        {error && <ErrorAlert message={error} onRetry={onRefresh} />}
        {loading && !log && <LoadingBlock label="Loading run log" />}
        {numberedLines.length > EMPTY_COUNT && (
          <LogSearchControls
            errorLineCount={errorLineCount}
            errorsOnly={errorsOnly}
            onQueryChange={setSearchQuery}
            onToggleErrorsOnly={() => setErrorsOnly((current) => !current)}
            searchQuery={searchQuery}
          />
        )}
        {log && (
          <>
            <LogTerminalBody
              countLabel={countLabel}
              totalLines={numberedLines.length}
              visibleLines={visibleLines}
              wrapLines={wrapLines}
            />
            <p className="text-xs text-muted">
              Last checked {formatDateTime(log.lastCheckedAt)} · Updated{" "}
              {formatDateTime(log.updatedAt)}
            </p>
          </>
        )}
      </div>
    </FormModal>
  );
}
