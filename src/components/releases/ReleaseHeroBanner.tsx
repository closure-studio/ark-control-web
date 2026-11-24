import {
  Activity,
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCw
} from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { StatusRail } from "@/components/StatusRail";
import {
  APK_URL_COPY_KEY,
  EMPTY_COUNT,
  HOST_RUN_PRESENTATION,
  parseApkMetadata,
  PERCENT_SCALE,
  RELEASE_HEALTH_ACTIVE,
  RELEASE_HEALTH_ATTENTION,
  RELEASE_HEALTH_EMPTY,
  RELEASE_HEALTH_HEALTHY,
  RELEASE_HEALTH_META,
  RUN_FILTER_ACTIVE,
  RUN_FILTER_ALL,
  RUN_FILTER_ATTENTION,
  RUN_FILTER_SUCCEEDED,
  summarizeReleaseCounts,
  type ReleaseHealth,
  type RunFilter
} from "@/components/releases/releaseHelpers";
import { MetricContent } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { STATUS_BADGE_BASE_CLASS_NAME } from "@/components/ui/StatusBadge";
import type { ReleaseSummary } from "@/types";
import { cx, formatDateTime } from "@/utils";

type RadialStyle = CSSProperties & {
  "--value": number;
  "--size": string;
  "--thickness": string;
};

const HEALTH_BADGE_ICONS: Record<ReleaseHealth, typeof CircleCheck> = {
  [RELEASE_HEALTH_HEALTHY]: CircleCheck,
  [RELEASE_HEALTH_ACTIVE]: Activity,
  [RELEASE_HEALTH_ATTENTION]: CircleAlert,
  [RELEASE_HEALTH_EMPTY]: Clock3
};

export function ReleaseHeroBanner({
  activeFilter,
  onRefreshRuns,
  onSelectFilter,
  release,
  runsLoading
}: {
  activeFilter: RunFilter;
  onRefreshRuns: () => void;
  onSelectFilter: (filter: RunFilter) => void;
  release: ReleaseSummary;
  runsLoading: boolean;
}) {
  const { copiedKey, copyText } = useCopyFeedback();
  const copiedUrl = copiedKey === APK_URL_COPY_KEY;
  const summary = summarizeReleaseCounts(release.statusCounts);
  const healthMeta = RELEASE_HEALTH_META[summary.health];
  const HealthIcon = HEALTH_BADGE_ICONS[summary.health];
  const parsed = parseApkMetadata(release.apkFilename);
  const hasRuns = summary.total > EMPTY_COUNT;
  const radialSemantics = hasRuns
    ? {
      role: "progressbar",
      "aria-label": `${summary.passRate}% rollout pass rate`,
      "aria-valuemin": EMPTY_COUNT,
      "aria-valuemax": PERCENT_SCALE,
      "aria-valuenow": summary.passRate
    }
    : { role: "img", "aria-label": healthMeta.label };

  const radialStyle: RadialStyle = {
    "--value": summary.passRate,
    "--size": "4.5rem",
    "--thickness": "5px"
  };

  const kpiCards: ReadonlyArray<ComponentProps<typeof MetricContent> & { filter: RunFilter }> = [
    {
      filter: RUN_FILTER_ALL,
      label: "Total hosts",
      value: summary.total,
      detail: "Target fleet"
    },
    {
      filter: RUN_FILTER_SUCCEEDED,
      label: "Verified",
      value: summary.succeeded,
      detail: hasRuns ? `${summary.passRate}% pass rate` : healthMeta.label,
      tone: HOST_RUN_PRESENTATION[RUN_FILTER_SUCCEEDED].tone
    },
    {
      filter: RUN_FILTER_ACTIVE,
      label: "In progress",
      value: summary.active,
      detail: `${summary.running} running · ${summary.pending} queued`,
      tone: "info"
    },
    {
      filter: RUN_FILTER_ATTENTION,
      label: "Failures",
      value: summary.attention,
      detail: `${summary.failed} failed · ${summary.timedOut} timed out`,
      tone: summary.attention > EMPTY_COUNT ? "error" : "muted"
    }
  ];

  return (
    <Panel aria-labelledby="release-runs-title">
      <div className="grid gap-3 p-5 sm:p-6 xl:grid-cols-12 xl:grid-rows-2">
        <div className="flex min-w-0 flex-col gap-4 rounded-box border border-base-300 p-4 sm:flex-row sm:items-start sm:p-5 xl:col-span-7 xl:row-span-2">
          <div
            {...radialSemantics}
            className={cx(
              "radial-progress shrink-0 bg-base-200/70 text-sm font-black tabular-nums",
              healthMeta.radialClassName
            )}
            style={radialStyle}
          >
            {hasRuns ? `${summary.passRate}%` : "—"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx(STATUS_BADGE_BASE_CLASS_NAME, healthMeta.badgeClassName)}>
                <HealthIcon aria-hidden="true" size={12} />
                {healthMeta.label}
              </span>
              <span className="font-mono text-xs font-bold tabular-nums text-muted">
                Release #{release.id}
              </span>
              {parsed.arch ? (
                <span className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs font-semibold text-muted">
                  {parsed.arch}
                </span>
              ) : null}
            </div>

            <h2
              className="mt-2 font-mono text-xl font-black leading-snug wrap-anywhere text-base-content sm:text-2xl"
              id="release-runs-title"
            >
              {release.apkFilename}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Published {formatDateTime(release.createdAt)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                className="btn btn-primary btn-sm gap-1.5"
                href={release.finalUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" size={14} />
                Open APK
              </a>
              <button
                className="btn btn-sm gap-1.5"
                onClick={() => void copyText(APK_URL_COPY_KEY, release.finalUrl)}
                type="button"
              >
                {copiedUrl ? (
                  <Check aria-hidden="true" className="text-success" size={14} />
                ) : (
                  <Copy aria-hidden="true" size={14} />
                )}
                {copiedUrl ? "URL copied" : "Copy URL"}
              </button>
              <button
                className="btn btn-sm gap-1.5"
                disabled={runsLoading}
                onClick={onRefreshRuns}
                type="button"
              >
                {runsLoading ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
                ) : (
                  <RefreshCw aria-hidden="true" size={14} />
                )}
                Refresh runs
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 xl:col-span-5 xl:row-span-2 xl:grid-cols-2 xl:grid-rows-subgrid">
          {kpiCards.map((item) => {
            const active = activeFilter === item.filter;
            return (
              <button
                aria-pressed={active}
                className={cx(
                  "flex min-w-0 flex-col gap-1.5 rounded-box border p-3.5 text-left transition-colors",
                  active
                    ? "border-primary bg-base-200"
                    : "border-base-300 bg-base-100 hover:border-base-content/30 hover:bg-base-200"
                )}
                key={item.filter}
                onClick={() => onSelectFilter(item.filter)}
                type="button"
              >
                <MetricContent detail={item.detail} label={item.label} tone={item.tone} value={item.value} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-base-300 bg-base-200/40 px-5 py-3.5 sm:px-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs">
          <span className="font-bold text-muted">Rollout verification</span>
          <span className="font-semibold tabular-nums text-base-content/80">
            {hasRuns
              ? `${summary.passRate}% succeeded (${summary.succeeded} of ${summary.total} hosts)`
              : "No host deployments recorded"}
          </span>
        </div>
        <StatusRail compact counts={release.statusCounts} showEmptyStatuses={false} />
      </div>
    </Panel>
  );
}
