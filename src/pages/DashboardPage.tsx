import {
  Activity,
  ArrowRight,
  CircleCheck,
  CloudCog,
  ExternalLink,
  FileText,
  LoaderCircle,
  PackageCheck,
  RadioTower,
  RotateCw,
  Server
} from "lucide-react";
import { type ComponentProps, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ApiClient } from "@/api/client";
import { StatusRail } from "@/components/StatusRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { MetricCard } from "@/components/ui/MetricCard";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel, PanelHeading } from "@/components/ui/Panel";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { BADGE_TONE_CLASSES, StatusBadge, STATUS_BADGE_BASE_CLASS_NAME } from "@/components/ui/StatusBadge";
import { VPS_ROLE_ARKHOST, VPS_ROLE_REDROID } from "@/constants/vps";
import { usePolling } from "@/hooks/usePolling";
import type {
  ControlJobName,
  GcpAccount,
  GcpOperation,
  ReleaseSummary,
  VpsResource
} from "@/types";
import { cx, formatDateTime, messageForError } from "@/utils";

const DASHBOARD_POLL_INTERVAL_MS = 15_000;
const DASHBOARD_OPERATION_LIMIT = 10;
const DASHBOARD_RELEASE_LIMIT = 5;
const ACTIVE_RUN_SAMPLE_LIMIT = 1;
const FIRST_PAGE_OFFSET = 0;
const EMPTY_COUNT = 0;
const PERCENT_SCALE = 100;

const CONTROL_JOB_LABELS: Record<ControlJobName, string> = {
  "apk-delivery": "APK delivery",
  "maintenance-monitor": "maintenance monitor",
  "maintenance-pre-action": "maintenance pre-action",
  retention: "retention"
};

const HEALTH_STATES = {
  active: {
    icon: Activity,
    label: "Verification in progress",
    detail: "Deployment checks are currently running",
    tone: "info"
  },
  healthy: {
    icon: CircleCheck,
    label: "Systems operational",
    detail: "No active release deployments",
    tone: "success"
  }
} as const;

type DashboardHealth = keyof typeof HEALTH_STATES;
type DashboardData = {
  refreshedAt: string;
  accounts: GcpAccount[];
  vps: VpsResource[];
  recentReleases: ReleaseSummary[];
  recentOperations: GcpOperation[];
  activeRunCount: number;
};

function dashboardHealth(data: DashboardData): DashboardHealth {
  if (data.activeRunCount > EMPTY_COUNT) return "active";
  return "healthy";
}

function percentage(part: number, total: number) {
  if (total === EMPTY_COUNT) return EMPTY_COUNT;
  return Math.round((part / total) * PERCENT_SCALE);
}

function DashboardOverview({ data }: { data: DashboardData }) {
  const health = HEALTH_STATES[dashboardHealth(data)];
  const HealthIcon = health.icon;
  const enabledAccountCount = data.accounts.filter((account) => account.enabled).length;
  const automationEnabledCount = data.vps.filter((vps) => vps.watcherEnabled).length;
  const automationCoverage = percentage(automationEnabledCount, data.vps.length);
  const redroidCount = data.vps.filter((vps) => vps.role === VPS_ROLE_REDROID).length;
  const arkhostCount = data.vps.filter((vps) => vps.role === VPS_ROLE_ARKHOST).length;
  const lastProcessedApkFilename = data.recentReleases[0]?.apkFilename;
  const metrics: ComponentProps<typeof MetricCard>[] = [
    {
      detail: `${redroidCount} ReDroid · ${arkhostCount} ArkHost`,
      icon: <Server aria-hidden="true" size={18} />,
      label: "Managed VPS",
      tone: "info",
      value: data.vps.length
    },
    {
      detail: `${automationCoverage}% fleet coverage`,
      icon: <RadioTower aria-hidden="true" size={18} />,
      label: "Automation enabled",
      tone: "success",
      value: automationEnabledCount
    },
    {
      detail: `${enabledAccountCount} enabled`,
      icon: <CloudCog aria-hidden="true" size={18} />,
      label: "GCP accounts",
      tone: "info",
      value: data.accounts.length
    },
    {
      detail: "Release verification",
      icon: <PackageCheck aria-hidden="true" size={18} />,
      label: "Active runs",
      tone: data.activeRunCount > EMPTY_COUNT ? "warning" : "info",
      value: data.activeRunCount
    }
  ];

  return (
    <section aria-labelledby="control-plane-overview" className="tabular-nums">
      <PanelHeading
        action={(
          <span className={cx(STATUS_BADGE_BASE_CLASS_NAME, "h-8 gap-2 px-3", BADGE_TONE_CLASSES[health.tone])}>
            <HealthIcon aria-hidden="true" size={16} />
            {health.label}
          </span>
        )}
        className="mb-4"
        detail={`Updated ${formatDateTime(data.refreshedAt)}`}
        id="control-plane-overview"
        title="Control plane overview"
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel aria-labelledby="ssh-host-inventory-title" className="xl:col-span-4 xl:row-span-2">
          <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-extrabold" id="ssh-host-inventory-title">SSH host inventory</h3>
              <Server aria-hidden="true" className="shrink-0 text-muted" size={22} />
            </div>
            <div>
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold text-muted">
                <strong className="text-3xl font-black leading-none text-base-content">{automationCoverage}%</strong>
                Automation coverage
              </p>
              <div
                aria-label={`${automationCoverage}% of managed VPS enabled for automation`}
                className="mt-3 h-2 overflow-hidden rounded bg-base-300"
                role="img"
              >
                <span
                  className="block h-full rounded bg-success"
                  style={{ width: `${automationCoverage}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>{automationEnabledCount} enabled</span>
                <span>{data.vps.length - automationEnabledCount} excluded</span>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted">{health.detail}</p>
            <div className="mt-auto flex items-start gap-3">
              <FileText aria-hidden="true" className="mt-0.5 shrink-0 text-muted" size={15} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-muted">Last APK</p>
                <p className="mt-1 font-mono text-xs font-semibold leading-5 wrap-anywhere">
                  {lastProcessedApkFilename ?? "None"}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {metrics.map((metric) => (
          <Panel className="xl:col-span-4" key={metric.label}>
            <MetricCard {...metric} />
          </Panel>
        ))}

        <ReleaseActivity releases={data.recentReleases} />
        <OperationActivity operations={data.recentOperations} />
      </div>
    </section>
  );
}

function ReleaseActivity({ releases }: { releases: ReleaseSummary[] }) {
  return (
    <Panel
      className="self-start xl:col-span-full 2xl:col-span-8"
      header={{
        id: "recent-releases-title",
        title: "Recent releases",
        action: <ActivityLink to="/releases">All releases</ActivityLink>
      }}
    >
      {releases.length === EMPTY_COUNT ? (
        <EmptyState detail="No APK releases have been recorded." title="No releases" />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table table-sm console-table">
              <thead>
                <tr>
                  <th>Release</th>
                  <th>Deployment health</th>
                  <th>Created</th>
                  <th>
                    <span className="sr-only">Open APK</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {releases.map((release) => (
                  <tr className="transition-colors hover:bg-info/6" key={release.id}>
                    <td>
                      <strong className="font-mono text-sm wrap-anywhere">{release.apkFilename}</strong>
                    </td>
                    <td className="w-1/3">
                      <StatusRail compact counts={release.statusCounts} showEmptyStatuses={false} />
                    </td>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {formatDateTime(release.createdAt)}
                    </td>
                    <td className="text-right">
                      <a
                        aria-label={`Open APK ${release.apkFilename}`}
                        className="btn btn-square btn-ghost btn-sm"
                        href={release.finalUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" size={15} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-base-300 md:hidden">
            {releases.map((release) => (
              <article className="px-5 py-4" key={release.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-mono text-sm font-extrabold leading-5 wrap-anywhere">
                      {release.apkFilename}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(release.createdAt)}
                    </p>
                  </div>
                  <a
                    aria-label={`Open APK ${release.apkFilename}`}
                    className="btn btn-square btn-ghost btn-sm shrink-0"
                    href={release.finalUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" size={15} />
                  </a>
                </div>
                <div className="mt-4">
                  <StatusRail compact counts={release.statusCounts} showEmptyStatuses={false} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function OperationActivity({ operations }: { operations: GcpOperation[] }) {
  return (
    <Panel
      className="self-start xl:col-span-full 2xl:col-span-4"
      header={{
        id: "recent-operations-title",
        title: "Recent operations",
        action: <ActivityLink to="/vps">Open VPS</ActivityLink>
      }}
    >
      {operations.length === EMPTY_COUNT ? (
        <EmptyState title="No cloud operations" />
      ) : (
        <div className="divide-y divide-base-300">
          {operations.map((operation) => (
            <OperationRow key={operation.id} operation={operation} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function OperationRow({ operation }: { operation: GcpOperation }) {
  return (
    <article className="relative py-4 pr-5 pl-9 sm:pr-6">
      <span
        aria-hidden="true"
        className="absolute top-6 left-5 size-1.5 rounded-full bg-info"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-extrabold leading-5 wrap-anywhere">
            {operation.instanceName}
          </h3>
          <p className="mt-1 font-mono text-xs wrap-anywhere text-muted">{operation.projectId}</p>
        </div>
        <StatusBadge value={operation.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3 text-xs">
        <span className="font-bold capitalize text-base-content/75">{operation.action}</span>
        <time className="text-muted">{formatDateTime(operation.createdAt)}</time>
      </div>
    </article>
  );
}

function ActivityLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-info hover:underline"
      to={to}
    >
      {children}
      <ArrowRight aria-hidden="true" size={14} />
    </Link>
  );
}

export function DashboardPage({ api }: { api: ApiClient }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedulerBusy, setSchedulerBusy] = useState(false);
  const [schedulerNotice, setSchedulerNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const [accounts, vps, releases, operations, activeRuns] = await Promise.all([
          api.listAccounts(),
          api.listVps(),
          api.listReleases(DASHBOARD_RELEASE_LIMIT, FIRST_PAGE_OFFSET),
          api.listOperations(DASHBOARD_OPERATION_LIMIT, FIRST_PAGE_OFFSET),
          api.listRuns("active", ACTIVE_RUN_SAMPLE_LIMIT, FIRST_PAGE_OFFSET)
        ]);
        setData({
          refreshedAt: new Date().toISOString(),
          accounts: accounts.accounts,
          vps: vps.vps,
          recentReleases: releases.releases,
          recentOperations: operations.operations,
          activeRunCount: activeRuns.pagination.total
        });
        setError(null);
      } catch (loadError) {
        setError(messageForError(loadError, "Unable to load dashboard."));
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    void load(true);
  }, [load]);
  usePolling(() => void load(false), DASHBOARD_POLL_INTERVAL_MS);

  async function repairSchedulerAlarms() {
    setSchedulerBusy(true);
    setSchedulerNotice(null);
    try {
      const response = await api.ensureSchedulerAlarms();
      const jobLabels = response.ensuredJobs.map((job) => CONTROL_JOB_LABELS[job]);
      setSchedulerNotice({
        tone: "success",
        text: `Scheduler alarms ensured for ${jobLabels.join(", ")}.`
      });
    } catch (schedulerError) {
      setSchedulerNotice({
        tone: "error",
        text: messageForError(schedulerError, "Unable to repair scheduler alarms.")
      });
    } finally {
      setSchedulerBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        actions={(
          <>
            <RefreshButton loading={loading} onClick={() => void load(true)} />
            <button
              className="btn btn-sm gap-1.5 border-base-content/20 bg-base-100 hover:bg-base-300/60"
              disabled={schedulerBusy}
              onClick={() => void repairSchedulerAlarms()}
              type="button"
            >
              {schedulerBusy ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
              ) : (
                <RotateCw aria-hidden="true" size={15} />
              )}
              Repair alarms
            </button>
          </>
        )}
        description="Infrastructure health, deployment activity, and recent control plane changes."
        title="Dashboard"
      />

      <div className="grid gap-5">
        {schedulerNotice ? (
          <Notice onClose={() => setSchedulerNotice(null)} tone={schedulerNotice.tone}>
            {schedulerNotice.text}
          </Notice>
        ) : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load(true)} /> : null}
        {loading && !data ? <LoadingBlock label="Loading control plane status" /> : null}

        {data ? <DashboardOverview data={data} /> : null}
      </div>
    </div>
  );
}
