import { Globe2, RotateCcw, Search, X } from "lucide-react";
import {
  EMPTY_ACCOUNT_FILTERS,
  hasActiveAccountFilters,
  MIN_MULTI_ZONE_COUNT,
  STATUS_FILTER_ALL,
  STATUS_FILTER_DISABLED,
  STATUS_FILTER_ENABLED,
  ZONE_FILTER_ALL,
  type AccountFilters,
  type AccountStatusFilter,
  type AccountSummaryMetrics
} from "@/components/accounts/accountHelpers";
import { cx } from "@/utils";

export function AccountsToolbar({
  filters,
  filteredCount,
  metrics,
  onChange
}: {
  filters: AccountFilters;
  filteredCount: number;
  metrics: AccountSummaryMetrics;
  onChange: (next: AccountFilters) => void;
}) {
  const filtersActive = hasActiveAccountFilters(filters);
  const showZoneFilter = metrics.uniqueZones.length >= MIN_MULTI_ZONE_COUNT;

  const statusTabs: Array<{
    value: AccountStatusFilter;
    label: string;
    count: number;
  }> = [
    { value: STATUS_FILTER_ALL, label: "All", count: metrics.totalCount },
    { value: STATUS_FILTER_ENABLED, label: "Enabled", count: metrics.enabledCount },
    { value: STATUS_FILTER_DISABLED, label: "Disabled", count: metrics.disabledCount }
  ];

  return (
    <section
      aria-label="Account filters"
      className="accounts-toolbar flex flex-col gap-3 rounded-xl border border-base-300 bg-base-100 p-3 sm:p-3.5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <label className="input input-bordered input-sm flex w-full items-center gap-2 sm:max-w-sm">
            <Search aria-hidden="true" className="shrink-0 text-base-content/45" size={15} />
            <input
              aria-label="Search accounts"
              className="min-w-0 grow"
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Search name, project ID, service account, zone..."
              value={filters.search}
            />
            {filters.search ? (
              <button
                aria-label="Clear search"
                className="btn btn-circle btn-ghost btn-xs"
                onClick={() => onChange({ ...filters, search: "" })}
                type="button"
              >
                <X aria-hidden="true" size={13} />
              </button>
            ) : null}
          </label>

          <div
            aria-label="Filter by account status"
            className="accounts-segmented inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg border border-base-300 bg-base-200 p-1"
            role="group"
          >
            {statusTabs.map((tab) => {
              const active = filters.status === tab.value;
              return (
                <button
                  aria-pressed={active}
                  className={cx(
                    "accounts-segment-btn inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-colors",
                    active
                      ? "accounts-segment-btn-active bg-base-100 text-base-content shadow-xs"
                      : "text-base-content/60 hover:text-base-content"
                  )}
                  key={tab.value}
                  onClick={() => onChange({ ...filters, status: tab.value })}
                  type="button"
                >
                  <span>{tab.label}</span>
                  <span
                    className={cx(
                      "rounded px-1.5 py-0.5 text-[0.65rem] tabular-nums",
                      active ? "bg-info/12 text-info" : "bg-base-300/80 text-base-content/60"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {showZoneFilter ? (
            <label className="flex items-center gap-1.5">
              <Globe2 aria-hidden="true" className="hidden shrink-0 text-base-content/45 sm:block" size={14} />
              <select
                aria-label="Filter by default zone"
                className="select select-bordered select-sm w-full sm:w-44"
                onChange={(event) => onChange({ ...filters, zone: event.target.value })}
                value={filters.zone}
              >
                <option value={ZONE_FILTER_ALL}>All zones</option>
                {metrics.uniqueZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-base-300/70 pt-2.5 text-xs lg:justify-end lg:border-t-0 lg:pt-0">
          <span className="font-medium text-base-content/55 tabular-nums">
            Showing <strong className="font-extrabold text-base-content">{filteredCount}</strong> of{" "}
            {metrics.totalCount}
          </span>
          {filtersActive ? (
            <button
              className="btn btn-ghost btn-xs gap-1"
              onClick={() => onChange(EMPTY_ACCOUNT_FILTERS)}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={12} />
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
