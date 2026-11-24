import { Cloud, Globe2, LoaderCircle, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  COMMON_GCP_ZONES,
  EMPTY_ACCOUNT_INPUT
} from "@/components/accounts/accountHelpers";
import { FormModal } from "@/components/ui/FormModal";
import type { AccountInput, GcpAccount } from "@/types";
import { cx } from "@/utils";

function initialFormState(account: GcpAccount | null): AccountInput {
  if (!account) return EMPTY_ACCOUNT_INPUT;
  return {
    name: account.name,
    projectId: account.projectId,
    serviceAccountEmail: account.serviceAccountEmail,
    workloadIdentityProvider: account.workloadIdentityProvider,
    defaultZone: account.defaultZone
  };
}

function AccountFormContent({
  account,
  busy,
  onCancel,
  onSubmit
}: {
  account: GcpAccount | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: AccountInput) => void;
}) {
  const [form, setForm] = useState<AccountInput>(() => initialFormState(account));
  const updateField = (key: keyof AccountInput, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="grid gap-5 p-5" onSubmit={handleSubmit}>
      <section className="grid gap-3.5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-base-content/55">
          <Cloud aria-hidden="true" className="text-info" size={14} />
          <span>Project identity</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control grid gap-1.5">
            <span className="label-text font-bold">Account name</span>
            <input
              className="input input-bordered w-full"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Production control"
              required
              value={form.name}
            />
          </label>
          <label className="form-control grid gap-1.5">
            <span className="label-text font-bold">Project ID</span>
            <input
              className="input input-bordered w-full font-mono text-sm"
              onChange={(event) => updateField("projectId", event.target.value)}
              placeholder="ark-project"
              required
              value={form.projectId}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3.5 border-t border-base-300 pt-5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-base-content/55">
          <ShieldCheck aria-hidden="true" className="text-success" size={14} />
          <span>Workload identity federation</span>
        </div>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Service account</span>
          <input
            className="input input-bordered w-full font-mono text-sm"
            onChange={(event) => updateField("serviceAccountEmail", event.target.value)}
            placeholder="ark-control-vps@project.iam.gserviceaccount.com"
            required
            value={form.serviceAccountEmail}
          />
          <span className="text-xs text-base-content/55">
            IAM principal granted Compute Instance Admin and Workload Identity User roles.
          </span>
        </label>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Workload identity provider</span>
          <input
            className="input input-bordered w-full font-mono text-sm"
            onChange={(event) => updateField("workloadIdentityProvider", event.target.value)}
            placeholder="//iam.googleapis.com/projects/.../locations/global/workloadIdentityPools/.../providers/..."
            required
            value={form.workloadIdentityProvider}
          />
          <span className="text-xs text-base-content/55">
            Full OIDC provider resource URI used for keyless token exchange.
          </span>
        </label>
      </section>

      <section className="grid gap-3.5 border-t border-base-300 pt-5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-base-content/55">
          <Globe2 aria-hidden="true" className="text-info" size={14} />
          <span>Compute defaults</span>
        </div>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Default zone</span>
          <input
            className="input input-bordered w-full font-mono text-sm"
            onChange={(event) => updateField("defaultZone", event.target.value)}
            placeholder="us-central1-c"
            required
            value={form.defaultZone}
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-base-content/50">Quick pick:</span>
          {COMMON_GCP_ZONES.map((zone) => {
            const selected = form.defaultZone === zone;
            return (
              <button
                className={cx(
                  "accounts-zone-chip rounded-md border px-2 py-1 font-mono transition-colors",
                  selected
                    ? "border-info/50 bg-info/12 text-info"
                    : "border-base-300 bg-base-200/70 text-base-content/70 hover:border-info/40 hover:text-base-content"
                )}
                key={zone}
                onClick={() => updateField("defaultZone", zone)}
                type="button"
              >
                {zone}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
        <button className="btn" disabled={busy} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
          Save
        </button>
      </div>
    </form>
  );
}

export function AccountFormModal({
  account,
  busy,
  formKey,
  onClose,
  onSubmit,
  open
}: {
  account: GcpAccount | null;
  busy: boolean;
  formKey: string | number;
  onClose: () => void;
  onSubmit: (input: AccountInput) => void;
  open: boolean;
}) {
  return (
    <FormModal
      onClose={onClose}
      open={open}
      title={account === null ? "Add GCP account" : "Edit GCP account"}
    >
      {open ? (
        <AccountFormContent
          account={account}
          busy={busy}
          key={formKey}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </FormModal>
  );
}
