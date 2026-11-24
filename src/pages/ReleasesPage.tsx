import { Activity, Columns2, Search, Table2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiClient } from "@/api/client";
import { HostDiagnosticInspector } from "@/components/releases/HostDiagnosticInspector";
import { HostMatrixTable } from "@/components/releases/HostMatrixTable";
import { HostRosterItem } from "@/components/releases/HostRosterItem";
import { ReleaseHeroBanner } from "@/components/releases/ReleaseHeroBanner";
import { ReleaseTimelineStrip } from "@/components/releases/ReleaseTimelineStrip";
import {
  ACTIVE_RUN_STATUSES,
  EMPTY_COUNT,
  FIRST_PAGE_OFFSET,
  HOST_RUN_PRESENTATION,
  matchesRunFilter,
  PAGE_SIZE,
  RELEASE_POLL_INTERVAL_MS,
  RELEASE_POLL_INTERVAL_SECONDS,
  RUN_FILTER_ACTIVE,
  RUN_FILTER_ALL,
  RUN_FILTER_ATTENTION,
  RUN_FILTER_SUCCEEDED,
  summarizeRunFilters,
  VIEW_MODE_MATRIX,
  VIEW_MODE_SPLIT,
  type RunFilter,
  type RunFilterCounts,
  type WorkbenchViewMode
} from "@/components/releases/releaseHelpers";
import { RunLogModal } from "@/components/releases/RunLogModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { usePolling } from "@/hooks/usePolling";
import type { HostRun, ReleaseSummary, RunLog } from "@/types";
import { cx, messageForError } from "@/utils";

const succeededPresentation = HOST_RUN_PRESENTATION[RUN_FILTER_SUCCEEDED];
const FILTER_OPTIONS: ReadonlyArray<{
  key: RunFilter;
  label: string;
  countTone: string;
}> = [
  { key: RUN_FILTER_ALL, label: "All", countTone: "text-base-content/55" },
  { key: RUN_FILTER_ATTENTION, label: "Attention", countTone: "text-error" },
  { key: RUN_FILTER_ACTIVE, label: "Active", countTone: "text-info" },
  { key: RUN_FILTER_SUCCEEDED, label: succeededPresentation.label, countTone: succeededPresentation.textClassName }
];

function WorkbenchToolbar({
  counts,
  filter,
  onClear,
  onFilterChange,
  onQueryChange,
  onViewModeChange,
  query,
  viewMode
}: {
  counts: RunFilterCounts;
  filter: RunFilter;
  onClear: () => void;
  onFilterChange: (next: RunFilter) => void;
  onQueryChange: (next: string) => void;
  onViewModeChange: (next: WorkbenchViewMode) => void;
  query: string;
  viewMode: WorkbenchViewMode;
}) {
  const filtersActive = filter !== RUN_FILTER_ALL || query.trim() !== "";

  return (
    <div className="flex flex-col gap-3 border-b border-base-300 bg-base-200/30 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
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

      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-sm flex min-w-0 flex-1 items-center gap-2 sm:w-64 sm:flex-none">
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
          <button className="btn btn-ghost btn-sm shrink-0 px-2" onClick={onClear} type="button">
            Reset
          </button>
        ) : null}

        <div aria-label="Workbench layout" className="join shrink-0" role="group">
          <button
            aria-pressed={viewMode === VIEW_MODE_SPLIT}
            className={cx(
              "btn btn-sm join-item gap-1.5",
              viewMode === VIEW_MODE_SPLIT
                ? "btn-info btn-soft border border-info/40"
                : "bg-base-100"
            )}
            onClick={() => onViewModeChange(VIEW_MODE_SPLIT)}
            type="button"
          >
            <Columns2 aria-hidden="true" size={14} />
            <span className="hidden sm:inline">Inspector</span>
          </button>
          <button
            aria-pressed={viewMode === VIEW_MODE_MATRIX}
            className={cx(
              "btn btn-sm join-item gap-1.5",
              viewMode === VIEW_MODE_MATRIX
                ? "btn-info btn-soft border border-info/40"
                : "bg-base-100"
            )}
            onClick={() => onViewModeChange(VIEW_MODE_MATRIX)}
            type="button"
          >
            <Table2 aria-hidden="true" size={14} />
            <span className="hidden sm:inline">Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FleetWorkbenchBody({
  filteredRuns,
  inspectedLog,
  inspectedLogError,
  inspectedLogLoading,
  inspectedRun,
  modalOpenForInspected,
  onClearFilters,
  onInspectFromMatrix,
  onOpenLogModal,
  onRefreshLog,
  onRetryRuns,
  onSelectRun,
  runsCount,
  runsError,
  runsLoading,
  viewMode
}: {
  filteredRuns: HostRun[];
  inspectedLog: RunLog | null;
  inspectedLogError: string | null;
  inspectedLogLoading: boolean;
  inspectedRun: HostRun | null;
  modalOpenForInspected: boolean;
  onClearFilters: () => void;
  onInspectFromMatrix: (run: HostRun) => void;
  onOpenLogModal: (run: HostRun) => void;
  onRefreshLog: (run: HostRun) => void;
  onRetryRuns: () => void;
  onSelectRun: (run: HostRun) => void;
  runsCount: number;
  runsError: string | null;
  runsLoading: boolean;
  viewMode: WorkbenchViewMode;
}) {
  if (runsError) {
    return (
      <div className="p-4 sm:p-5">
        <ErrorAlert message={runsError} onRetry={onRetryRuns} />
      </div>
    );
  }
  if (runsLoading && runsCount === EMPTY_COUNT) {
    return <LoadingBlock label="Loading host runs" />;
  }
  if (runsCount === EMPTY_COUNT) {
    return (
      <EmptyState
        detail="This release has no host deployment records."
        title="No host runs"
      />
    );
  }
  if (filteredRuns.length === EMPTY_COUNT) {
    return (
      <div className="grid min-h-44 place-items-center px-6 py-8 text-center">
        <div>
          <p className="font-extrabold text-base-content">No matching host runs</p>
          <p className="mt-1 text-xs text-base-content/60">
            Adjust the status filter or search query to inspect other hosts.
          </p>
          <button className="btn btn-sm mt-4" onClick={onClearFilters} type="button">
            Clear filters
          </button>
        </div>
      </div>
    );
  }
  if (viewMode === VIEW_MODE_MATRIX) {
    return (
      <HostMatrixTable
        onInspect={onInspectFromMatrix}
        onOpenLog={onOpenLogModal}
        runs={filteredRuns}
      />
    );
  }

  return (
    <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
      <div className="divide-y divide-base-300 border-b border-base-300 xl:border-r xl:border-b-0">
        {filteredRuns.map((run) => (
          <HostRosterItem
            key={run.id}
            onOpenLog={onOpenLogModal}
            onSelect={onSelectRun}
            run={run}
            selected={inspectedRun?.id === run.id}
          />
        ))}
      </div>

      {inspectedRun ? (
        <HostDiagnosticInspector
          log={inspectedLog}
          logError={inspectedLogError}
          logLoading={inspectedLogLoading}
          modalOpenForRun={modalOpenForInspected}
          onOpenFullLog={onOpenLogModal}
          onRefreshLog={onRefreshLog}
          run={inspectedRun}
        />
      ) : null}
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
  const [viewMode, setViewMode] = useState<WorkbenchViewMode>(VIEW_MODE_SPLIT);
  const [inspectedRunId, setInspectedRunId] = useState<number | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [modalRunId, setModalRunId] = useState<number | null>(null);
  const [logCache, setLogCache] = useState<Record<number, RunLog>>({});
  const [logErrors, setLogErrors] = useState<Record<number, string>>({});
  const [loadingLogIds, setLoadingLogIds] = useState<Set<number>>(() => new Set());
  const requestedLogIdsRef = useRef<Set<number>>(new Set());

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
  const inspectedRun = useMemo(() => {
    if (filteredRuns.length === EMPTY_COUNT) return null;
    return filteredRuns.find((run) => run.id === inspectedRunId) ?? filteredRuns[0];
  }, [filteredRuns, inspectedRunId]);

  const modalRun = modalRunId === null ? null : runs.find((run) => run.id === modalRunId) ?? null;

  const fetchRunLog = useCallback(async (runId: number) => {
    requestedLogIdsRef.current.add(runId);
    setLoadingLogIds((current) => {
      const next = new Set(current);
      next.add(runId);
      return next;
    });
    setLogErrors((current) => {
      if (!(runId in current)) return current;
      const next = { ...current };
      delete next[runId];
      return next;
    });
    try {
      const response = await api.getRunLog(runId);
      setLogCache((current) => ({ ...current, [runId]: response }));
    } catch (error) {
      setLogErrors((current) => ({
        ...current,
        [runId]: messageForError(error, "Unable to load run log.")
      }));
    } finally {
      setLoadingLogIds((current) => {
        const next = new Set(current);
        next.delete(runId);
        return next;
      });
    }
  }, [api]);

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
        setModalRunId((id) => id !== null && response.runs.some((run) => run.id === id) ? id : null);
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
    setModalRunId(null);
    setInspectedRunId(null);
    setRunFilter(RUN_FILTER_ALL);
    setRunQuery("");
    requestedLogIdsRef.current = new Set();
    setLogCache({});
    setLogErrors({});
    void loadRuns(true);
  }, [loadRuns]);

  useEffect(() => {
    if (viewMode !== VIEW_MODE_SPLIT || !inspectedRun) return;
    if (requestedLogIdsRef.current.has(inspectedRun.id)) return;
    void fetchRunLog(inspectedRun.id);
  }, [fetchRunLog, inspectedRun, viewMode]);

  usePolling(
    () => {
      void loadRuns(false);
      void loadReleases(false);
      if (inspectedRun && ACTIVE_RUN_STATUSES.has(inspectedRun.status)) {
        void fetchRunLog(inspectedRun.id);
      }
    },
    RELEASE_POLL_INTERVAL_MS,
    hasActiveRuns
  );

  async function refreshAll() {
    await Promise.all([loadReleases(true), loadRuns(true)]);
  }

  function openLogModal(run: HostRun) {
    setInspectedRunId(run.id);
    setModalRunId(run.id);
    void fetchRunLog(run.id);
  }

  function inspectRunFromMatrix(run: HostRun) {
    setInspectedRunId(run.id);
    setViewMode(VIEW_MODE_SPLIT);
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
        description="Full-fleet APK release mission control, live host telemetry, and integrated diagnostic logs."
        title="Releases"
      />

      <div className="grid gap-5">
        {releaseError ? (
          <ErrorAlert message={releaseError} onRetry={() => void loadReleases(true)} />
        ) : null}

        <ReleaseTimelineStrip
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

        {selectedRelease ? (
          <>
            <ReleaseHeroBanner
              activeFilter={runFilter}
              onRefreshRuns={() => void loadRuns(true)}
              onSelectFilter={setRunFilter}
              release={selectedRelease}
              runsLoading={runsLoading}
            />

            <section
              aria-label="Host verification workbench"
              className="card card-border overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
            >
              {runs.length > EMPTY_COUNT ? (
                <WorkbenchToolbar
                  counts={filterCounts}
                  filter={runFilter}
                  onClear={clearFilters}
                  onFilterChange={setRunFilter}
                  onQueryChange={setRunQuery}
                  onViewModeChange={setViewMode}
                  query={runQuery}
                  viewMode={viewMode}
                />
              ) : null}

              <FleetWorkbenchBody
                filteredRuns={filteredRuns}
                inspectedLog={inspectedRun ? (logCache[inspectedRun.id] ?? null) : null}
                inspectedLogError={inspectedRun ? (logErrors[inspectedRun.id] ?? null) : null}
                inspectedLogLoading={inspectedRun !== null && loadingLogIds.has(inspectedRun.id)}
                inspectedRun={inspectedRun}
                modalOpenForInspected={modalRun !== null && modalRun.id === inspectedRun?.id}
                onClearFilters={clearFilters}
                onInspectFromMatrix={inspectRunFromMatrix}
                onOpenLogModal={openLogModal}
                onRefreshLog={(target) => void fetchRunLog(target.id)}
                onRetryRuns={() => void loadRuns(true)}
                onSelectRun={(target) => setInspectedRunId(target.id)}
                runsCount={runs.length}
                runsError={runsError}
                runsLoading={runsLoading}
                viewMode={viewMode}
              />
            </section>
          </>
        ) : (
          <section
            aria-labelledby="release-runs-title"
            className="card card-border border-base-content/18 bg-base-100 p-5 shadow-xs sm:p-6"
          >
            <h2 className="sr-only" id="release-runs-title">
              Host deployments
            </h2>
            <EmptyState
              detail="Choose a release from the timeline to inspect host deployments."
              title="No release selected"
            />
          </section>
        )}
      </div>

      <RunLogModal
        error={modalRun ? (logErrors[modalRun.id] ?? null) : null}
        loading={modalRun !== null && loadingLogIds.has(modalRun.id)}
        log={modalRun ? (logCache[modalRun.id] ?? null) : null}
        onClose={() => setModalRunId(null)}
        onRefresh={() => (modalRun ? void fetchRunLog(modalRun.id) : undefined)}
        run={modalRun}
      />
    </div>
  );
}
