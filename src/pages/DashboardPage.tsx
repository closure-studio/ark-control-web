import {
  Activity,
  CircleCheck,
  Clock3,
  CloudCog,
  FileText,
  PackageCheck,
  Server,
  TriangleAlert
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ApiClient } from "@/api/client";
import { StatusRail } from "@/components/StatusRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePolling } from "@/hooks/usePolling";
import type { DashboardResponse } from "@/types";
import { formatDateTime, messageForError } from "@/utils";

export function DashboardPage({ api }: { api: ApiClient }) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading || !data) setLoading(true);
    try {
      const response = await api.getDashboard();
      setData(response);
      setError(null);
    } catch (loadError) {
      setError(messageForError(loadError, "Unable to load dashboard."));
    } finally {
      setLoading(false);
    }
  }, [api, data]);

  useEffect(() => {
    void load(true);
  }, [api]);
  usePolling(() => void load(false), 15_000);

  return (
    <div className="min-w-0">
      <PageHeader
        actions={<RefreshButton loading={loading} onClick={() => void load(true)} />}
        eyebrow="Control plane"
        title="Dashboard"
      />

      {error ? <ErrorAlert message={error} onRetry={() => void load(true)} /> : null}
      {loading && !data ? <LoadingBlock label="Loading control plane status" /> : null}

      {data ? (
        <div className="grid gap-6">
          <section aria-label="Control plane metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              detail={`${data.summary.vps.gcp} GCP, ${data.summary.vps.manual} manual`}
              icon={<Server aria-hidden="true" size={21} />}
              label="Managed VPS"
              value={String(data.summary.vps.total)}
            />
            <MetricCard
              detail={`${data.summary.vps.stopped} stopped, ${data.summary.vps.unavailable} unavailable`}
              icon={<Activity aria-hidden="true" size={21} />}
              label="Running"
              tone="success"
              value={String(data.summary.vps.running)}
            />
            <MetricCard
              detail={`${data.summary.accounts.enabled} enabled accounts`}
              icon={<CloudCog aria-hidden="true" size={21} />}
              label="GCP Accounts"
              value={String(data.summary.accounts.total)}
            />
            <MetricCard
              detail={data.summary.watcher.hasNonTerminalHostRuns ? "Deployment checks in progress" : "No active deployments"}
              icon={<PackageCheck aria-hidden="true" size={21} />}
              label="Active Runs"
              tone={data.summary.watcher.hasNonTerminalHostRuns ? "warning" : "neutral"}
              value={String(data.summary.watcher.nonTerminalHostRunCount)}
            />
          </section>

          {data.summary.watcher.lastCheckError ? (
            <div className="alert alert-error alert-soft items-start" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
              <div className="min-w-0">
                <h3 className="font-black">Watcher check failed</h3>
                <p className="mt-1 break-words text-sm">{data.summary.watcher.lastCheckError}</p>
              </div>
            </div>
          ) : null}

          {data.errors.length > 0 ? (
            <div className="alert alert-warning alert-soft items-start" role="status">
              <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
              <div className="min-w-0">
                <h3 className="font-black">Cloud inventory is partially unavailable</h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {data.errors.slice(0, 3).map((item, index) => <li className="break-words" key={`${item.accountId ?? "unknown"}-${index}`}>{item.message}</li>)}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
            <section className="min-w-0" aria-labelledby="recent-releases-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="page-kicker">Verification</p>
                  <h2 className="mt-1 text-lg font-bold" id="recent-releases-title">Recent releases</h2>
                </div>
                <Link className="btn btn-sm" to="/releases">View all</Link>
              </div>
              {data.recentReleases.length === 0 ? (
                <EmptyState title="No releases" detail="No APK releases have been recorded." />
              ) : (
                <>
                <div className="control-panel hidden overflow-x-auto border bg-base-100 md:block">
                  <table className="control-table table table-sm min-w-[36rem]">
                    <thead><tr><th>Release</th><th>Runs</th><th>Created</th><th /></tr></thead>
                    <tbody>
                      {data.recentReleases.map((release) => (
                        <tr key={release.id}>
                          <td className="max-w-64 whitespace-normal"><strong className="break-words">{release.apkFilename}</strong></td>
                          <td className="w-72"><StatusRail counts={release.statusCounts} /></td>
                          <td>{formatDateTime(release.createdAt)}</td>
                          <td className="text-right"><a className="btn btn-ghost btn-xs" href={release.finalUrl} rel="noreferrer" target="_blank">APK</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 md:hidden">
                  {data.recentReleases.map((release) => (
                    <article className="card border border-base-300 bg-base-100" key={release.id}>
                      <div className="card-body gap-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><h4 className="break-words font-black">{release.apkFilename}</h4><p className="mt-1 text-xs text-base-content/55">{formatDateTime(release.createdAt)}</p></div>
                          <a aria-label={`Open ${release.apkFilename}`} className="btn btn-square btn-ghost btn-sm shrink-0" href={release.finalUrl} rel="noreferrer" target="_blank">APK</a>
                        </div>
                        <StatusRail counts={release.statusCounts} />
                      </div>
                    </article>
                  ))}
                </div>
                </>
              )}
            </section>

            <section className="min-w-0" aria-labelledby="recent-operations-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="page-kicker">Infrastructure</p>
                  <h2 className="mt-1 text-lg font-bold" id="recent-operations-title">Recent operations</h2>
                </div>
                <Link className="btn btn-sm" to="/vps">Open VPS</Link>
              </div>
              {data.recentOperations.length === 0 ? (
                <EmptyState title="No cloud operations" />
              ) : (
                <>
                <div className="control-panel hidden overflow-x-auto border bg-base-100 md:block xl:hidden">
                  <table className="control-table table table-sm min-w-[36rem]">
                    <thead><tr><th>Instance</th><th>Action</th><th>Status</th><th>Time</th></tr></thead>
                    <tbody>
                      {data.recentOperations.map((operation) => (
                        <tr key={operation.id}>
                          <td className="max-w-52 whitespace-normal">
                            <strong className="break-words">{operation.instanceName}</strong>
                            <span className="mt-0.5 block text-xs text-base-content/55">{operation.projectId}</span>
                          </td>
                          <td className="capitalize">{operation.action}</td>
                          <td><StatusBadge value={operation.status} /></td>
                          <td>{formatDateTime(operation.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 md:hidden xl:grid">
                  {data.recentOperations.map((operation) => (
                    <article className="card border border-base-300 bg-base-100" key={operation.id}>
                      <div className="card-body gap-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><h4 className="break-words font-black">{operation.instanceName}</h4><p className="mt-1 break-words text-xs text-base-content/55">{operation.projectId}</p></div>
                          <StatusBadge value={operation.status} />
                        </div>
                        <div className="flex items-center justify-between border-t border-base-300 pt-3 text-xs"><span className="font-bold capitalize">{operation.action}</span><span className="text-base-content/55">{formatDateTime(operation.createdAt)}</span></div>
                      </div>
                    </article>
                  ))}
                </div>
                </>
              )}
            </section>
          </div>

          <footer className="control-footer flex flex-wrap items-center gap-x-5 gap-y-2 p-3 text-xs text-base-content/65 sm:p-4">
            <span className="inline-flex items-center gap-2"><FileText aria-hidden="true" size={15} />Last APK: {data.summary.watcher.lastProcessedApkFilename ?? "None"}</span>
            <span className="inline-flex items-center gap-2"><CircleCheck aria-hidden="true" className="text-success" size={15} />Last successful check: {formatDateTime(data.summary.watcher.lastSuccessfulCheckAt)}</span>
            <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" size={15} />Updated {formatDateTime(data.generatedAt)}</span>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
