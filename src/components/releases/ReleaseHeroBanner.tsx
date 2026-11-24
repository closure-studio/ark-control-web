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
import type { CSSProperties } from "react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { StatusRail } from "@/components/StatusRail";
import {
  APK_URL_COPY_KEY,
  EMPTY_COUNT,
  parseApkMetadata,
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

  const radialStyle: RadialStyle = {
    "--value": summary.passRate,
    "--size": "4.5rem",
    "--thickness": "5px"
  };

  const kpiCards: ReadonlyArray<{
    filter: RunFilter;
    label: string;
    value: number;
    hint: string;
    valueTone: string;
  }> = [
    {
      filter: RUN_FILTER_ALL,
      label: "Total hosts",
      value: summary.total,
      hint: "Target fleet",
      valueTone: "text-base-content"
    },
    {
      filter: RUN_FILTER_SUCCEEDED,
      label: "Verified",
      value: summary.succeeded,
      hint: `${summary.passRate}% pass rate`,
      valueTone: "text-success"
    },
    {
      filter: RUN_FILTER_ACTIVE,
      label: "In progress",
      value: summary.active,
      hint: `${summary.running} running · ${summary.pending} queued`,
      valueTone: "text-info"
    },
    {
      filter: RUN_FILTER_ATTENTION,
      label: "Failures",
      value: summary.attention,
      hint: `${summary.failed} failed · ${summary.timedOut} timed out`,
      valueTone: summary.attention > EMPTY_COUNT ? "text-error" : "text-base-content/50"
    }
  ];

  return (
    <section
      aria-labelledby="release-runs-title"
      className="card card-border overflow-hidden border-base-content/18 bg-base-100 shadow-xs"
    >
      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-center">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div
            aria-label={`${summary.passRate}% rollout pass rate`}
            className={cx(
              "radial-progress shrink-0 bg-base-200/70 text-sm font-black tabular-nums",
              healthMeta.radialClassName
            )}
            role="progressbar"
            style={radialStyle}
          >
            {summary.total > EMPTY_COUNT ? `${summary.passRate}%` : "—"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-field border px-2 py-0.5 text-[0.7rem] font-bold",
                  healthMeta.badgeClassName
                )}
              >
                <HealthIcon aria-hidden="true" size={12} />
                {healthMeta.label}
              </span>
              <span className="text-xs font-bold tabular-nums text-base-content/55">
                Release #{release.id}
              </span>
              {parsed.arch ? (
                <span className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold text-base-content/75">
                  {parsed.arch}
                </span>
              ) : null}
            </div>

            <h2
              className="mt-2 break-words text-xl font-black leading-snug text-base-content sm:text-2xl"
              id="release-runs-title"
            >
              {release.apkFilename}
            </h2>
            <p className="mt-1 text-xs text-base-content/55">
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

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
          {kpiCards.map((item) => {
            const active = activeFilter === item.filter;
            return (
              <button
                aria-pressed={active}
                className={cx(
                  "flex flex-col items-start rounded-box border p-3.5 text-left transition-all",
                  active
                    ? "border-info bg-info/8 shadow-2xs"
                    : "border-base-300 bg-base-200/35 hover:border-base-content/30 hover:bg-base-200/60"
                )}
                key={item.filter}
                onClick={() => onSelectFilter(item.filter)}
                type="button"
              >
                <span className="text-[0.7rem] font-bold uppercase text-base-content/55">
                  {item.label}
                </span>
                <strong
                  className={cx(
                    "mt-1 text-2xl font-black leading-none tabular-nums",
                    item.valueTone
                  )}
                >
                  {item.value}
                </strong>
                <span className="mt-1.5 text-[0.68rem] leading-tight text-base-content/55">
                  {item.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-base-300 bg-base-200/40 px-5 py-3.5 sm:px-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs">
          <span className="font-bold text-base-content/65">Rollout verification</span>
          <span className="font-semibold tabular-nums text-base-content/80">
            {summary.total > EMPTY_COUNT
              ? `${summary.passRate}% succeeded (${summary.succeeded} of ${summary.total} hosts)`
              : "No host deployments recorded"}
          </span>
        </div>
        <StatusRail compact counts={release.statusCounts} showEmptyStatuses={false} />
      </div>
    </section>
  );
}
