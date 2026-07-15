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
    <div aria-labelledby="confirm-dialog-title" aria-modal="true" className="modal modal-open" role="dialog">
      <div className="modal-box max-w-lg rounded-lg border border-base-300">
        <h2 className="text-lg font-bold" id="confirm-dialog-title">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-base-content/70">{detail}</div>
        <label className="form-control mt-4 grid gap-2">
          <span className="label-text">Enter <strong className="font-mono">{confirmation}</strong> to continue</span>
          <input
            autoFocus
            className="input input-bordered w-full font-mono"
            onChange={(event) => setValue(event.target.value)}
            value={value}
          />
        </label>
        <div className="modal-action">
          <button className="btn" disabled={busy} onClick={onCancel} type="button">Cancel</button>
          <button className="btn btn-error" disabled={busy || value !== confirmation} onClick={onConfirm} type="button">
            {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
      <button aria-label="Close confirmation" className="modal-backdrop" disabled={busy} onClick={onCancel} type="button" />
    </div>
  );
}
