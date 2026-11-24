import { EMPTY_COUNT, HOST_RUN_PRESENTATION, PERCENT_SCALE } from "@/components/releases/releaseHelpers";
import { HOST_RUN_STATUSES, type ReleaseSummary } from "@/types";
import { cx } from "@/utils";

export function StatusBar({ className, counts, total }: {
  className: string;
  counts: ReleaseSummary["statusCounts"];
  total: number;
}) {
  return (
    <div
      aria-label={`${total} host runs`}
      className={cx("flex w-full overflow-hidden rounded", className)}
      role="img"
    >
      {total > EMPTY_COUNT && HOST_RUN_STATUSES.map((status) => {
        const count = counts[status] ?? EMPTY_COUNT;
        return count > EMPTY_COUNT ? (
          <span
            className={HOST_RUN_PRESENTATION[status].barClassName}
            key={status}
            style={{ width: `${(count / total) * PERCENT_SCALE}%` }}
          />
        ) : null;
      })}
    </div>
  );
}

export function StatusRail({
  counts,
  compact = false,
  showEmptyStatuses = true
}: {
  counts: ReleaseSummary["statusCounts"];
  compact?: boolean;
  showEmptyStatuses?: boolean;
}) {
  const total = HOST_RUN_STATUSES.reduce((sum, status) => sum + (counts[status] ?? EMPTY_COUNT), EMPTY_COUNT);

  return (
    <div className="min-w-0">
      <StatusBar className={cx(compact ? "h-2" : "h-2.5", "bg-base-300")} counts={counts} total={total} />
      <div className={`flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-base-content/55 ${compact ? "mt-1.5" : "mt-2"}`}>
        {HOST_RUN_STATUSES.map((status) => {
          const count = counts[status] ?? EMPTY_COUNT;
          if (!showEmptyStatuses && !(count > EMPTY_COUNT)) return null;
          const { barClassName, label } = HOST_RUN_PRESENTATION[status];
          return (
            <span className="inline-flex items-center gap-1" key={status}>
              <span className={`size-2 rounded-sm ${barClassName}`} />
              {label} {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}
