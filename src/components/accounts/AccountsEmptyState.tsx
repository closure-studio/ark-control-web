import { Cloud, Code2, Plus, ShieldCheck, Sparkles } from "lucide-react";

export function AccountsEmptyState({
  onAddManual,
  onOpenCloudSetup
}: {
  onAddManual: () => void;
  onOpenCloudSetup: () => void;
}) {
  return (
    <section
      aria-labelledby="empty-accounts-heading"
      className="accounts-empty-hero overflow-hidden rounded-xl border border-base-300 bg-base-100"
    >
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-[0.7rem] font-extrabold uppercase text-info">
            <Sparkles aria-hidden="true" size={12} />
            Zero-key cloud federation
          </span>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-base-content" id="empty-accounts-heading">
            Connect your first GCP project
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-base-content/65">
            Link a Google Cloud project via Workload Identity Federation to provision managed ReDroid VPS hosts without storing static service account JSON keys.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              className="btn btn-primary btn-sm gap-2"
              onClick={onOpenCloudSetup}
              type="button"
            >
              <Code2 aria-hidden="true" size={16} />
              Launch Cloud Shell setup
            </button>
            <button
              className="btn btn-sm gap-2"
              onClick={onAddManual}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Register manually
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-base-300 bg-base-200/70 p-4">
            <div className="flex items-start gap-3">
              <span className="accounts-stat-icon accounts-stat-icon-info mt-0.5">
                <ShieldCheck aria-hidden="true" size={16} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-base-content">Automated Cloud Shell script</h3>
                <p className="mt-1 text-xs leading-5 text-base-content/60">
                  Enables required IAM &amp; Compute APIs, provisions the OIDC Workload Identity Pool, grants Compute Admin, and registers the account automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-base-300 bg-base-200/70 p-4">
            <div className="flex items-start gap-3">
              <span className="accounts-stat-icon accounts-stat-icon-success mt-0.5">
                <Cloud aria-hidden="true" size={16} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-base-content">Manual registration</h3>
                <p className="mt-1 text-xs leading-5 text-base-content/60">
                  Already configured WIF in Terraform or gcloud? Enter your project ID, service account email, provider resource path, and default compute zone directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
