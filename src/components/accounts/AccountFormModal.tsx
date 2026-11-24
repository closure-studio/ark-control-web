import { type FormEvent, useState } from "react";
import {
  COMMON_GCP_ZONES,
  EMPTY_ACCOUNT_INPUT
} from "@/components/accounts/accountHelpers";
import { FormModal } from "@/components/ui/FormModal";
import { ModalFormActions } from "@/components/ui/ModalFormActions";
import { PresetButton } from "@/components/ui/PresetButton";
import type { AccountInput, GcpAccount } from "@/types";

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
    <form className="grid gap-6 p-5" onSubmit={handleSubmit}>
      <section className="grid gap-3">
        <h3 className="text-sm font-bold text-base-content">Project identity</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="fieldset gap-1.5 p-0">
            <span className="label p-0 text-xs font-semibold text-base-content">Account name</span>
            <input
              className="input w-full"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Production control"
              required
              value={form.name}
            />
          </label>
          <label className="fieldset gap-1.5 p-0">
            <span className="label p-0 text-xs font-semibold text-base-content">Project ID</span>
            <input
              className="input w-full font-mono text-sm"
              onChange={(event) => updateField("projectId", event.target.value)}
              placeholder="ark-project"
              required
              value={form.projectId}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 border-t border-base-300 pt-5">
        <h3 className="text-sm font-bold text-base-content">Workload identity federation</h3>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-semibold text-base-content">Service account</span>
          <input
            className="input w-full font-mono text-sm"
            onChange={(event) => updateField("serviceAccountEmail", event.target.value)}
            placeholder="ark-control-vps@project.iam.gserviceaccount.com"
            required
            value={form.serviceAccountEmail}
          />
          <span className="text-xs text-muted">
            IAM principal granted Compute Instance Admin and Workload Identity User roles.
          </span>
        </label>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-semibold text-base-content">
            Workload identity provider
          </span>
          <input
            className="input w-full font-mono text-sm"
            onChange={(event) => updateField("workloadIdentityProvider", event.target.value)}
            placeholder="//iam.googleapis.com/projects/.../locations/global/workloadIdentityPools/.../providers/..."
            required
            value={form.workloadIdentityProvider}
          />
          <span className="text-xs text-muted">
            Full OIDC provider resource URI used for keyless token exchange.
          </span>
        </label>
      </section>

      <section className="grid gap-3 border-t border-base-300 pt-5">
        <h3 className="text-sm font-bold text-base-content">Compute defaults</h3>
        <label className="fieldset gap-1.5 p-0">
          <span className="label p-0 text-xs font-semibold text-base-content">Default zone</span>
          <input
            className="input w-full text-sm"
            onChange={(event) => updateField("defaultZone", event.target.value)}
            placeholder="us-central1-c"
            required
            value={form.defaultZone}
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">Common zones:</span>
          {COMMON_GCP_ZONES.map((zone) => (
            <PresetButton
              key={zone}
              onClick={() => updateField("defaultZone", zone)}
              pressed={form.defaultZone === zone}
            >
              {zone}
            </PresetButton>
          ))}
        </div>
      </section>

      <ModalFormActions busy={busy} onCancel={onCancel}>Save</ModalFormActions>
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
      busy={busy}
      kind="form"
      onClose={onClose}
      open={open}
      title={account === null ? "Add GCP account" : "Edit GCP account"}
    >
      <AccountFormContent
        account={account}
        busy={busy}
        key={formKey}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </FormModal>
  );
}
