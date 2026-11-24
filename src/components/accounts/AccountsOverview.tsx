import {
  ArrowUpRight,
  CloudCog,
  Globe2,
  KeyRound,
  ShieldCheck,
  Terminal
} from "lucide-react";
import {
  EMPTY_COUNT,
  formatZonePreview,
  hasEmbeddedAdminToken,
  type AccountSummaryMetrics
} from "@/components/accounts/accountHelpers";

export function AccountsOverview({
  adminToken,
  metrics,
  onOpenCloudSetup
}: {
  adminToken?: string;
  metrics: AccountSummaryMetrics;
  onOpenCloudSetup: () => void;
}) {
  const tokenReady = hasEmbeddedAdminToken(adminToken);
  const readinessLabel =
    metrics.totalCount === EMPTY_COUNT
      ? "No accounts connected"
      : metrics.disabledCount === EMPTY_COUNT
        ? "All accounts ready for provisioning"
        : `${metrics.disabledCount} paused from provisioning`;

  return (
    <section
      aria-label="GCP accounts overview"
      className="accounts-overview overflow-hidden border border-base-300 bg-base-100"
    >
      <div className="grid xl:grid-cols-[minmax(19rem,0.95fr)_minmax(0,1.45fr)]">
        <div className="accounts-readiness-panel flex flex-col justify-between gap-4 p-5 sm:p-6 xl:border-r xl:border-base-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-base-content/55">
                Federation readiness
              </p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <strong className="text-4xl font-black leading-none tabular-nums text-base-content">
                  {metrics.enabledCount}
                </strong>
                <span className="text-sm font-semibold text-base-content/50">
                  of {metrics.totalCount} active
                </span>
              </div>
            </div>
            <span className="accounts-hero-icon">
              <ShieldCheck aria-hidden="true" size={22} />
            </span>
          </div>

          <div>
            <div
              aria-label={`${metrics.readinessPercent}% of GCP accounts enabled`}
              className="h-2 overflow-hidden rounded-full bg-base-300"
              role="img"
            >
              <span
                className="accounts-progress-fill block h-full rounded-full bg-success"
                style={{ width: `${metrics.readinessPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60">
              <span>
                <strong className="font-extrabold text-base-content tabular-nums">
                  {metrics.readinessPercent}%
                </strong>{" "}
                active capacity
              </span>
              <span>{readinessLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3">
          <article className="accounts-stat-cell flex flex-col justify-between gap-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-base-content/55">
                Projects
              </span>
              <span className="accounts-stat-icon accounts-stat-icon-info">
                <CloudCog aria-hidden="true" size={16} />
              </span>
            </div>
            <div>
              <strong className="text-3xl font-black leading-none tabular-nums text-info">
                {metrics.totalCount}
              </strong>
              <p className="mt-2 text-xs text-base-content/55">
                {metrics.enabledCount} enabled · {metrics.disabledCount} paused
              </p>
            </div>
          </article>

          <article className="accounts-stat-cell accounts-stat-cell-pair flex flex-col justify-between gap-3 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-base-content/55">
                Zones
              </span>
              <span className="accounts-stat-icon accounts-stat-icon-success">
                <Globe2 aria-hidden="true" size={16} />
              </span>
            </div>
            <div className="min-w-0">
              <strong className="text-3xl font-black leading-none tabular-nums text-success">
                {metrics.uniqueZones.length}
              </strong>
              <p
                className="mt-2 truncate font-mono text-xs text-base-content/60"
                title={metrics.uniqueZones.join(", ")}
              >
                {formatZonePreview(metrics.uniqueZones)}
              </p>
            </div>
          </article>

          <article className="accounts-stat-cell accounts-quicksetup-cell col-span-2 flex flex-col justify-between gap-3 p-4 sm:col-span-1 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wide text-base-content/55">
                Cloud Shell setup
              </span>
              <span className="accounts-stat-icon accounts-stat-icon-neutral">
                <Terminal aria-hidden="true" size={16} />
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-base-content/70">
                <KeyRound aria-hidden="true" className="shrink-0 text-info" size={13} />
                <span>{tokenReady ? "Session token embedded" : "Prompts for admin token"}</span>
              </p>
              <button
                className="btn btn-sm justify-between bg-base-100"
                onClick={onOpenCloudSetup}
                type="button"
              >
                <span>Open setup script</span>
                <ArrowUpRight aria-hidden="true" size={15} />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
