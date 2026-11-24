import { Code2, Plus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

const SETUP_OPTIONS = [
  {
    title: "Automated Cloud Shell script",
    detail: "Enables IAM and Compute APIs, creates the OIDC Workload Identity Pool, grants Compute Admin, and registers the project automatically."
  },
  {
    title: "Manual registration",
    detail: "For projects with Workload Identity Federation already configured via Terraform or gcloud. Enter the project ID, service account, provider URI, and default zone."
  }
] as const;

export function AccountsEmptyState({
  onAddManual,
  onOpenCloudSetup
}: {
  onAddManual: () => void;
  onOpenCloudSetup: () => void;
}) {
  return (
    <Panel aria-labelledby="empty-accounts-heading">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2
            className="text-xl font-extrabold tracking-tight text-base-content sm:text-2xl"
            id="empty-accounts-heading"
          >
            Connect your first GCP project
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted">
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
          {SETUP_OPTIONS.map(({ title, detail }) => (
            <div className="py-4 first:pt-0 last:pb-0" key={title}>
              <dt className="text-sm font-bold">{title}</dt>
              <dd className="mt-1 text-xs leading-5 text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}
