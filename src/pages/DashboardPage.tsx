import {
  Activity,
  ArrowRight,
  CircleCheck,
  Clock3,
  CloudCog,
  ExternalLink,
  FileText,
  LoaderCircle,
  PackageCheck,
  RadioTower,
  RotateCw,
  Server
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ApiClient } from "@/api/client";
import { StatusRail } from "@/components/StatusRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { MetricCard } from "@/components/ui/MetricCard";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VPS_ROLE_ARKHOST, VPS_ROLE_REDROID } from "@/constants/vps";
import { usePolling } from "@/hooks/usePolling";
import type {
  ControlJobName,
  GcpAccount,
  GcpOperation,
  ReleaseSummary,
  VpsResource
} from "@/types";
import { formatDateTime, messageForError } from "@/utils";

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
    className: "border-info/30 bg-info/10 text-info"
  },
  healthy: {
    icon: CircleCheck,
    label: "Systems operational",
    detail: "No active release deployments",
    className: "border-success/30 bg-success/10 text-success"
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
  const lastProcessedApkFilename = data.recentReleases[0]?.apkFilename ?? null;

  return (
    <section
      aria-labelledby="control-plane-overview"
      className="card card-border overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b border-base-300 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-extrabold" id="control-plane-overview">
            Control plane overview
          </h2>
          <p className="mt-1 text-xs text-base-content/55">
            Updated {formatDateTime(data.refreshedAt)}
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-field border px-3 py-2 text-xs font-bold ${health.className}`}
        >
          <HealthIcon aria-hidden="true" size={16} />
          {health.label}
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <div className="bg-success/[0.03] p-5 sm:p-6 xl:border-r xl:border-base-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-base-content/55">SSH host inventory</p>
              <p className="mt-3 flex items-end gap-2">
                <strong className="text-4xl font-black leading-none tabular-nums text-base-content">
                  {data.vps.length}
                </strong>
                <span className="pb-0.5 text-sm font-semibold text-base-content/55">
                  registered
                </span>
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-field border border-success/25 bg-success/10 text-success">
              <Server aria-hidden="true" size={22} />
            </span>
          </div>
          <div
            aria-label={`${automationCoverage}% of managed VPS enabled for automation`}
            className="mt-6 h-2 overflow-hidden rounded bg-base-300"
            role="img"
          >
            <span
              className="block h-full rounded bg-success"
              style={{ width: `${automationCoverage}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/55">
            <span>
              <strong className="tabular-nums text-base-content">{automationCoverage}%</strong>{" "}
              Automation coverage
            </span>
            <span>{automationEnabledCount} enabled</span>
            <span>{data.vps.length - automationEnabledCount} excluded</span>
          </div>
          <p className="mt-5 border-t border-base-300 pt-4 text-xs leading-5 text-base-content/60">
            {health.detail}
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-base-300 xl:border-t-0">
          <MetricCard
            detail={`${redroidCount} ReDroid · ${arkhostCount} ArkHost`}
            icon={<Server aria-hidden="true" size={18} />}
            label="Managed VPS"
            value={String(data.vps.length)}
          />
          <MetricCard
            detail={`${automationCoverage}% fleet coverage`}
            icon={<RadioTower aria-hidden="true" size={18} />}
            label="Automation enabled"
            tone="success"
            value={String(automationEnabledCount)}
          />
          <MetricCard
            detail={`${enabledAccountCount} enabled`}
            icon={<CloudCog aria-hidden="true" size={18} />}
            label="GCP accounts"
            value={String(data.accounts.length)}
          />
          <MetricCard
            detail="Release verification"
            icon={<PackageCheck aria-hidden="true" size={18} />}
            label="Active runs"
            tone={data.activeRunCount > EMPTY_COUNT ? "warning" : "neutral"}
            value={String(data.activeRunCount)}
          />
        </div>
      </div>

      <div className="grid divide-y divide-base-300 border-t border-base-300 md:grid-cols-2 md:divide-x md:divide-y-0">
        <OverviewMeta
          icon={<FileText aria-hidden="true" size={15} />}
          label="Last APK"
          value={lastProcessedApkFilename ?? "None"}
        />
        <OverviewMeta
          icon={<Clock3 aria-hidden="true" size={15} />}
          label="Updated"
          value={formatDateTime(data.refreshedAt)}
        />
      </div>
    </section>
  );
}

function OverviewMeta({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 px-5 py-4 sm:px-6">
      <span className="mt-0.5 text-base-content/45">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase text-base-content/50">{label}</p>
        <p className="mt-1 break-words text-xs font-semibold leading-5 text-base-content/80">
          {value}
        </p>
      </div>
    </div>
  );
}

function ReleaseActivity({ releases }: { releases: ReleaseSummary[] }) {
  return (
    <section
      aria-labelledby="recent-releases-title"
      className="card card-border min-w-0 overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
    >
      <SectionHeader
        id="recent-releases-title"
        linkLabel="All releases"
        linkTo="/releases"
        title="Recent releases"
      />
      {releases.length === EMPTY_COUNT ? (
        <EmptyState detail="No APK releases have been recorded." title="No releases" />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="table table-sm min-w-[42rem]">
              <thead>
                <tr className="bg-base-200/75 text-[0.68rem] uppercase text-base-content/60">
                  <th className="px-5 py-3">Release</th>
                  <th className="px-5 py-3">Deployment health</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Open APK</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {releases.map((release) => (
                  <tr className="transition-colors hover:bg-info/6" key={release.id}>
                    <td className="max-w-72 px-5 py-4 whitespace-normal">
                      <strong className="break-words text-[0.8rem]">{release.apkFilename}</strong>
                    </td>
                    <td className="w-72 px-5 py-4">
                      <StatusRail compact counts={release.statusCounts} showEmptyStatuses={false} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-base-content/55">
                      {formatDateTime(release.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
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
                    <h3 className="break-words text-sm font-extrabold leading-5">
                      {release.apkFilename}
                    </h3>
                    <p className="mt-1 text-xs text-base-content/55">
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
    </section>
  );
}

function OperationActivity({ operations }: { operations: GcpOperation[] }) {
  return (
    <section
      aria-labelledby="recent-operations-title"
      className="card card-border min-w-0 overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
    >
      <SectionHeader
        id="recent-operations-title"
        linkLabel="Open VPS"
        linkTo="/vps"
        title="Recent operations"
      />
      {operations.length === EMPTY_COUNT ? (
        <EmptyState title="No cloud operations" />
      ) : (
        <div className="divide-y divide-base-300">
          {operations.map((operation) => (
            <OperationRow key={operation.id} operation={operation} />
          ))}
        </div>
      )}
    </section>
  );
}

function OperationRow({ operation }: { operation: GcpOperation }) {
  return (
    <article className="relative py-4 pr-5 pl-9 sm:pr-6">
      <span
        aria-hidden="true"
        className="absolute top-5.5 left-4.5 size-2 rounded-full border-2 border-base-100 bg-info ring-1 ring-info/35"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-extrabold leading-5">
            {operation.instanceName}
          </h3>
          <p className="mt-1 break-words text-xs text-base-content/55">{operation.projectId}</p>
        </div>
        <StatusBadge value={operation.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3 text-xs">
        <span className="font-bold capitalize text-base-content/75">{operation.action}</span>
        <time className="text-base-content/55">{formatDateTime(operation.createdAt)}</time>
      </div>
    </article>
  );
}

function SectionHeader({
  id,
  title,
  linkLabel,
  linkTo
}: {
  id: string;
  title: string;
  linkLabel: string;
  linkTo: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-base-300 px-5 py-4 sm:px-6">
      <h2 className="text-base font-extrabold" id={id}>
        {title}
      </h2>
      <Link
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-info hover:underline"
        to={linkTo}
      >
        {linkLabel}
        <ArrowRight aria-hidden="true" size={14} />
      </Link>
    </div>
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

        {data ? (
          <>
            <DashboardOverview data={data} />
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
              <ReleaseActivity releases={data.recentReleases} />
              <OperationActivity operations={data.recentOperations} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
