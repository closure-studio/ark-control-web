import {
  Cloud,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Server,
  Square,
  Terminal,
  Trash2
} from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePolling } from "@/hooks/usePolling";
import type {
  VerifyResult,
  VpsAction,
  VpsActionResult,
  VpsFormInput,
  VpsInventoryResponse,
  VpsResource
} from "@/types";
import { formatDateTime, messageForError } from "@/utils";

type NoticeState = { tone: "success" | "error" | "info"; text: string };
type Filters = { search: string; source: string; status: string; watcher: string };

const CLOUD_STATUS_RUNNING = "RUNNING";
const CLOUD_STATUS_UNAVAILABLE = "unavailable";
const DEFAULT_SSH_PORT = 22;
const DEFAULT_SSH_USERNAME = "root";
const FILTER_ALL = "all";
const FILTER_WATCHER_DISABLED = "disabled";
const FILTER_WATCHER_ENABLED = "enabled";
const MAX_SESSION_RESULTS = 20;
const MAX_SSH_PORT = 65_535;
const MIN_SSH_PORT = 1;
const NEW_VPS_TARGET = "new";
const OPERATION_STATUS_FAILED = "failed";
const VPS_POLL_INTERVAL_MS = 15_000;
const VPS_SOURCE_GCP = "gcp";
const VPS_SOURCE_MANUAL = "manual";

const emptyFilters: Filters = {
  search: "",
  source: FILTER_ALL,
  status: FILTER_ALL,
  watcher: FILTER_ALL
};

function selectOne(current: Set<number>, id: number): Set<number> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function selectMany(current: Set<number>, vpsList: VpsResource[], selected: boolean): Set<number> {
  const next = new Set(current);
  for (const vps of vpsList) {
    if (selected) {
      next.add(vps.id);
    } else {
      next.delete(vps.id);
    }
  }
  return next;
}

function matchesFilters(vps: VpsResource, filters: Filters): boolean {
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    ![vps.name, vps.address, vps.username, vps.cloud?.accountName, vps.cloud?.projectId]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  ) return false;
  if (filters.source !== FILTER_ALL && vps.source !== filters.source) return false;
  if (filters.status !== FILTER_ALL && (vps.cloud?.status ?? CLOUD_STATUS_UNAVAILABLE).toLowerCase() !== filters.status) return false;
  if (filters.watcher === FILTER_WATCHER_ENABLED && !vps.watcherEnabled) return false;
  if (filters.watcher === FILTER_WATCHER_DISABLED && vps.watcherEnabled) return false;
  return true;
}

function ActionButtons({
  vps,
  busy,
  onAction,
  onVerify,
  onEdit,
  onDelete
}: {
  vps: VpsResource;
  busy: boolean;
  onAction: (action: "start" | "stop") => void;
  onVerify: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const running = vps.cloud?.status === CLOUD_STATUS_RUNNING;
  return (
    <div className="join" aria-label={`Actions for ${vps.name}`}>
      <div className="tooltip" data-tip="Verify SSH">
        <button aria-label={`Verify ${vps.name}`} className="btn btn-square btn-sm join-item" disabled={busy} onClick={onVerify} type="button">
          {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Terminal aria-hidden="true" size={15} />}
        </button>
      </div>
      {vps.cloud ? (
        <div className="tooltip" data-tip={running ? "Stop VPS" : "Start VPS"}>
          <button
            aria-label={`${running ? "Stop" : "Start"} ${vps.name}`}
            className="btn btn-square btn-sm join-item"
            disabled={busy || vps.cloud.status === null}
            onClick={() => onAction(running ? "stop" : "start")}
            type="button"
          >
            {running ? <Square aria-hidden="true" size={14} /> : <Play aria-hidden="true" size={15} />}
          </button>
        </div>
      ) : null}
      <div className="tooltip" data-tip="Edit VPS">
        <button aria-label={`Edit ${vps.name}`} className="btn btn-square btn-sm join-item" disabled={busy} onClick={onEdit} type="button">
          <Pencil aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="tooltip tooltip-left" data-tip="Delete VPS">
        <button aria-label={`Delete ${vps.name}`} className="btn btn-square btn-error btn-sm join-item" disabled={busy} onClick={onDelete} type="button">
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
  onSubmit: (input: VpsFormInput & { password?: string }) => void;
}) {
  const [form, setForm] = useState({
    name: vps?.name ?? "",
    address: vps?.address ?? "",
    port: vps?.port ?? DEFAULT_SSH_PORT,
    username: vps?.username ?? DEFAULT_SSH_USERNAME,
    password: "",
    verifyCommand: vps?.verifyCommand ?? "",
    watcherEnabled: vps?.watcherEnabled ?? true
  });
  const field = (key: keyof typeof form, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: form.name,
      address: form.address,
      port: form.port,
      username: form.username,
      ...(form.password ? { password: form.password } : {}),
      verifyCommand: form.verifyCommand.trim() || null,
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
          <input className="input input-bordered w-full font-mono" disabled={Boolean(vps?.cloud)} onChange={(event) => field("address", event.target.value)} required value={form.address} />
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
        <label className="form-control grid gap-1.5 sm:col-span-2">
          <span className="label-text font-bold">Verify command</span>
          <input className="input input-bordered w-full font-mono" onChange={(event) => field("verifyCommand", event.target.value)} value={form.verifyCommand} />
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
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [formTarget, setFormTarget] = useState<VpsResource | typeof NEW_VPS_TARGET | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VpsResource | null>(null);
  const [batchDelete, setBatchDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [sessionResults, setSessionResults] = useState<VpsActionResult[]>([]);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.listVps();
      setInventory(response);
      setSelected((current) => new Set(response.vps.map((item) => item.id).filter((id) => current.has(id))));
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
  const selectedVps = useMemo(
    () => (inventory?.vps ?? []).filter((vps) => selected.has(vps.id)),
    [inventory, selected]
  );
  const selectedAllCloud = selectedVps.length > 0 && selectedVps.every((vps) => vps.cloud);
  const allFilteredSelected = filtered.length > 0 && filtered.every((vps) => selected.has(vps.id));

  function setBusy(id: number, value: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function runAction(vps: VpsResource, action: "start" | "stop") {
    setBusy(vps.id, true);
    setNotice(null);
    try {
      const { result } = await api.runVpsAction(vps.id, action);
      setSessionResults((current) => [result, ...current].slice(0, MAX_SESSION_RESULTS));
      setNotice({ tone: "success", text: `${vps.name} ${action} completed.` });
      await load(false);
    } catch (actionError) {
      setNotice({ tone: "error", text: messageForError(actionError, `Unable to ${action} ${vps.name}.`) });
    } finally {
      setBusy(vps.id, false);
    }
  }

  async function verify(vps: VpsResource) {
    setBusy(vps.id, true);
    setNotice(null);
    try {
      const { result } = await api.verifyVps(vps.id);
      const summary = verifySummary(result);
      setNotice({ tone: result.success ? "success" : "error", text: `${vps.name}: ${summary}` });
    } catch (verifyError) {
      setNotice({ tone: "error", text: messageForError(verifyError, `Unable to verify ${vps.name}.`) });
    } finally {
      setBusy(vps.id, false);
    }
  }

  async function saveForm(input: VpsFormInput & { password?: string }) {
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

  async function confirmSingleDelete() {
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

  async function runBatch(action: VpsAction) {
    if (selectedVps.length === 0) return;
    setNotice(null);
    selectedVps.forEach((vps) => setBusy(vps.id, true));
    try {
      const { results } = await api.runBatchVpsAction(selectedVps.map((vps) => vps.id), action);
      setSessionResults((current) => [...results, ...current].slice(0, MAX_SESSION_RESULTS));
      const failed = results.filter((result) => result.status === OPERATION_STATUS_FAILED).length;
      setNotice({
        tone: failed ? "error" : "success",
        text: failed ? `${results.length - failed} completed, ${failed} failed.` : `${results.length} VPS actions completed.`
      });
      setSelected(new Set());
      setBatchDelete(false);
      await load(false);
    } catch (batchError) {
      setNotice({ tone: "error", text: messageForError(batchError, "Unable to run batch action.") });
    } finally {
      selectedVps.forEach((vps) => setBusy(vps.id, false));
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        actions={(
          <>
            <RefreshButton loading={loading} onClick={() => void load(true)} />
            <button className="btn btn-primary btn-sm" onClick={() => setFormTarget(NEW_VPS_TARGET)} type="button">
              <Plus aria-hidden="true" size={16} />Manual VPS
            </button>
          </>
        )}
        eyebrow="Infrastructure"
        title="VPS Inventory"
      />

      <div className="grid gap-3">
        {notice ? <Notice onClose={() => setNotice(null)} tone={notice.tone}>{notice.text}</Notice> : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load(true)} /> : null}
        {inventory && inventory.errors.length > 0 ? (
          <Notice tone="info">{inventory.errors.length} cloud account request{inventory.errors.length === 1 ? "" : "s"} could not be completed. Linked hosts remain available for SSH operations.</Notice>
        ) : null}

        <section aria-label="VPS filters" className="control-filterbar grid gap-2 border-y py-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_12rem_auto]">
          <label className="input input-sm input-bordered flex items-center gap-2">
            <Server aria-hidden="true" className="text-base-content/50" size={15} />
            <input className="min-w-0 grow" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search VPS" value={filters.search} />
          </label>
          <select aria-label="Source" className="select select-bordered select-sm w-full" onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))} value={filters.source}>
            <option value={FILTER_ALL}>All sources</option><option value={VPS_SOURCE_GCP}>GCP</option><option value={VPS_SOURCE_MANUAL}>Manual</option>
          </select>
          <select aria-label="Cloud status" className="select select-bordered select-sm w-full" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}>
            <option value={FILTER_ALL}>All cloud states</option><option value="running">Running</option><option value="terminated">Stopped</option><option value={CLOUD_STATUS_UNAVAILABLE}>Unavailable</option>
          </select>
          <select aria-label="Watcher state" className="select select-bordered select-sm w-full" onChange={(event) => setFilters((current) => ({ ...current, watcher: event.target.value }))} value={filters.watcher}>
            <option value={FILTER_ALL}>All Watcher states</option><option value={FILTER_WATCHER_ENABLED}>Watcher enabled</option><option value={FILTER_WATCHER_DISABLED}>Watcher disabled</option>
          </select>
          <button className="btn btn-ghost btn-sm justify-self-end px-2" disabled={JSON.stringify(filters) === JSON.stringify(emptyFilters)} onClick={() => setFilters(emptyFilters)} type="button">Clear</button>
        </section>

        {selectedVps.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-md border border-primary/25 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <strong className="text-sm">{selectedVps.length} selected</strong>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm" disabled={!selectedAllCloud} onClick={() => void runBatch("start")} type="button"><Play size={15} />Start</button>
              <button className="btn btn-sm" disabled={!selectedAllCloud} onClick={() => void runBatch("stop")} type="button"><Square size={14} />Stop</button>
              <button className="btn btn-error btn-sm" onClick={() => setBatchDelete(true)} type="button"><Trash2 size={15} />Delete</button>
            </div>
          </div>
        ) : null}

        {loading && !inventory ? <LoadingBlock label="Loading VPS inventory" /> : null}
        {inventory && filtered.length === 0 ? <EmptyState title="No VPS records match" detail="Adjust the filters or add a manual VPS." /> : null}

        {filtered.length > 0 ? (
          <>
            <div className="control-panel hidden overflow-x-auto border bg-base-100 md:block">
              <table className="control-table table table-sm min-w-[64rem]">
                <thead>
                  <tr>
                    <th className="w-10"><input aria-label="Select all visible VPS" checked={allFilteredSelected} className="checkbox checkbox-sm" onChange={(event) => setSelected((current) => selectMany(current, filtered, event.target.checked))} type="checkbox" /></th>
                    <th>VPS</th><th>SSH</th><th>Cloud</th><th>Status</th><th>Watcher</th><th className="hidden 2xl:table-cell">Updated</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vps) => (
                    <tr key={vps.id}>
                      <td><input aria-label={`Select ${vps.name}`} checked={selected.has(vps.id)} className="checkbox checkbox-sm" onChange={() => setSelected((current) => selectOne(current, vps.id))} type="checkbox" /></td>
                      <td className="max-w-56"><strong className="break-words">{vps.name}</strong><span className="mt-1 flex items-center gap-1 text-xs text-base-content/55">{vps.source === VPS_SOURCE_GCP ? <Cloud size={13} /> : <Server size={13} />}{vps.source === VPS_SOURCE_GCP ? "GCP" : "Manual"}</span></td>
                      <td className="max-w-52"><span className="break-all font-mono text-xs">{vps.username}@{vps.address}:{vps.port}</span></td>
                      <td>{vps.cloud ? <div><strong className="text-xs">{vps.cloud.accountName}</strong><span className="block text-xs text-base-content/55">{vps.cloud.zone}</span></div> : <span className="text-base-content/45">None</span>}</td>
                      <td><StatusBadge value={vps.cloud?.status ?? (vps.source === VPS_SOURCE_MANUAL ? "Manual" : null)} />{vps.cloud?.error ? <span className="mt-1 block max-w-44 whitespace-normal text-xs text-error">{vps.cloud.error}</span> : null}</td>
                      <td><input aria-label={`${vps.watcherEnabled ? "Disable" : "Enable"} Watcher for ${vps.name}`} checked={vps.watcherEnabled} className="toggle toggle-success toggle-sm" disabled={busyIds.has(vps.id)} onChange={(event) => void toggleWatcher(vps, event.target.checked)} type="checkbox" /></td>
                      <td className="hidden 2xl:table-cell">{formatDateTime(vps.updatedAt)}</td>
                      <td className="text-right"><ActionButtons busy={busyIds.has(vps.id)} onAction={(action) => void runAction(vps, action)} onDelete={() => setDeleteTarget(vps)} onEdit={() => setFormTarget(vps)} onVerify={() => void verify(vps)} vps={vps} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filtered.map((vps) => (
                <article className="control-panel card border bg-base-100" key={vps.id}>
                  <div className="card-body gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <input aria-label={`Select ${vps.name}`} checked={selected.has(vps.id)} className="checkbox checkbox-sm mt-1" onChange={() => setSelected((current) => selectOne(current, vps.id))} type="checkbox" />
                      <div className="min-w-0 grow"><h2 className="break-words font-bold">{vps.name}</h2><p className="mt-1 break-all font-mono text-xs text-base-content/60">{vps.username}@{vps.address}:{vps.port}</p></div>
                      <StatusBadge value={vps.cloud?.status ?? "Manual"} />
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-xs">
                      <div><dt className="text-base-content/50">Source</dt><dd className="mt-1 font-bold uppercase">{vps.source}</dd></div>
                      <div><dt className="text-base-content/50">Account</dt><dd className="mt-1 break-words font-bold">{vps.cloud?.accountName ?? "None"}</dd></div>
                    </dl>
                    <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
                      <label className="flex items-center gap-2 text-xs font-bold"><input checked={vps.watcherEnabled} className="toggle toggle-success toggle-sm" disabled={busyIds.has(vps.id)} onChange={(event) => void toggleWatcher(vps, event.target.checked)} type="checkbox" />Watcher</label>
                      <ActionButtons busy={busyIds.has(vps.id)} onAction={(action) => void runAction(vps, action)} onDelete={() => setDeleteTarget(vps)} onEdit={() => setFormTarget(vps)} onVerify={() => void verify(vps)} vps={vps} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {sessionResults.length > 0 ? (
          <section className="mt-3 min-w-0" aria-labelledby="session-actions-title">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-black" id="session-actions-title">Session actions</h3><button className="btn btn-ghost btn-xs" onClick={() => setSessionResults([])} type="button">Clear</button></div>
            <div className="control-panel overflow-x-auto border bg-base-100">
              <table className="control-table table table-xs min-w-[38rem]"><thead><tr><th>VPS</th><th>Action</th><th>Status</th><th>Message</th></tr></thead><tbody>{sessionResults.map((result, index) => <tr key={`${result.hostId}-${result.action}-${index}`}><td>{result.hostName}</td><td className="capitalize">{result.action}</td><td><StatusBadge value={result.status} /></td><td className="max-w-80 whitespace-normal">{result.message ?? "Completed"}</td></tr>)}</tbody></table>
            </div>
          </section>
        ) : null}
      </div>

      <FormModal open={formTarget !== null} onClose={() => setFormTarget(null)} title={formTarget === NEW_VPS_TARGET ? "Add manual VPS" : "Edit VPS"}>
        {formTarget !== null ? <VpsForm busy={formBusy} key={formTarget === NEW_VPS_TARGET ? NEW_VPS_TARGET : formTarget.id} onCancel={() => setFormTarget(null)} onSubmit={(input) => void saveForm(input)} vps={formTarget === NEW_VPS_TARGET ? null : formTarget} /> : null}
      </FormModal>

      <ConfirmDialog
        busy={deleteBusy}
        confirmation={deleteTarget?.name ?? ""}
        detail={deleteTarget?.cloud ? "The GCP instance will be deleted first. Its D1 host record is removed only after Google confirms deletion." : "This removes the SSH and Watcher configuration from D1."}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmSingleDelete()}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "VPS"}`}
      />
      <ConfirmDialog
        busy={selectedVps.some((vps) => busyIds.has(vps.id))}
        confirmation={`DELETE ${selectedVps.length}`}
        detail={<><p>The following records will be deleted:</p><ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto font-mono text-xs">{selectedVps.map((vps) => <li key={vps.id}>{vps.name}</li>)}</ul></>}
        onCancel={() => setBatchDelete(false)}
        onConfirm={() => void runBatch("delete")}
        open={batchDelete}
        title={`Delete ${selectedVps.length} VPS records`}
      />
    </div>
  );
}

function verifySummary(result: VerifyResult): string {
  if (result.success) return "SSH verification succeeded.";
  if (result.timedOut) return "SSH verification timed out.";
  if (!result.connected) return "SSH connection failed.";
  if (result.exitCode !== null) return `Verify command exited with code ${result.exitCode}.`;
  return "SSH verification failed.";
}
