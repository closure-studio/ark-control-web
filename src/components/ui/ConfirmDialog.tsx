import { LoaderCircle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

export function ConfirmDialog({
  open,
  title,
  detail,
  confirmation,
  busy,
  confirmLabel = "Delete",
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  detail: ReactNode;
  confirmation: string;
  busy: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!open) setValue("");
  }, [open]);
  if (!open) return null;

  return (
    <div
      aria-labelledby="confirm-dialog-title"
      aria-modal="true"
      className="modal modal-open backdrop-blur-xs"
      role="dialog"
    >
      <div className="modal-box max-w-lg rounded-box border border-base-content/20 bg-base-100 shadow-2xl">
        <h2 className="text-lg font-bold" id="confirm-dialog-title">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-base-content/70">{detail}</div>
        <fieldset className="fieldset mt-4 gap-2">
          <label className="label text-xs text-base-content/75" htmlFor="confirm-dialog-input">
            <span>
              Enter <strong className="font-mono text-base-content">{confirmation}</strong> to
              continue
            </span>
          </label>
          <input
            autoFocus
            className="input w-full font-mono"
            id="confirm-dialog-input"
            onChange={(event) => setValue(event.target.value)}
            value={value}
          />
        </fieldset>
        <div className="modal-action">
          <button className="btn btn-sm" disabled={busy} onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="btn btn-error btn-sm"
            disabled={busy || value !== confirmation}
            onClick={onConfirm}
            type="button"
          >
            {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
      <button
        aria-label="Close confirmation"
        className="modal-backdrop"
        disabled={busy}
        onClick={onCancel}
        type="button"
      />
    </div>
  );
}
