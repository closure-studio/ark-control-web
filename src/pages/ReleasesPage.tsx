import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  LoaderCircle,
  PackageCheck,
  RefreshCw
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "@/api/client";
import { StatusRail } from "@/components/StatusRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePolling } from "@/hooks/usePolling";
import type { HostRun, ReleaseSummary, RunLog } from "@/types";
import { formatDateTime, messageForError } from "@/utils";

const PAGE_SIZE = 25;

function RunLogModal({ run, log, loading, error, onClose, onRefresh }: {
  run: HostRun | null;
  log: RunLog | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  return (
    <FormModal onClose={onClose} open={run !== null} title={run ? `Run log: ${run.hostName}` : "Run log"} width="max-w-4xl">
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
          <div className="flex items-center gap-2"><StatusBadge value={run?.status} /><span className="font-mono text-xs text-base-content/60">{run?.hostIp}</span></div>
          <button className="btn btn-sm" disabled={loading} onClick={onRefresh} type="button"><RefreshCw className={loading ? "animate-spin" : undefined} size={15} />Refresh</button>
        </div>
        {error ? <ErrorAlert message={error} onRetry={onRefresh} /> : null}
        {loading && !log ? <LoadingBlock label="Loading run log" /> : null}
        {log ? (
          <>
            <pre className="control-code control-scrollbar max-h-[62vh] min-h-52 overflow-auto rounded-lg bg-neutral p-4 text-xs text-neutral-content"><code>{log.lastLogTail ?? "No stored log output."}</code></pre>
            <p className="text-xs text-base-content/55">Last checked {formatDateTime(log.lastCheckedAt)} · Updated {formatDateTime(log.updatedAt)}</p>
          </>
        ) : null}
      </div>
    </FormModal>
  );
}

export function ReleasesPage({ api }: { api: ApiClient }) {
  const [offset, setOffset] = useState(0);
  const [releases, setReleases] = useState<ReleaseSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [runs, setRuns] = useState<HostRun[]>([]);
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
  const hasActiveRuns = runs.some((run) => run.status === "pending" || run.status === "running");

  const loadReleases = useCallback(async () => {
    setReleaseLoading(true);
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
  }, [api, offset]);

  const loadRuns = useCallback(async (showLoading = true) => {
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
  }, [api, selectedId]);

  useEffect(() => { void loadReleases(); }, [loadReleases]);
  useEffect(() => { setRuns([]); setSelectedRun(null); void loadRuns(true); }, [selectedId]);
  usePolling(() => { void loadRuns(false); void loadReleases(); }, 15_000, hasActiveRuns);

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

  return (
    <div className="min-w-0">
      <PageHeader
        actions={<RefreshButton loading={releaseLoading} onClick={() => void loadReleases()} />}
        eyebrow="Verification"
        title="Releases"
      />
      {releaseError ? <ErrorAlert message={releaseError} onRetry={() => void loadReleases()} /> : null}

      <div className="mt-4 grid min-w-0 gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-labelledby="release-list-title" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold" id="release-list-title">Release list</h2>
            <div className="join">
              <button aria-label="Previous release page" className="btn btn-square btn-sm join-item" disabled={offset === 0 || releaseLoading} onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))} type="button"><ChevronLeft size={17} /></button>
              <button aria-label="Next release page" className="btn btn-square btn-sm join-item" disabled={releases.length < PAGE_SIZE || releaseLoading} onClick={() => setOffset((current) => current + PAGE_SIZE)} type="button"><ChevronRight size={17} /></button>
            </div>
          </div>
          {releaseLoading && releases.length === 0 ? <LoadingBlock label="Loading releases" /> : null}
          {!releaseLoading && releases.length === 0 ? <EmptyState title="No releases" /> : null}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            {releases.map((release) => {
              const selected = release.id === selectedId;
              return (
                <article className={`control-panel card border bg-base-100 ${selected ? "!border-info ring-2 ring-info/20" : "border-base-300"}`} key={release.id}>
                  <div className="card-body gap-4 p-4">
                    <button className="min-w-0 text-left" onClick={() => setSelectedId(release.id)} type="button">
                      <strong className="block break-words text-sm">{release.apkFilename}</strong>
                      <span className="mt-1 block text-xs text-base-content/55">{formatDateTime(release.createdAt)}</span>
                    </button>
                    <StatusRail counts={release.statusCounts} />
                    <a className="btn btn-ghost btn-xs justify-start" href={release.finalUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />Open APK</a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="release-runs-title" className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="page-kicker">Host deployments</p>
              <h2 className="mt-1 break-words text-lg font-bold" id="release-runs-title">{selectedRelease?.apkFilename ?? "Select a release"}</h2>
            </div>
            <button className="btn btn-sm" disabled={!selectedId || runsLoading} onClick={() => void loadRuns(true)} type="button">{runsLoading ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}Refresh runs</button>
          </div>
          {runsError ? <ErrorAlert message={runsError} onRetry={() => void loadRuns(true)} /> : null}
          {runsLoading && runs.length === 0 ? <LoadingBlock label="Loading host runs" /> : null}
          {!runsLoading && selectedId && runs.length === 0 ? <EmptyState title="No host runs" detail="This release has no deployment records." /> : null}
          {!selectedId ? <EmptyState title="No release selected" /> : null}

          {runs.length > 0 ? (
            <>
            <div className="control-panel hidden overflow-x-auto border bg-base-100 min-[1900px]:block">
              <table className="control-table table table-sm min-w-[66rem]">
                <thead><tr><th>Host</th><th>Status</th><th>AI review</th><th>Last checked</th><th>Error</th><th /></tr></thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td><strong>{run.hostName}</strong><span className="mt-1 block font-mono text-xs text-base-content/55">{run.hostIp}</span></td>
                      <td><StatusBadge value={run.status} /></td>
                      <td className="max-w-64 whitespace-normal"><StatusBadge value={run.lastAiStatus} />{run.lastAiReason ? <p className="mt-1 break-words text-xs text-base-content/60">{run.lastAiReason}</p> : null}</td>
                      <td>{formatDateTime(run.lastCheckedAt)}</td>
                      <td className="max-w-64 whitespace-normal text-xs text-error">{run.errorMessage ?? "None"}</td>
                      <td className="text-right"><div className="tooltip tooltip-left" data-tip="Open log"><button aria-label={`Open log for ${run.hostName}`} className="btn btn-square btn-sm" onClick={() => openLog(run)} type="button"><FileText size={15} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 min-[1900px]:hidden">
              {runs.map((run) => (
                <article className="control-panel card border bg-base-100" key={run.id}>
                  <div className="card-body gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h4 className="break-words font-black">{run.hostName}</h4><p className="mt-1 break-all font-mono text-xs text-base-content/55">{run.hostIp}</p></div>
                      <StatusBadge value={run.status} />
                    </div>
                    <div className="border-y border-base-300 py-3">
                      <div className="flex items-center gap-2"><span className="text-xs font-bold text-base-content/55">AI review</span><StatusBadge value={run.lastAiStatus} /></div>
                      {run.lastAiReason ? <p className="mt-2 break-words text-xs text-base-content/65">{run.lastAiReason}</p> : null}
                      {run.errorMessage ? <p className="mt-2 break-words text-xs text-error">{run.errorMessage}</p> : null}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-base-content/55">{formatDateTime(run.lastCheckedAt)}</span>
                      <button className="btn btn-sm" onClick={() => openLog(run)} type="button"><FileText size={15} />Log</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            </>
          ) : null}
        </section>
      </div>

      <RunLogModal
        error={logError}
        loading={logLoading}
        log={log}
        onClose={() => { setSelectedRun(null); setLog(null); setLogError(null); }}
        onRefresh={() => selectedRun ? void loadLog(selectedRun) : undefined}
        run={selectedRun}
      />
    </div>
  );
}
