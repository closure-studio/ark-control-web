import {
  Check,
  ChevronRight,
  Clock3,
  Cloud,
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
        <span className="text-xs font-semibold text-base-content/60">{label}</span>
        <button
          aria-label={copyLabel}
          className={cx(
            "btn btn-xs h-6 min-h-6 gap-1 px-2 text-[0.7rem]",
            copied ? "btn-success btn-soft" : "btn-ghost border border-base-300 bg-base-100"
          )}
          onClick={onCopy}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={11} /> : <Copy aria-hidden="true" size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <code className="block break-normal text-xs leading-5 text-base-content/85 [overflow-wrap:anywhere]">
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

  return (
    <article
      className={cx(
        "card card-border flex flex-col justify-between overflow-hidden border-base-content/18 bg-base-100 shadow-xs transition-colors hover:border-base-content/30",
        !account.enabled && "bg-base-200/35",
        busy && "border-info/55"
      )}
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-field border border-base-content/25 bg-base-100 text-info shadow-2xs">
              <Cloud aria-hidden="true" size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-lg font-extrabold leading-snug text-base-content">
                {account.name}
              </h2>
              {hasDistinctProjectId ? (
                <code className="mt-0.5 block truncate text-xs text-base-content/55">
                  {account.projectId}
                </code>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin text-info" size={16} />
            ) : null}
            <StatusBadge value={account.enabled ? "Enabled" : "Disabled"} />
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-base-content/60">
          <span className="inline-flex items-center gap-1.5 font-medium text-base-content/80">
            <MapPin aria-hidden="true" className="shrink-0 text-base-content/45" size={13} />
            <span>{account.defaultZone}</span>
          </span>
          <span aria-hidden="true" className="hidden text-base-content/30 sm:inline">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 text-base-content/55">
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
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-xs font-semibold text-base-content/65 select-none transition-colors hover:text-base-content sm:px-6 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            aria-hidden="true"
            className="shrink-0 transition-transform duration-150 group-open:rotate-90"
            size={14}
          />
          <span>Connection details</span>
        </summary>

        <div className="grid gap-3.5 border-t border-base-300/70 bg-base-200/40 px-5 py-4 sm:px-6">
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

      <footer className="flex items-center justify-between gap-3 border-t border-base-300 bg-base-200/45 px-5 py-3.5 sm:px-6">
        <label className="inline-flex cursor-pointer items-center gap-2.5">
          <input
            checked={account.enabled}
            className="toggle toggle-success toggle-sm"
            disabled={busy}
            onChange={(event) => onToggle(event.target.checked)}
            type="checkbox"
          />
          <span className="text-xs font-bold text-base-content/80">
            {account.enabled ? "Enabled" : "Disabled"}
          </span>
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
