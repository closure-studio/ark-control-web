import {
  Check,
  Clock3,
  Cloud,
  Copy,
  FolderKanban,
  KeyRound,
  LoaderCircle,
  MapPin,
  Pencil,
  ServerCog,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { parseWifProvider } from "@/components/accounts/accountHelpers";
import { useCopyFeedback } from "@/components/accounts/useCopyFeedback";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { GcpAccount } from "@/types";
import { cx, formatDateTime } from "@/utils";

const COPY_KEY_PROJECT = "project";
const COPY_KEY_SERVICE_ACCOUNT = "serviceAccount";
const COPY_KEY_WIF_PROVIDER = "wifProvider";

function CopyChipButton({
  copied,
  label,
  onClick
}: {
  copied: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cx(
        "accounts-copy-btn inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.7rem] font-bold transition-colors",
        copied
          ? "border-success/40 bg-success/12 text-success"
          : "border-base-300 bg-base-100 text-base-content/65 hover:border-info/50 hover:text-info"
      )}
      onClick={onClick}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" size={12} />
      ) : (
        <Copy aria-hidden="true" size={12} />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
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
  const parsedWif = parseWifProvider(account.workloadIdentityProvider);

  return (
    <article
      className={cx(
        "accounts-card relative overflow-hidden rounded-xl border bg-base-100 transition-all",
        account.enabled ? "accounts-card-enabled" : "accounts-card-disabled",
        busy && "accounts-card-busy"
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "accounts-card-accent absolute inset-y-0 left-0 w-1",
          account.enabled ? "bg-success" : "bg-base-content/20"
        )}
      />

      <div className="flex flex-col gap-5 p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-black leading-snug text-base-content">
                  {account.name}
                </h2>
                <StatusBadge value={account.enabled ? "Enabled" : "Disabled"} />
                {busy ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-info">
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
                    Working
                  </span>
                ) : null}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  aria-label={`Copy project ID for ${account.name}`}
                  className="accounts-meta-chip group inline-flex max-w-full items-center gap-1.5 rounded-md border border-base-300 bg-base-200/80 px-2.5 py-1 font-mono text-xs font-semibold text-base-content/80 transition-colors hover:border-info/50 hover:text-base-content"
                  onClick={() => void copyText(COPY_KEY_PROJECT, account.projectId)}
                  title="Click to copy project ID"
                  type="button"
                >
                  <FolderKanban aria-hidden="true" className="shrink-0 text-info" size={13} />
                  <span className="truncate">{account.projectId}</span>
                  {copiedKey === COPY_KEY_PROJECT ? (
                    <Check aria-hidden="true" className="shrink-0 text-success" size={12} />
                  ) : (
                    <Copy
                      aria-hidden="true"
                      className="shrink-0 text-base-content/40 transition-colors group-hover:text-info"
                      size={12}
                    />
                  )}
                </button>

                <span className="inline-flex items-center gap-1.5 rounded-md border border-base-300 bg-base-200/80 px-2.5 py-1 font-mono text-xs font-semibold text-base-content/80">
                  <MapPin aria-hidden="true" className="shrink-0 text-success" size={13} />
                  <span>{account.defaultZone}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center sm:w-auto lg:pt-0.5">
            <div
              className={cx(
                "w-full sm:w-auto",
                !account.enabled && "tooltip tooltip-bottom sm:tooltip-left"
              )}
              data-tip={account.enabled ? undefined : "Enable account to provision a VPS"}
            >
              <button
                aria-label={`Create VPS in ${account.name}`}
                className="btn btn-primary btn-sm w-full gap-2 px-4 sm:w-auto"
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
        </div>

        <div className="accounts-credential-surface grid overflow-hidden rounded-lg border border-base-300/90 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.32fr)]">
          <div className="flex min-w-0 flex-col gap-2 p-4 lg:border-r lg:border-base-300/90">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-wide text-base-content/55">
                <KeyRound aria-hidden="true" size={13} />
                Service account
              </span>
              <CopyChipButton
                copied={copiedKey === COPY_KEY_SERVICE_ACCOUNT}
                label={`Copy service account for ${account.name}`}
                onClick={() => void copyText(COPY_KEY_SERVICE_ACCOUNT, account.serviceAccountEmail)}
              />
            </div>
            <p className="accounts-code-value font-mono text-xs font-semibold leading-5 text-base-content">
              {account.serviceAccountEmail}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 border-t border-base-300/90 p-4 lg:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-wide text-base-content/55">
                <ShieldCheck aria-hidden="true" size={13} />
                Workload identity provider
              </span>
              <CopyChipButton
                copied={copiedKey === COPY_KEY_WIF_PROVIDER}
                label={`Copy workload identity provider for ${account.name}`}
                onClick={() => void copyText(COPY_KEY_WIF_PROVIDER, account.workloadIdentityProvider)}
              />
            </div>
            {parsedWif ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="accounts-wif-pill rounded border border-info/25 bg-info/10 px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-info">
                  pool:{parsedWif.pool}
                </span>
                <span className="accounts-wif-pill rounded border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-success">
                  provider:{parsedWif.provider}
                </span>
              </div>
            ) : null}
            <p className="accounts-code-value font-mono text-xs font-semibold leading-5 text-base-content">
              {account.workloadIdentityProvider}
            </p>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-base-300/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2.5">
              <input
                checked={account.enabled}
                className="toggle toggle-success toggle-sm"
                disabled={busy}
                onChange={(event) => onToggle(event.target.checked)}
                type="checkbox"
              />
              <span className="text-xs font-bold text-base-content">Enabled</span>
              <span className="hidden text-xs text-base-content/50 sm:inline">
                {account.enabled ? "· Provisioning active" : "· Provisioning paused"}
              </span>
            </label>

            <span className="inline-flex items-center gap-1.5 text-xs text-base-content/50">
              <Clock3 aria-hidden="true" size={13} />
              <span>Updated {formatDateTime(account.updatedAt)}</span>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
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
              className="btn btn-error btn-sm gap-1.5 px-3"
              disabled={busy}
              onClick={onDelete}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
              <span>Delete</span>
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}
