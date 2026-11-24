import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Package
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  EMPTY_COUNT,
  FIRST_PAGE_OFFSET,
  formatReleaseRange,
  PAGE_SIZE,
  PERCENT_SCALE,
  RELEASE_HEALTH_ACTIVE,
  RELEASE_HEALTH_ATTENTION,
  RELEASE_HEALTH_EMPTY,
  RELEASE_HEALTH_HEALTHY,
  RELEASE_HEALTH_META,
  STATUS_BAR_SEGMENTS,
  summarizeReleaseCounts,
  type ReleaseHealth
} from "@/components/releases/releaseHelpers";
import type { ReleaseSummary } from "@/types";
import { cx, formatDateTime } from "@/utils";

const HEALTH_ICONS: Record<ReleaseHealth, typeof Package> = {
  [RELEASE_HEALTH_HEALTHY]: CircleCheck,
  [RELEASE_HEALTH_ACTIVE]: Activity,
  [RELEASE_HEALTH_ATTENTION]: CircleAlert,
  [RELEASE_HEALTH_EMPTY]: Package
};

function ReleaseMiniBar({ counts, total }: { counts: ReleaseSummary["statusCounts"]; total: number }) {
  return (
    <div
      aria-label={`${total} host runs`}
      className="flex h-1.5 w-full overflow-hidden rounded bg-base-300/80"
      role="img"
    >
      {total > EMPTY_COUNT
        ? STATUS_BAR_SEGMENTS.map((segment) => {
            const value = counts[segment.key] ?? EMPTY_COUNT;
            return value > EMPTY_COUNT ? (
              <span
                className={segment.className}
                key={segment.key}
                style={{ width: `${(value / total) * PERCENT_SCALE}%` }}
              />
            ) : null;
          })
        : null}
    </div>
  );
}

export function ReleaseRail({
  loading,
  offset,
  onNextPage,
  onPreviousPage,
  onSelect,
  releases,
  selectedId
}: {
  loading: boolean;
  offset: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSelect: (id: number) => void;
  releases: ReleaseSummary[];
  selectedId: number | null;
}) {
  return (
    <section
      aria-labelledby="release-list-title"
      className="card card-border min-w-0 overflow-hidden border-base-content/18 bg-base-100 shadow-xs xl:sticky xl:top-20 xl:self-start"
    >
      <div className="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-base font-extrabold text-base-content" id="release-list-title">
            Release history
          </h2>
          {releases.length > EMPTY_COUNT ? (
            <span className="rounded bg-base-200 px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums text-base-content/65">
              {formatReleaseRange(offset, releases.length)}
            </span>
          ) : null}
        </div>
        <div className="join shrink-0">
          <button
            aria-label="Previous release page"
            className="btn btn-square btn-xs join-item"
            disabled={offset === FIRST_PAGE_OFFSET || loading}
            onClick={onPreviousPage}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={15} />
          </button>
          <button
            aria-label="Next release page"
            className="btn btn-square btn-xs join-item"
            disabled={releases.length < PAGE_SIZE || loading}
            onClick={onNextPage}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        </div>
      </div>

      {loading && releases.length === EMPTY_COUNT ? <LoadingBlock label="Loading releases" /> : null}
      {!loading && releases.length === EMPTY_COUNT ? (
        <EmptyState detail="APK deployments will appear here once recorded." title="No releases" />
      ) : null}

      {releases.length > EMPTY_COUNT ? (
        <div className="scrollbar-thin max-h-80 divide-y divide-base-300 overflow-y-auto xl:max-h-[calc(100vh-11rem)]">
          {releases.map((release) => {
            const selected = release.id === selectedId;
            const summary = summarizeReleaseCounts(release.statusCounts);
            const HealthIcon = HEALTH_ICONS[summary.health];
            const healthMeta = RELEASE_HEALTH_META[summary.health];

            return (
              <button
                aria-pressed={selected}
                className={cx(
                  "block w-full px-4 py-3.5 text-left transition-colors",
                  selected
                    ? "bg-info/8 shadow-[inset_3px_0_0_var(--color-info)] hover:bg-info/11"
                    : "hover:bg-base-content/4"
                )}
                key={release.id}
                onClick={() => onSelect(release.id)}
                type="button"
              >
                <div className="flex items-start gap-2.5">
                  <HealthIcon
                    aria-hidden="true"
                    className={cx("mt-0.5 shrink-0", healthMeta.iconClassName)}
                    size={15}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="break-words text-[0.8125rem] font-extrabold leading-snug text-base-content">
                        {release.apkFilename}
                      </span>
                      <span className="shrink-0 text-[0.6875rem] font-semibold tabular-nums text-base-content/45">
                        #{release.id}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[0.72rem]">
                      <span className="text-base-content/55">{formatDateTime(release.createdAt)}</span>
                      <div className="flex items-center gap-2 font-semibold tabular-nums">
                        {summary.total > EMPTY_COUNT ? (
                          <span className="text-base-content/75">
                            {summary.succeeded}/{summary.total}
                          </span>
                        ) : (
                          <span className="text-base-content/45">No runs</span>
                        )}
                        {summary.attention > EMPTY_COUNT ? (
                          <span className="text-error">{summary.attention} failed</span>
                        ) : null}
                        {summary.active > EMPTY_COUNT ? (
                          <span className="text-info">{summary.active} active</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <ReleaseMiniBar counts={release.statusCounts} total={summary.total} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
