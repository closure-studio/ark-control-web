import { LoaderCircle, Pencil, Plus, Server, Terminal, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "@/api/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { FormModal } from "@/components/ui/FormModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { usePolling } from "@/hooks/usePolling";
import type { VerifyResult, VpsFormInput, VpsInventoryResponse, VpsResource } from "@/types";
import { formatDateTime, messageForError } from "@/utils";

type NoticeState = { tone: "success" | "error" | "info"; text: string };
type Filters = { search: string; watcher: string };

const DEFAULT_SSH_PORT = 22;
const DEFAULT_SSH_USERNAME = "root";
const FILTER_ALL = "all";
const FILTER_WATCHER_DISABLED = "disabled";
const FILTER_WATCHER_ENABLED = "enabled";
const MAX_SSH_PORT = 65_535;
const MIN_SSH_PORT = 1;
const NEW_VPS_TARGET = "new";
const VPS_POLL_INTERVAL_MS = 15_000;

const emptyFilters: Filters = { search: "", watcher: FILTER_ALL };

function matchesFilters(vps: VpsResource, filters: Filters): boolean {
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    ![vps.name, vps.address, vps.username].some((value) => value.toLowerCase().includes(query))
  ) {
    return false;
  }
  if (filters.watcher === FILTER_WATCHER_ENABLED && !vps.watcherEnabled) return false;
  if (filters.watcher === FILTER_WATCHER_DISABLED && vps.watcherEnabled) return false;
  return true;
}

function ActionButtons({
  name,
  busy,
  onVerify,
  onEdit,
  onDelete
}: {
  name: string;
  busy: boolean;
  onVerify: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div aria-label={`Actions for ${name}`} className="join">
      <div className="tooltip" data-tip="Verify SSH">
        <button aria-label={`Verify ${name}`} className="btn btn-square btn-sm join-item" disabled={busy} onClick={onVerify} type="button">
          {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <Terminal aria-hidden="true" size={15} />}
        </button>
      </div>
      <div className="tooltip" data-tip="Edit VPS">
        <button aria-label={`Edit ${name}`} className="btn btn-square btn-sm join-item" disabled={busy} onClick={onEdit} type="button">
          <Pencil aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="tooltip tooltip-left" data-tip="Delete VPS">
        <button aria-label={`Delete ${name}`} className="btn btn-error btn-square btn-sm join-item" disabled={busy} onClick={onDelete} type="button">
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}

function VpsForm({
  vps,
  busy,
  onCancel,
  onSubmit
}: {
  vps: VpsResource | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: VpsFormInput) => void;
}) {
  const [form, setForm] = useState({
    name: vps?.name ?? "",
    address: vps?.address ?? "",
    port: vps?.port ?? DEFAULT_SSH_PORT,
    username: vps?.username ?? DEFAULT_SSH_USERNAME,
    password: "",
    watcherEnabled: vps?.watcherEnabled ?? true
  });
  const field = (key: keyof typeof form, value: string | number | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: form.name,
      address: form.address,
      port: form.port,
      username: form.username,
      ...(form.password ? { password: form.password } : {}),
      watcherEnabled: form.watcherEnabled
    });
  }

  return (
    <form className="grid gap-4 p-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Name</span>
          <input className="input input-bordered w-full" onChange={(event) => field("name", event.target.value)} required value={form.name} />
        </label>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Address</span>
          <input className="input input-bordered w-full font-mono" onChange={(event) => field("address", event.target.value)} required value={form.address} />
        </label>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">SSH port</span>
          <input className="input input-bordered w-full font-mono" max={MAX_SSH_PORT} min={MIN_SSH_PORT} onChange={(event) => field("port", Number(event.target.value))} required type="number" value={form.port} />
        </label>
        <label className="form-control grid gap-1.5">
          <span className="label-text font-bold">Username</span>
          <input className="input input-bordered w-full" onChange={(event) => field("username", event.target.value)} required value={form.username} />
        </label>
        <label className="form-control grid gap-1.5 sm:col-span-2">
          <span className="label-text font-bold">{vps ? "New password" : "Password"}</span>
          <input className="input input-bordered w-full" onChange={(event) => field("password", event.target.value)} required={!vps} type="password" value={form.password} />
        </label>
      </div>
      <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-base-300 bg-base-200 px-3">
        <span>
          <strong className="block text-sm">Watcher target</strong>
          <span className="text-xs text-base-content/60">Include this VPS in future release runs.</span>
        </span>
        <input checked={form.watcherEnabled} className="toggle toggle-success" onChange={(event) => field("watcherEnabled", event.target.checked)} type="checkbox" />
      </label>
      <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
        <button className="btn" disabled={busy} onClick={onCancel} type="button">Cancel</button>
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
          Save
        </button>
      </div>
    </form>
  );
}

export function VpsPage({ api }: { api: ApiClient }) {
  const [inventory, setInventory] = useState<VpsInventoryResponse | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [formTarget, setFormTarget] = useState<VpsResource | typeof NEW_VPS_TARGET | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VpsResource | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setInventory(await api.listVps());
      setError(null);
    } catch (loadError) {
      setError(messageForError(loadError, "Unable to load VPS inventory."));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load(true);
  }, [load]);
  usePolling(() => void load(false), VPS_POLL_INTERVAL_MS);

  const filtered = useMemo(
    () => (inventory?.vps ?? []).filter((vps) => matchesFilters(vps, filters)),
    [inventory, filters]
  );
  const filtersActive = filters.search !== emptyFilters.search || filters.watcher !== emptyFilters.watcher;

  function setBusy(id: number, value: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function verify(vps: VpsResource) {
    setBusy(vps.id, true);
    setNotice(null);
    try {
      const { result } = await api.verifyVps(vps.id);
      setNotice({ tone: result.success ? "success" : "error", text: `${vps.name}: ${verifySummary(result)}` });
    } catch (verifyError) {
      setNotice({ tone: "error", text: messageForError(verifyError, `Unable to verify ${vps.name}.`) });
    } finally {
      setBusy(vps.id, false);
    }
  }

  async function saveForm(input: VpsFormInput) {
    setFormBusy(true);
    setNotice(null);
    try {
      if (formTarget === NEW_VPS_TARGET) {
        if (!input.password) return;
        await api.createVps({ ...input, password: input.password });
        setNotice({ tone: "success", text: `${input.name} was added.` });
      } else if (formTarget) {
        await api.updateVps(formTarget.id, input);
        setNotice({ tone: "success", text: `${input.name} was updated.` });
      }
      setFormTarget(null);
      await load(false);
    } catch (saveError) {
      setNotice({ tone: "error", text: messageForError(saveError, "Unable to save VPS.") });
    } finally {
      setFormBusy(false);
    }
  }

  async function toggleWatcher(vps: VpsResource, enabled: boolean) {
    setBusy(vps.id, true);
    try {
      await api.updateVps(vps.id, { watcherEnabled: enabled });
      await load(false);
    } catch (toggleError) {
      setNotice({ tone: "error", text: messageForError(toggleError, "Unable to update Watcher target.") });
    } finally {
      setBusy(vps.id, false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.deleteVps(deleteTarget.id);
      setNotice({ tone: "success", text: `${deleteTarget.name} was deleted.` });
      setDeleteTarget(null);
      await load(false);
    } catch (deleteError) {
      setNotice({ tone: "error", text: messageForError(deleteError, `Unable to delete ${deleteTarget.name}.`) });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        actions={(
          <>
            <RefreshButton loading={loading} onClick={() => void load(true)} />
            <button className="btn btn-primary btn-sm" onClick={() => setFormTarget(NEW_VPS_TARGET)} type="button">
              <Plus aria-hidden="true" size={16} />VPS
            </button>
          </>
        )}
        eyebrow="Infrastructure"
        title="VPS Inventory"
      />

      <div className="grid gap-3">
        {notice ? <Notice onClose={() => setNotice(null)} tone={notice.tone}>{notice.text}</Notice> : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load(true)} /> : null}

        <section aria-label="VPS filters" className="control-filterbar grid gap-2 border-y py-3 sm:grid-cols-[minmax(14rem,1fr)_12rem_auto]">
          <label className="input input-bordered input-sm flex items-center gap-2">
            <Server aria-hidden="true" className="text-base-content/50" size={15} />
            <input className="min-w-0 grow" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search VPS" value={filters.search} />
          </label>
          <select aria-label="Watcher state" className="select select-bordered select-sm w-full" onChange={(event) => setFilters((current) => ({ ...current, watcher: event.target.value }))} value={filters.watcher}>
            <option value={FILTER_ALL}>All Watcher states</option>
            <option value={FILTER_WATCHER_ENABLED}>Watcher enabled</option>
            <option value={FILTER_WATCHER_DISABLED}>Watcher disabled</option>
          </select>
          <button className="btn btn-ghost btn-sm justify-self-end px-2" disabled={!filtersActive} onClick={() => setFilters(emptyFilters)} type="button">Clear</button>
        </section>

        {loading && !inventory ? <LoadingBlock label="Loading VPS inventory" /> : null}
        {inventory && filtered.length === 0 ? <EmptyState title="No VPS records match" detail="Adjust the filters or add a VPS." /> : null}

        {filtered.length > 0 ? (
          <>
            <div className="control-panel hidden overflow-x-auto border bg-base-100 md:block">
              <table className="control-table table table-sm min-w-[46rem]">
                <thead><tr><th>VPS</th><th>SSH endpoint</th><th>Watcher</th><th>Updated</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((vps) => (
                    <tr key={vps.id}>
                      <td className="max-w-64"><strong className="break-words">{vps.name}</strong></td>
                      <td className="max-w-64"><span className="break-all font-mono text-xs">{vps.username}@{vps.address}:{vps.port}</span></td>
                      <td><input aria-label={`${vps.watcherEnabled ? "Disable" : "Enable"} Watcher for ${vps.name}`} checked={vps.watcherEnabled} className="toggle toggle-success toggle-sm" disabled={busyIds.has(vps.id)} onChange={(event) => void toggleWatcher(vps, event.target.checked)} type="checkbox" /></td>
                      <td className="whitespace-nowrap text-xs">{formatDateTime(vps.updatedAt)}</td>
                      <td className="text-right"><ActionButtons busy={busyIds.has(vps.id)} name={vps.name} onDelete={() => setDeleteTarget(vps)} onEdit={() => setFormTarget(vps)} onVerify={() => void verify(vps)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filtered.map((vps) => (
                <article className="control-panel card border bg-base-100" key={vps.id}>
                  <div className="card-body gap-3 p-4">
                    <div className="min-w-0"><h2 className="break-words font-bold">{vps.name}</h2><p className="mt-1 break-all font-mono text-xs text-base-content/60">{vps.username}@{vps.address}:{vps.port}</p></div>
                    <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
                      <label className="flex items-center gap-2 text-xs font-bold"><input checked={vps.watcherEnabled} className="toggle toggle-success toggle-sm" disabled={busyIds.has(vps.id)} onChange={(event) => void toggleWatcher(vps, event.target.checked)} type="checkbox" />Watcher</label>
                      <ActionButtons busy={busyIds.has(vps.id)} name={vps.name} onDelete={() => setDeleteTarget(vps)} onEdit={() => setFormTarget(vps)} onVerify={() => void verify(vps)} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <FormModal onClose={() => setFormTarget(null)} open={formTarget !== null} title={formTarget === NEW_VPS_TARGET ? "Add VPS" : "Edit VPS"}>
        {formTarget !== null ? <VpsForm busy={formBusy} key={formTarget === NEW_VPS_TARGET ? NEW_VPS_TARGET : formTarget.id} onCancel={() => setFormTarget(null)} onSubmit={(input) => void saveForm(input)} vps={formTarget === NEW_VPS_TARGET ? null : formTarget} /> : null}
      </FormModal>

      <ConfirmDialog
        busy={deleteBusy}
        confirmation={deleteTarget?.name ?? ""}
        detail="This removes the SSH and Watcher configuration from D1. It does not delete any cloud resource."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "VPS"}`}
      />
    </div>
  );
}

function verifySummary(result: VerifyResult): string {
  if (result.success) return "SSH verification succeeded.";
  if (result.timedOut) return "SSH verification timed out.";
  if (!result.connected) return "SSH connection failed.";
  if (result.exitCode !== null) return `Verification command exited with code ${result.exitCode}.`;
  return "SSH verification failed.";
}
