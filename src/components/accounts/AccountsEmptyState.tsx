import { Code2, Plus } from "lucide-react";

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
      className="control-panel rounded-lg border bg-base-100"
    >
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <div>
          <h2
            className="text-xl font-extrabold tracking-tight text-base-content sm:text-2xl"
            id="empty-accounts-heading"
          >
            Connect your first GCP project
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-6 text-base-content/65">
            Link a Google Cloud project with Workload Identity Federation to provision ReDroid VPS
            hosts without storing static service account keys.
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

        <dl className="divide-y divide-base-300 border-t border-base-300 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="pb-4">
            <dt className="text-sm font-bold text-base-content">Automated Cloud Shell script</dt>
            <dd className="mt-1 text-xs leading-5 text-base-content/60">
              Enables IAM and Compute APIs, creates the OIDC Workload Identity Pool, grants Compute
              Admin, and registers the project automatically.
            </dd>
          </div>

          <div className="pt-4">
            <dt className="text-sm font-bold text-base-content">Manual registration</dt>
            <dd className="mt-1 text-xs leading-5 text-base-content/60">
              For projects with Workload Identity Federation already configured via Terraform or
              gcloud. Enter the project ID, service account, provider URI, and default zone.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
