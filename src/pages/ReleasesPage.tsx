import { Activity, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "@/api/client";
import { HostRunRow } from "@/components/releases/HostRunRow";
import { ReleaseDetailHeader } from "@/components/releases/ReleaseDetailHeader";
import {
  ACTIVE_RUN_STATUSES,
  EMPTY_COUNT,
  FIRST_PAGE_OFFSET,
  matchesRunFilter,
  PAGE_SIZE,
  RELEASE_POLL_INTERVAL_MS,
  RELEASE_POLL_INTERVAL_SECONDS,
  RUN_FILTER_ACTIVE,
  RUN_FILTER_ALL,
  RUN_FILTER_ATTENTION,
  RUN_FILTER_SUCCEEDED,
  summarizeRunFilters,
  type RunFilter,
  type RunFilterCounts
} from "@/components/releases/releaseHelpers";
import { ReleaseRail } from "@/components/releases/ReleaseRail";
import { RunLogModal } from "@/components/releases/RunLogModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { usePolling } from "@/hooks/usePolling";
import type { HostRun, ReleaseSummary, RunLog } from "@/types";
import { cx, messageForError } from "@/utils";

const FILTER_OPTIONS: ReadonlyArray<{
  key: RunFilter;
  label: string;
  countTone: string;
}> = [
  { key: RUN_FILTER_ALL, label: "All", countTone: "text-base-content/55" },
  { key: RUN_FILTER_ATTENTION, label: "Attention", countTone: "text-error" },
  { key: RUN_FILTER_ACTIVE, label: "Active", countTone: "text-info" },
  { key: RUN_FILTER_SUCCEEDED, label: "Succeeded", countTone: "text-success" }
];

function RunFilterBar({
  counts,
  filter,
  onClear,
  onFilterChange,
  onQueryChange,
  query
}: {
  counts: RunFilterCounts;
  filter: RunFilter;
  onClear: () => void;
  onFilterChange: (next: RunFilter) => void;
  onQueryChange: (next: string) => void;
  query: string;
}) {
  const filtersActive = filter !== RUN_FILTER_ALL || query.trim() !== "";

  return (
    <div className="flex flex-col gap-3 border-b border-base-300 bg-base-200/25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div
        aria-label="Filter host runs by status"
        className="grid grid-cols-2 gap-1 rounded-field border border-base-300 bg-base-200/60 p-1 sm:flex sm:items-center"
        role="group"
      >
        {FILTER_OPTIONS.map((option) => {
          const active = filter === option.key;
          const count = counts[option.key];
          return (
            <button
              aria-pressed={active}
              className={cx(
                "inline-flex items-center justify-center gap-1.5 rounded-field border px-2.5 py-1 text-xs font-bold transition-colors",
                active
                  ? "border-base-content/20 bg-base-100 text-base-content shadow-2xs"
                  : "border-transparent text-base-content/65 hover:bg-base-content/6 hover:text-base-content"
              )}
              key={option.key}
              onClick={() => onFilterChange(option.key)}
              type="button"
            >
              <span>{option.label}</span>
              <span
                className={cx(
                  "text-[0.7rem] tabular-nums",
                  count > EMPTY_COUNT ? option.countTone : "text-base-content/40"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label className="input input-sm flex w-full items-center gap-2 sm:w-64">
          <Search aria-hidden="true" className="shrink-0 text-base-content/45" size={14} />
          <input
            aria-label="Search host runs"
            className="min-w-0 grow"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search host, IP, or error"
            value={query}
          />
          {query !== "" ? (
            <button
              aria-label="Clear search"
              className="text-base-content/45 transition-colors hover:text-base-content"
              onClick={() => onQueryChange("")}
              type="button"
            >
              <X aria-hidden="true" size={14} />
            </button>
          ) : null}
        </label>
        {filtersActive ? (
          <button
            className="btn btn-ghost btn-sm shrink-0 px-2"
            onClick={onClear}
            type="button"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ReleasesPage({ api }: { api: ApiClient }) {
  const [offset, setOffset] = useState(FIRST_PAGE_OFFSET);
  const [releases, setReleases] = useState<ReleaseSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [runs, setRuns] = useState<HostRun[]>([]);
  const [runFilter, setRunFilter] = useState<RunFilter>(RUN_FILTER_ALL);
  const [runQuery, setRunQuery] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<HostRun | null>(null);
  const [log, setLog] = useState<RunLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const selectedRelease = useMemo(
    () => releases.find((release) => release.id === selectedId) ?? null,
    [releases, selectedId]
  );
  const hasActiveRuns = runs.some((run) => ACTIVE_RUN_STATUSES.has(run.status));
  const filterCounts = useMemo(() => summarizeRunFilters(runs), [runs]);
  const filteredRuns = useMemo(
    () => runs.filter((run) => matchesRunFilter(run, runFilter, runQuery)),
    [runs, runFilter, runQuery]
  );

  const loadReleases = useCallback(
    async (showLoading = true) => {
      if (showLoading) setReleaseLoading(true);
      try {
        const response = await api.listReleases(PAGE_SIZE, offset);
        setReleases(response.releases);
        setSelectedId((current) =>
          current && response.releases.some((release) => release.id === current)
            ? current
            : response.releases[0]?.id ?? null
        );
        setReleaseError(null);
      } catch (error) {
        setReleaseError(messageForError(error, "Unable to load releases."));
      } finally {
        setReleaseLoading(false);
      }
    },
    [api, offset]
  );

  const loadRuns = useCallback(
    async (showLoading = true) => {
      if (!selectedId) {
        setRuns([]);
        return;
      }
      if (showLoading) setRunsLoading(true);
      try {
        const response = await api.listReleaseRuns(selectedId);
        setRuns(response.runs);
        setRunsError(null);
      } catch (error) {
        setRunsError(messageForError(error, "Unable to load release runs."));
      } finally {
        setRunsLoading(false);
      }
    },
    [api, selectedId]
  );

  useEffect(() => {
    void loadReleases(true);
  }, [loadReleases]);

  useEffect(() => {
    setRuns([]);
    setSelectedRun(null);
    setRunFilter(RUN_FILTER_ALL);
    setRunQuery("");
    void loadRuns(true);
  }, [loadRuns]);

  usePolling(
    () => {
      void loadRuns(false);
      void loadReleases(false);
    },
    RELEASE_POLL_INTERVAL_MS,
    hasActiveRuns
  );

  async function refreshAll() {
    await Promise.all([loadReleases(true), loadRuns(true)]);
  }

  async function loadLog(run: HostRun, showLoading = true) {
    if (showLoading) setLogLoading(true);
    setLogError(null);
    try {
      const response = await api.getRunLog(run.id);
      setLog(response);
    } catch (error) {
      setLogError(messageForError(error, "Unable to load run log."));
    } finally {
      setLogLoading(false);
    }
  }

  function openLog(run: HostRun) {
    setSelectedRun(run);
    setLog(null);
    void loadLog(run);
  }

  function clearFilters() {
    setRunFilter(RUN_FILTER_ALL);
    setRunQuery("");
  }

  return (
    <div className="min-w-0">
      <PageHeader
        actions={(
          <>
            {hasActiveRuns ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-field border border-info/30 bg-info/10 px-2.5 text-xs font-bold text-info">
                <Activity aria-hidden="true" size={14} />
                Live · {RELEASE_POLL_INTERVAL_SECONDS}s
              </span>
            ) : null}
            <RefreshButton loading={releaseLoading} onClick={() => void refreshAll()} />
          </>
        )}
        description="APK release rollouts, host verification telemetry, and live deployment logs."
        title="Releases"
      />

      <div className="grid gap-5">
        {releaseError ? (
          <ErrorAlert message={releaseError} onRetry={() => void loadReleases(true)} />
        ) : null}

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
          <ReleaseRail
            loading={releaseLoading}
            offset={offset}
            onNextPage={() => setOffset((current) => current + PAGE_SIZE)}
            onPreviousPage={() =>
              setOffset((current) => Math.max(FIRST_PAGE_OFFSET, current - PAGE_SIZE))
            }
            onSelect={setSelectedId}
            releases={releases}
            selectedId={selectedId}
          />

          <section
            aria-labelledby="release-runs-title"
            className="card card-border min-w-0 overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
          >
            {selectedRelease ? (
              <>
                <ReleaseDetailHeader
                  onRefreshRuns={() => void loadRuns(true)}
                  release={selectedRelease}
                  runsLoading={runsLoading}
                />

                {runs.length > EMPTY_COUNT ? (
                  <RunFilterBar
                    counts={filterCounts}
                    filter={runFilter}
                    onClear={clearFilters}
                    onFilterChange={setRunFilter}
                    onQueryChange={setRunQuery}
                    query={runQuery}
                  />
                ) : null}

                {runsError ? (
                  <div className="p-4 sm:p-5">
                    <ErrorAlert message={runsError} onRetry={() => void loadRuns(true)} />
                  </div>
                ) : null}

                {runsLoading && runs.length === EMPTY_COUNT ? (
                  <LoadingBlock label="Loading host runs" />
                ) : null}

                {!runsLoading && runs.length === EMPTY_COUNT && !runsError ? (
                  <EmptyState
                    detail="This release has no host deployment records."
                    title="No host runs"
                  />
                ) : null}

                {runs.length > EMPTY_COUNT && filteredRuns.length === EMPTY_COUNT ? (
                  <div className="grid min-h-44 place-items-center px-6 py-8 text-center">
                    <div>
                      <p className="font-extrabold text-base-content">No matching host runs</p>
                      <p className="mt-1 text-xs text-base-content/60">
                        Adjust the status filter or search query to inspect other hosts.
                      </p>
                      <button
                        className="btn btn-sm mt-4"
                        onClick={clearFilters}
                        type="button"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                ) : null}

                {filteredRuns.length > EMPTY_COUNT ? (
                  <div className="divide-y divide-base-300">
                    {filteredRuns.map((run) => (
                      <HostRunRow key={run.id} onOpenLog={openLog} run={run} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="p-5 sm:p-6">
                <h2 className="sr-only" id="release-runs-title">
                  Host deployments
                </h2>
                <EmptyState
                  detail="Choose a release from the history rail to inspect host deployments."
                  title="No release selected"
                />
              </div>
            )}
          </section>
        </div>
      </div>

      <RunLogModal
        error={logError}
        loading={logLoading}
        log={log}
        onClose={() => {
          setSelectedRun(null);
          setLog(null);
          setLogError(null);
        }}
        onRefresh={() => (selectedRun ? void loadLog(selectedRun) : undefined)}
        run={selectedRun}
      />
    </div>
  );
}
