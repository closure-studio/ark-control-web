import {
  Check,
  Cloud,
  Code2,
  Copy,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  ServerCog,
  Trash2
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { ApiClient } from "@/api/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CLOUD_SHELL_SCRIPT } from "@/constants/cloudShellScript";
import type { AccountInput, GcpAccount } from "@/types";
import { formatDateTime, messageForError } from "@/utils";

const emptyAccount: AccountInput = {
  name: "",
  projectId: "",
  projectNumber: "",
  serviceAccountEmail: "",
  workloadIdentityProvider: "",
  defaultZone: "us-central1-c"
};

type NoticeState = { tone: "success" | "error" | "info"; text: string };

function AccountForm({
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
  const [form, setForm] = useState<AccountInput>(() =>
    account
      ? {
          name: account.name,
          projectId: account.projectId,
          projectNumber: account.projectNumber,
          serviceAccountEmail: account.serviceAccountEmail,
          workloadIdentityProvider: account.workloadIdentityProvider,
          defaultZone: account.defaultZone
        }
      : emptyAccount
  );
  const set = (key: keyof AccountInput, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  const fields: Array<{ key: keyof AccountInput; label: string; placeholder: string; mono?: boolean }> = [
    { key: "name", label: "Account name", placeholder: "production" },
    { key: "projectId", label: "Project ID", placeholder: "ark-project", mono: true },
    { key: "projectNumber", label: "Project number", placeholder: "1234567890", mono: true },
    { key: "serviceAccountEmail", label: "Service account", placeholder: "ark-control@project.iam.gserviceaccount.com", mono: true },
    { key: "workloadIdentityProvider", label: "Workload identity provider", placeholder: "//iam.googleapis.com/projects/...", mono: true },
    { key: "defaultZone", label: "Default zone", placeholder: "us-central1-c", mono: true }
  ];

  return (
    <form className="grid gap-4 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label className={field.key === "workloadIdentityProvider" ? "form-control grid gap-1.5 md:col-span-2" : "form-control grid gap-1.5"} key={field.key}>
            <span className="label-text font-bold">{field.label}</span>
            <input className={`input input-bordered w-full ${field.mono ? "font-mono text-sm" : ""}`} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} required value={form[field.key]} />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
        <button className="btn" disabled={busy} onClick={onCancel} type="button">Cancel</button>
        <button className="btn btn-primary" disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" size={16} /> : null}Save</button>
      </div>
    </form>
  );
}

function CloudShellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(CLOUD_SHELL_SCRIPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <FormModal onClose={onClose} open={open} title="Cloud Shell setup" width="max-w-4xl">
      <div className="grid gap-3 p-4">
        <div className="flex justify-end">
          <button className="btn btn-sm" onClick={() => void copy()} type="button">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}</button>
        </div>
        <pre className="control-code control-scrollbar max-h-[65vh] overflow-auto rounded-lg bg-neutral p-4 text-xs text-neutral-content"><code>{CLOUD_SHELL_SCRIPT}</code></pre>
      </div>
    </FormModal>
  );
}

export function AccountsPage({ api }: { api: ApiClient }) {
  const [accounts, setAccounts] = useState<GcpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [formTarget, setFormTarget] = useState<GcpAccount | "new" | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<GcpAccount | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listAccounts();
      setAccounts(response.accounts);
      setError(null);
    } catch (loadError) {
      setError(messageForError(loadError, "Unable to load GCP accounts."));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  function setBusy(id: number, value: boolean) {
    setBusyIds((current) => {
      const next = new Set(current); value ? next.add(id) : next.delete(id); return next;
    });
  }

  async function save(input: AccountInput) {
    setFormBusy(true);
    setNotice(null);
    try {
      if (formTarget === "new") {
        await api.createAccount(input);
        setNotice({ tone: "success", text: `${input.name} was added.` });
      } else if (formTarget) {
        await api.updateAccount(formTarget.id, input);
        setNotice({ tone: "success", text: `${input.name} was updated.` });
      }
      setFormTarget(null);
      await load();
    } catch (saveError) {
      setNotice({ tone: "error", text: messageForError(saveError, "Unable to save account.") });
    } finally {
      setFormBusy(false);
    }
  }

  async function toggle(account: GcpAccount, enabled: boolean) {
    setBusy(account.id, true);
    try {
      await api.updateAccount(account.id, { enabled });
      await load();
    } catch (toggleError) {
      setNotice({ tone: "error", text: messageForError(toggleError, "Unable to update account.") });
    } finally {
      setBusy(account.id, false);
    }
  }

  async function provision(account: GcpAccount) {
    setBusy(account.id, true);
    setNotice({ tone: "info", text: `Creating a VPS in ${account.name}.` });
    try {
      const result = await api.provisionVps(account.id);
      setNotice({ tone: "success", text: `${result.vps.name} was created and added to Watcher.` });
    } catch (provisionError) {
      setNotice({ tone: "error", text: messageForError(provisionError, "Unable to create GCP VPS.") });
    } finally {
      setBusy(account.id, false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const result = await api.deleteAccount(deleteTarget.id);
      setNotice({ tone: "success", text: `${deleteTarget.name} and ${result.vps.length} linked VPS record${result.vps.length === 1 ? "" : "s"} were deleted.` });
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      setNotice({ tone: "error", text: messageForError(deleteError, `Unable to delete ${deleteTarget.name}.`) });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        actions={<><RefreshButton loading={loading} onClick={() => void load()} /><button className="btn btn-sm" onClick={() => setShowScript(true)} type="button"><Code2 size={16} />Cloud setup</button><button className="btn btn-primary btn-sm" onClick={() => setFormTarget("new")} type="button"><Plus size={16} />Account</button></>}
        eyebrow="Cloud access"
        title="GCP Accounts"
      />
      <div className="grid gap-4">
        {notice ? <Notice onClose={() => setNotice(null)} tone={notice.tone}>{notice.text}</Notice> : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load()} /> : null}
        {loading && accounts.length === 0 ? <LoadingBlock label="Loading GCP accounts" /> : null}
        {!loading && accounts.length === 0 ? <EmptyState title="No GCP accounts" detail="Register an account manually or run the Cloud Shell setup." /> : null}

        {accounts.length > 0 ? (
          <section aria-label="GCP account list" className="grid max-w-3xl gap-4">
            {accounts.map((account) => {
              const busy = busyIds.has(account.id);
              return (
                <article className="control-panel card border bg-base-100" key={account.id}>
                  <div className="card-body gap-5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="device-icon"><Cloud size={20} /></div>
                      <div className="min-w-0 grow">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold">{account.name}</h2><StatusBadge value={account.enabled ? "Enabled" : "Disabled"} /></div>
                        <p className="mt-1 break-all font-mono text-xs text-base-content/60">{account.projectId}</p>
                      </div>
                      {busy ? <LoaderCircle className="animate-spin text-primary" size={18} /> : null}
                    </div>
                    <dl className="grid gap-4 border-y border-base-300 py-4 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs text-base-content/50">Default zone</dt><dd className="mt-1 font-mono font-bold">{account.defaultZone}</dd></div>
                      <div><dt className="text-xs text-base-content/50">Project number</dt><dd className="mt-1 font-mono font-bold">{account.projectNumber}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-xs text-base-content/50">Service account</dt><dd className="mt-1 break-all font-mono text-xs font-bold">{account.serviceAccountEmail}</dd></div>
                    </dl>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-base-content/50">Updated {formatDateTime(account.updatedAt)}</span>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <label className="flex items-center gap-2 text-xs font-semibold"><input checked={account.enabled} className="toggle toggle-success toggle-sm" disabled={busy} onChange={(event) => void toggle(account, event.target.checked)} type="checkbox" />Enabled</label>
                        <div className="join">
                          <div className="tooltip" data-tip="Create VPS"><button aria-label={`Create VPS in ${account.name}`} className="btn btn-primary btn-square btn-sm join-item" disabled={busy || !account.enabled} onClick={() => void provision(account)} type="button"><ServerCog size={16} /></button></div>
                          <div className="tooltip" data-tip="Edit account"><button aria-label={`Edit ${account.name}`} className="btn btn-square btn-sm join-item" disabled={busy} onClick={() => setFormTarget(account)} type="button"><Pencil size={15} /></button></div>
                          <div className="tooltip tooltip-left" data-tip="Delete account"><button aria-label={`Delete ${account.name}`} className="btn btn-error btn-square btn-sm join-item" disabled={busy} onClick={() => setDeleteTarget(account)} type="button"><Trash2 size={15} /></button></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>

      <FormModal onClose={() => setFormTarget(null)} open={formTarget !== null} title={formTarget === "new" ? "Add GCP account" : "Edit GCP account"}>
        {formTarget !== null ? <AccountForm account={formTarget === "new" ? null : formTarget} busy={formBusy} key={formTarget === "new" ? "new" : formTarget.id} onCancel={() => setFormTarget(null)} onSubmit={(input) => void save(input)} /> : null}
      </FormModal>
      <CloudShellModal onClose={() => setShowScript(false)} open={showScript} />
      <ConfirmDialog
        busy={deleteBusy}
        confirmation={deleteTarget?.name ?? ""}
        detail={<><p>All linked GCP VPS instances will be deleted before the account is removed.</p><p className="mt-2">If any cloud deletion fails, the account and failed VPS records remain available for retry.</p></>}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "account"}`}
      />
    </div>
  );
}
