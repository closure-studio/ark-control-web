import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  LoaderCircle,
  MapPin,
  Pencil,
  ServerCog,
  Trash2
} from "lucide-react";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { GcpAccount } from "@/types";
import { cx, formatDateTime } from "@/utils";

const COPY_KEY_PROJECT = "project";
const COPY_KEY_SERVICE_ACCOUNT = "serviceAccount";
const COPY_KEY_WIF_PROVIDER = "wifProvider";

function DetailRow({
  copied,
  copyLabel,
  label,
  onCopy,
  value
}: {
  copied: boolean;
  copyLabel: string;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <button
          aria-label={copyLabel}
          className={cx(
            "btn btn-xs gap-1 px-2 text-xs",
            copied ? "btn-success btn-soft" : "btn-ghost border border-base-300 bg-base-100"
          )}
          onClick={onCopy}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={11} /> : <Copy aria-hidden="true" size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <code className="block text-xs leading-5 wrap-anywhere">
        {value}
      </code>
    </div>
  );
}

export function AccountCard({
  account,
  busy,
  onDelete,
  onEdit,
  onProvision,
  onToggle
}: {
  account: GcpAccount;
  busy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onProvision: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const { copiedKey, copyText } = useCopyFeedback();
  const hasDistinctProjectId =
    account.projectId.trim() !== "" && account.projectId.trim() !== account.name.trim();
  const stateLabel = account.enabled ? "Enabled" : "Disabled";

  return (
    <article className={cx("surface flex min-w-0 flex-col overflow-hidden", busy && "border-info")}>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold leading-snug wrap-anywhere">
              {account.name}
            </h2>
            {hasDistinctProjectId ? (
              <code className="mt-1 block font-mono text-xs wrap-anywhere text-muted">
                {account.projectId}
              </code>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin text-info" size={16} />
            ) : null}
            <StatusBadge value={stateLabel} />
          </div>
        </header>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" className="shrink-0" size={13} />
            <code className="font-mono wrap-anywhere">{account.defaultZone}</code>
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={12} />
            <span>Updated {formatDateTime(account.updatedAt)}</span>
          </span>
        </div>

        <div
          className={cx("mt-5 w-full", !account.enabled && "tooltip tooltip-bottom")}
          data-tip={account.enabled ? undefined : "Enable account to provision a VPS"}
        >
          <button
            aria-label={`Create VPS in ${account.name}`}
            className="btn btn-primary w-full gap-2"
            disabled={busy || !account.enabled}
            onClick={onProvision}
            type="button"
          >
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
            ) : (
              <ServerCog aria-hidden="true" size={15} />
            )}
            <span>Create VPS</span>
          </button>
        </div>
      </div>

      <details className="group border-t border-base-300">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 text-xs font-semibold text-muted hover:text-base-content focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary sm:px-6 [&::-webkit-details-marker]:hidden">
          Connection details
          <ChevronDown
            aria-hidden="true"
            className="shrink-0 group-open:rotate-180 motion-safe:transition-transform"
            size={14}
          />
        </summary>

        <div className="grid gap-3.5 bg-base-200/40 px-5 py-4 sm:px-6">
          <DetailRow
            copied={copiedKey === COPY_KEY_PROJECT}
            copyLabel={`Copy project ID for ${account.name}`}
            label="Project ID"
            onCopy={() => void copyText(COPY_KEY_PROJECT, account.projectId)}
            value={account.projectId}
          />
          <DetailRow
            copied={copiedKey === COPY_KEY_SERVICE_ACCOUNT}
            copyLabel={`Copy service account for ${account.name}`}
            label="Service account"
            onCopy={() => void copyText(COPY_KEY_SERVICE_ACCOUNT, account.serviceAccountEmail)}
            value={account.serviceAccountEmail}
          />
          <DetailRow
            copied={copiedKey === COPY_KEY_WIF_PROVIDER}
            copyLabel={`Copy workload identity provider for ${account.name}`}
            label="Workload identity provider"
            onCopy={() => void copyText(COPY_KEY_WIF_PROVIDER, account.workloadIdentityProvider)}
            value={account.workloadIdentityProvider}
          />
        </div>
      </details>

      <footer className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/50 px-5 py-3.5 sm:px-6">
        <label className="inline-flex cursor-pointer items-center gap-2.5">
          <input
            checked={account.enabled}
            className="toggle toggle-success toggle-sm"
            disabled={busy}
            onChange={(event) => onToggle(event.target.checked)}
            type="checkbox"
          />
          <span className="text-xs font-bold text-muted">{stateLabel}</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            aria-label={`Edit ${account.name}`}
            className="btn btn-sm gap-1.5 bg-base-100 px-3"
            disabled={busy}
            onClick={onEdit}
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
            <span>Edit</span>
          </button>
          <button
            aria-label={`Delete ${account.name}`}
            className="btn btn-error btn-soft btn-sm btn-square"
            disabled={busy}
            onClick={onDelete}
            title={`Delete ${account.name}`}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
          </button>
        </div>
      </footer>
    </article>
  );
}
