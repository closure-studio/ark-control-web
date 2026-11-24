import { LoaderCircle, Pencil, Plus, Search, Terminal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiClient } from "@/api/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VpsFormModal } from "@/components/vps/VpsFormModal";
import { VPS_ROLE_DETAILS, VPS_ROLE_OPTIONS } from "@/constants/vps";
import { usePolling } from "@/hooks/usePolling";
import type {
  UpdateVpsInput,
  VerifyResult,
  VpsFormInput,
  VpsInventoryResponse,
  VpsResource
} from "@/types";
import { formatDateTime, messageForError } from "@/utils";

type NoticeState = { tone: "success" | "error" | "info"; text: string };
type Filters = { search: string; automation: string; role: string };

const EMPTY_COUNT = 0;
const FILTER_ALL = "all";
const FILTER_AUTOMATION_DISABLED = "disabled";
const FILTER_AUTOMATION_ENABLED = "enabled";
const NEW_VPS_TARGET = "new";
const VPS_POLL_INTERVAL_MS = 15_000;

const emptyFilters: Filters = { search: "", automation: FILTER_ALL, role: FILTER_ALL };

function matchesFilters(vps: VpsResource, filters: Filters): boolean {
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    ![vps.name, vps.address, vps.username, VPS_ROLE_DETAILS[vps.role].label].some((value) =>
      value.toLowerCase().includes(query)
    )
  ) {
    return false;
  }
  if (filters.role !== FILTER_ALL && vps.role !== filters.role) return false;
  if (filters.automation === FILTER_AUTOMATION_ENABLED && !vps.watcherEnabled) return false;
  if (filters.automation === FILTER_AUTOMATION_DISABLED && vps.watcherEnabled) return false;
  return true;
}

function toUpdateVpsInput(input: VpsFormInput): UpdateVpsInput {
  return {
    name: input.name,
    address: input.address,
    port: input.port,
    username: input.username,
    watcherEnabled: input.watcherEnabled,
    ...(input.password === undefined ? {} : { password: input.password })
  };
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
        <button
          aria-label={`Verify ${name}`}
          className="btn btn-square btn-sm join-item"
          disabled={busy}
          onClick={onVerify}
          type="button"
        >
          {busy ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
          ) : (
            <Terminal aria-hidden="true" size={15} />
          )}
        </button>
      </div>
      <div className="tooltip" data-tip="Edit VPS">
        <button
          aria-label={`Edit ${name}`}
          className="btn btn-square btn-sm join-item"
          disabled={busy}
          onClick={onEdit}
          type="button"
        >
          <Pencil aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="tooltip tooltip-left" data-tip="Delete VPS">
        <button
          aria-label={`Delete ${name}`}
          className="btn btn-error btn-soft btn-square btn-sm join-item"
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}

function VpsFilterToolbar({
  filters,
  filtersActive,
  filteredCount,
  hasInventory,
  onClear,
  onChange,
  totalCount
}: {
  filters: Filters;
  filtersActive: boolean;
  filteredCount: number;
  hasInventory: boolean;
  onClear: () => void;
  onChange: (next: Filters) => void;
  totalCount: number;
}) {
  return (
    <div
      aria-label="VPS filters"
      className="grid gap-2.5 border-b border-base-300 bg-base-200/35 px-4 py-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-[minmax(14rem,1fr)_10.5rem_12.5rem_auto]"
    >
      <label className="input input-sm flex w-full items-center gap-2">
        <Search aria-hidden="true" className="shrink-0 text-base-content/45" size={14} />
        <input
          className="min-w-0 grow"
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search VPS"
          value={filters.search}
        />
      </label>
      <select
        aria-label="VPS role"
        className="select select-sm w-full"
        onChange={(event) => onChange({ ...filters, role: event.target.value })}
        value={filters.role}
      >
        <option value={FILTER_ALL}>All roles</option>
        {VPS_ROLE_OPTIONS.map((role) => (
          <option key={role} value={role}>
            {VPS_ROLE_DETAILS[role].label}
          </option>
        ))}
      </select>
      <select
        aria-label="Automation state"
        className="select select-sm w-full"
        onChange={(event) => onChange({ ...filters, automation: event.target.value })}
        value={filters.automation}
      >
        <option value={FILTER_ALL}>All automation states</option>
        <option value={FILTER_AUTOMATION_ENABLED}>Automation enabled</option>
        <option value={FILTER_AUTOMATION_DISABLED}>Automation disabled</option>
      </select>
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        {hasInventory ? (
          <span className="text-xs font-semibold tabular-nums text-base-content/55">
            {filteredCount}/{totalCount}
          </span>
        ) : null}
        <button
          className="btn btn-ghost btn-sm px-2.5"
          disabled={!filtersActive}
          onClick={onClear}
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function VpsList({
  busyIds,
  items,
  onDelete,
  onEdit,
  onToggleAutomation,
  onVerify
}: {
  busyIds: Set<number>;
  items: VpsResource[];
  onDelete: (vps: VpsResource) => void;
  onEdit: (vps: VpsResource) => void;
  onToggleAutomation: (vps: VpsResource, enabled: boolean) => void;
  onVerify: (vps: VpsResource) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="table table-sm console-table min-w-[54rem]">
          <thead>
            <tr>
              <th>VPS</th>
              <th>SSH endpoint</th>
              <th>Role</th>
              <th>Automation</th>
              <th>Updated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {items.map((vps) => (
              <tr className="transition-colors hover:bg-info/6" key={vps.id}>
                <td className="max-w-64 align-middle">
                  <strong className="break-words">{vps.name}</strong>
                </td>
                <td className="max-w-64 align-middle">
                  <span className="break-all font-mono text-xs text-base-content/75">
                    {vps.username}@{vps.address}:{vps.port}
                  </span>
                </td>
                <td className="align-middle">
                  <StatusBadge value={VPS_ROLE_DETAILS[vps.role].label} />
                </td>
                <td className="align-middle">
                  <input
                    aria-label={`${vps.watcherEnabled ? "Disable" : "Enable"} automation for ${vps.name}`}
                    checked={vps.watcherEnabled}
                    className="toggle toggle-success toggle-sm"
                    disabled={busyIds.has(vps.id)}
                    onChange={(event) => onToggleAutomation(vps, event.target.checked)}
                    type="checkbox"
                  />
                </td>
                <td className="whitespace-nowrap align-middle text-xs text-base-content/60">
                  {formatDateTime(vps.updatedAt)}
                </td>
                <td className="text-right align-middle">
                  <ActionButtons
                    busy={busyIds.has(vps.id)}
                    name={vps.name}
                    onDelete={() => onDelete(vps)}
                    onEdit={() => onEdit(vps)}
                    onVerify={() => onVerify(vps)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-base-300 md:hidden">
        {items.map((vps) => (
          <article className="px-4 py-4" key={vps.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words font-extrabold">{vps.name}</h2>
                <StatusBadge value={VPS_ROLE_DETAILS[vps.role].label} />
              </div>
              <p className="mt-1 break-all font-mono text-xs text-base-content/60">
                {vps.username}@{vps.address}:{vps.port}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-base-300 pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  aria-label={`${vps.watcherEnabled ? "Disable" : "Enable"} automation for ${vps.name}`}
                  checked={vps.watcherEnabled}
                  className="toggle toggle-success toggle-sm"
                  disabled={busyIds.has(vps.id)}
                  onChange={(event) => onToggleAutomation(vps, event.target.checked)}
                  type="checkbox"
                />
                Automation
              </label>
              <ActionButtons
                busy={busyIds.has(vps.id)}
                name={vps.name}
                onDelete={() => onDelete(vps)}
                onEdit={() => onEdit(vps)}
                onVerify={() => onVerify(vps)}
              />
            </div>
          </article>
        ))}
      </div>
    </>
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

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        setInventory(await api.listVps());
        setError(null);
      } catch (loadError) {
        setError(messageForError(loadError, "Unable to load VPS inventory."));
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    void load(true);
  }, [load]);
  usePolling(() => void load(false), VPS_POLL_INTERVAL_MS);

  const totalHosts = inventory?.vps.length ?? EMPTY_COUNT;
  const filtered = useMemo(
    () => (inventory?.vps ?? []).filter((vps) => matchesFilters(vps, filters)),
    [inventory, filters]
  );
  const filtersActive =
    filters.search !== emptyFilters.search ||
    filters.automation !== emptyFilters.automation ||
    filters.role !== emptyFilters.role;

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
      setNotice({
        tone: result.success ? "success" : "error",
        text: `${vps.name}: ${verifySummary(result)}`
      });
    } catch (verifyError) {
      setNotice({
        tone: "error",
        text: messageForError(verifyError, `Unable to verify ${vps.name}.`)
      });
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
        await api.updateVps(formTarget.id, toUpdateVpsInput(input));
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

  async function toggleAutomation(vps: VpsResource, enabled: boolean) {
    setBusy(vps.id, true);
    try {
      await api.updateVps(vps.id, { watcherEnabled: enabled });
      await load(false);
    } catch (toggleError) {
      setNotice({
        tone: "error",
        text: messageForError(toggleError, "Unable to update automation state.")
      });
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
      setNotice({
        tone: "error",
        text: messageForError(deleteError, `Unable to delete ${deleteTarget.name}.`)
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  const editingVps = formTarget === null || formTarget === NEW_VPS_TARGET ? null : formTarget;
  const formKey = formTarget === NEW_VPS_TARGET ? NEW_VPS_TARGET : (editingVps?.id ?? NEW_VPS_TARGET);

  return (
    <div className="min-w-0">
      <PageHeader
        actions={(
          <>
            <RefreshButton loading={loading} onClick={() => void load(true)} />
            <button
              className="btn btn-primary btn-sm gap-1.5"
              onClick={() => setFormTarget(NEW_VPS_TARGET)}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              VPS
            </button>
          </>
        )}
        description="Managed SSH hosts, role assignments, and automation watcher state."
        title="VPS Inventory"
      />

      <div className="grid gap-5">
        {notice ? (
          <Notice onClose={() => setNotice(null)} tone={notice.tone}>
            {notice.text}
          </Notice>
        ) : null}
        {error ? <ErrorAlert message={error} onRetry={() => void load(true)} /> : null}

        <Panel aria-label="VPS inventory list">
          <VpsFilterToolbar
            filteredCount={filtered.length}
            filters={filters}
            filtersActive={filtersActive}
            hasInventory={inventory !== null}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
            totalCount={totalHosts}
          />

          {loading && !inventory ? <LoadingBlock label="Loading VPS inventory" /> : null}
          {inventory && filtered.length === EMPTY_COUNT ? (
            <EmptyState detail="Adjust the filters or add a VPS." title="No VPS records match" />
          ) : null}

          {filtered.length > EMPTY_COUNT ? (
            <VpsList
              busyIds={busyIds}
              items={filtered}
              onDelete={setDeleteTarget}
              onEdit={setFormTarget}
              onToggleAutomation={(vps, enabled) => void toggleAutomation(vps, enabled)}
              onVerify={(vps) => void verify(vps)}
            />
          ) : null}
        </Panel>
      </div>

      <VpsFormModal
        busy={formBusy}
        formKey={formKey}
        onClose={() => setFormTarget(null)}
        onSubmit={(input) => void saveForm(input)}
        open={formTarget !== null}
        vps={editingVps}
      />

      <ConfirmDialog
        busy={deleteBusy}
        confirmation={deleteTarget?.name ?? ""}
        detail="This removes the SSH automation configuration from D1. It does not delete any cloud resource."
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
