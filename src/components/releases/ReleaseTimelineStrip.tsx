import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import {
  EMPTY_COUNT,
  FIRST_PAGE_OFFSET,
  formatReleaseRange,
  PAGE_SIZE,
  parseApkMetadata,
  RELEASE_HEALTH_META,
  summarizeReleaseCounts
} from "@/components/releases/releaseHelpers";
import { StatusBar } from "@/components/StatusRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import type { ReleaseSummary } from "@/types";
import { cx, formatDateTime } from "@/utils";

const TIMELINE_SCROLL_THRESHOLD = 4;

type RadialStyle = CSSProperties & {
  "--value": number;
  "--size": string;
  "--thickness": string;
};

export function ReleaseTimelineStrip({
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
    <section aria-labelledby="release-list-title" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-extrabold uppercase text-base-content/70" id="release-list-title">
            Release timeline
          </h2>
          {releases.length > EMPTY_COUNT ? (
            <span className="badge badge-sm badge-soft font-bold tabular-nums">
              {formatReleaseRange(offset, releases.length)}
            </span>
          ) : null}
        </div>
        <div className="join">
          <button
            aria-label="Previous release page"
            className="btn btn-square btn-xs join-item border-base-content/20 bg-base-100 hover:bg-base-300/60"
            disabled={offset === FIRST_PAGE_OFFSET || loading}
            onClick={onPreviousPage}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={15} />
          </button>
          <button
            aria-label="Next release page"
            className="btn btn-square btn-xs join-item border-base-content/20 bg-base-100 hover:bg-base-300/60"
            disabled={releases.length < PAGE_SIZE || loading}
            onClick={onNextPage}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        </div>
      </div>

      {releases.length === EMPTY_COUNT ? (
        <div className="surface">
          {loading ? (
            <LoadingBlock label="Loading releases" />
          ) : (
            <EmptyState
              detail="APK deployments will appear here once recorded."
              title="No releases"
            />
          )}
        </div>
      ) : null}

      {releases.length > EMPTY_COUNT ? (
        <div
          className={cx(
            "grid grid-cols-1 gap-3 p-0.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
            releases.length > TIMELINE_SCROLL_THRESHOLD && "scrollbar-thin max-h-72 overflow-y-auto"
          )}
        >
          {releases.map((release) => {
            const selected = release.id === selectedId;
            const summary = summarizeReleaseCounts(release.statusCounts);
            const healthMeta = RELEASE_HEALTH_META[summary.health];
            const parsed = parseApkMetadata(release.apkFilename);
            const radialStyle: RadialStyle = {
              "--value": summary.passRate,
              "--size": "2.85rem",
              "--thickness": "3.5px"
            };

            return (
              <button
                aria-pressed={selected}
                className={cx(
                  "surface flex flex-col justify-between gap-3 p-3.5 text-left transition-colors",
                  selected ? "border-primary" : "hover:border-base-content/30"
                )}
                key={release.id}
                onClick={() => onSelect(release.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={cx(
                      "radial-progress shrink-0 bg-base-200/70 text-[0.68rem] font-black tabular-nums",
                      healthMeta.radialClassName
                    )}
                    style={radialStyle}
                  >
                    {summary.total > EMPTY_COUNT ? `${summary.passRate}%` : "—"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-extrabold text-base-content">
                        {parsed.version ?? `Release #${release.id}`}
                      </span>
                      <span className="shrink-0 font-mono text-[0.6875rem] font-semibold tabular-nums text-base-content/45">
                        #{release.id}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[0.72rem] font-medium text-base-content/70">
                      {release.apkFilename}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-base-content/55">
                      <span>{formatDateTime(release.createdAt)}</span>
                      {parsed.arch ? (
                        <span className="rounded bg-base-200 px-1.5 py-0.5 font-mono text-[0.65rem] text-base-content/70">
                          {parsed.arch}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-[0.7rem] font-semibold tabular-nums">
                    <span className="text-base-content/70">
                      {summary.total > EMPTY_COUNT
                        ? `${summary.succeeded}/${summary.total} verified`
                        : "No host runs"}
                    </span>
                    <div className="flex items-center gap-2">
                      {summary.attention > EMPTY_COUNT ? (
                        <span className="text-error">{summary.attention} failed</span>
                      ) : null}
                      {summary.active > EMPTY_COUNT ? (
                        <span className="text-info">{summary.active} active</span>
                      ) : null}
                    </div>
                  </div>
                  <StatusBar className="h-1.5 bg-base-300/80" counts={release.statusCounts} total={summary.total} />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
