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
        <span className="text-[0.65rem] font-extrabold uppercase tracking-wide text-base-content/50">
          {label}
        </span>
        <button
          aria-label={copyLabel}
          className={cx(
            "accounts-copy-btn inline-flex items-center gap-1 rounded-md border px-2 py-0.5 transition-colors",
            copied
              ? "border-success/40 bg-success/12 text-success"
              : "border-base-300 bg-base-100 text-base-content/60 hover:border-info/50 hover:text-info"
          )}
          onClick={onCopy}
          type="button"
        >
          {copied ? (
            <Check aria-hidden="true" size={11} />
          ) : (
            <Copy aria-hidden="true" size={11} />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <p className="accounts-code-value font-mono text-[0.72rem] leading-5 text-base-content/80">
        {value}
      </p>
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
    account.projectId.trim() !== "" &&
    account.projectId.trim() !== account.name.trim();

  return (
    <article
      className={cx(
        "accounts-card relative flex flex-col justify-between overflow-hidden rounded-xl border bg-base-100 transition-all",
        account.enabled ? "accounts-card-enabled" : "accounts-card-disabled",
        busy && "accounts-card-busy"
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute inset-x-0 top-0 h-[3px]",
          account.enabled ? "accounts-card-bar-active" : "bg-base-content/15"
        )}
      />

      <div className="flex flex-1 flex-col gap-5 p-5 pt-6 sm:p-6 sm:pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={cx(
                "accounts-card-icon relative grid size-11 shrink-0 place-items-center rounded-xl border",
                account.enabled
                  ? "accounts-card-icon-active text-info"
                  : "accounts-card-icon-muted text-base-content/45"
              )}
            >
              <Cloud aria-hidden="true" size={20} />
              <span
                aria-hidden="true"
                className={cx(
                  "absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-base-100",
                  account.enabled ? "bg-success" : "bg-base-content/30"
                )}
              />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-base font-black leading-snug text-base-content sm:text-[1.0625rem]">
                {account.name}
              </h2>
              {hasDistinctProjectId ? (
                <p className="mt-0.5 truncate font-mono text-xs text-base-content/55">
                  {account.projectId}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {busy ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin text-info"
                size={16}
              />
            ) : null}
            <StatusBadge value={account.enabled ? "Enabled" : "Disabled"} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-base-content/60">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/75 px-2.5 py-1 font-mono text-[0.72rem] font-semibold text-base-content/80">
            <MapPin aria-hidden="true" className="shrink-0 text-success" size={12} />
            <span>{account.defaultZone}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-base-content/50">
            <Clock3 aria-hidden="true" size={12} />
            <span>Updated {formatDateTime(account.updatedAt)}</span>
          </span>
        </div>

        <div
          className={cx(
            "w-full",
            !account.enabled && "tooltip tooltip-bottom"
          )}
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

        <details className="accounts-details group rounded-xl border border-base-300/80 bg-base-200/45">
          <summary className="accounts-details-summary flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold text-base-content/65 select-none hover:text-base-content">
            <span className="inline-flex items-center gap-1.5">
              <ChevronRight
                aria-hidden="true"
                className="accounts-details-chevron shrink-0 transition-transform"
                size={14}
              />
              <span>Connection details</span>
            </span>
            <span className="rounded border border-base-300 bg-base-100 px-1.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase text-base-content/50">
              WIF
            </span>
          </summary>

          <div className="grid gap-3.5 border-t border-base-300/80 px-3.5 py-3.5">
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
      </div>

      <footer className="accounts-card-footer flex items-center justify-between gap-3 border-t border-base-300/80 px-5 py-3.5 sm:px-6">
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
            className="btn btn-error btn-sm btn-square"
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
