import {
  Activity,
  CircleAlert,
  CircleCheck,
  Clock3,
  ExternalLink,
  LoaderCircle,
  PackageCheck,
  RefreshCw
} from "lucide-react";
import { StatusRail } from "@/components/StatusRail";
import {
  EMPTY_COUNT,
  RELEASE_HEALTH_ACTIVE,
  RELEASE_HEALTH_ATTENTION,
  RELEASE_HEALTH_EMPTY,
  RELEASE_HEALTH_HEALTHY,
  RELEASE_HEALTH_META,
  summarizeReleaseCounts,
  type ReleaseHealth
} from "@/components/releases/releaseHelpers";
import type { ReleaseSummary } from "@/types";
import { cx, formatDateTime } from "@/utils";

const HEALTH_BADGE_ICONS: Record<ReleaseHealth, typeof CircleCheck> = {
  [RELEASE_HEALTH_HEALTHY]: CircleCheck,
  [RELEASE_HEALTH_ACTIVE]: Activity,
  [RELEASE_HEALTH_ATTENTION]: CircleAlert,
  [RELEASE_HEALTH_EMPTY]: Clock3
};

export function ReleaseDetailHeader({
  onRefreshRuns,
  release,
  runsLoading
}: {
  onRefreshRuns: () => void;
  release: ReleaseSummary;
  runsLoading: boolean;
}) {
  const summary = summarizeReleaseCounts(release.statusCounts);
  const healthMeta = RELEASE_HEALTH_META[summary.health];
  const HealthIcon = HEALTH_BADGE_ICONS[summary.health];

  return (
    <div className="border-b border-base-300">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-field border border-base-content/25 bg-base-100 text-info shadow-2xs">
            <PackageCheck aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0">
            <h2
              className="break-words text-xl font-black leading-snug text-base-content"
              id="release-runs-title"
            >
              {release.apkFilename}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-base-content/55">
              <span className="font-semibold tabular-nums text-base-content/70">#{release.id}</span>
              <span aria-hidden="true" className="text-base-content/30">·</span>
              <span>Created {formatDateTime(release.createdAt)}</span>
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[0.7rem] font-bold",
                  healthMeta.badgeClassName
                )}
              >
                <HealthIcon aria-hidden="true" size={12} />
                {healthMeta.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            className="btn btn-sm gap-1.5"
            href={release.finalUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" size={14} />
            Open APK
          </a>
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

      <div className="border-t border-base-300 bg-base-200/42 px-5 py-3.5 sm:px-6">
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
    </div>
  );
}
