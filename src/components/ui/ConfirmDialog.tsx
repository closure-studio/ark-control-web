import { LoaderCircle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";

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

  return (
    <FormModal busy={busy} kind="confirm" onClose={onCancel} open={open} title={title}>
      <div className="p-5">
        <div className="text-sm leading-6 text-base-content/70 wrap-anywhere">{detail}</div>
        <fieldset className="fieldset mt-4 gap-2">
          <label className="label text-xs whitespace-normal text-base-content/75 wrap-anywhere" htmlFor="confirm-dialog-input">
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
    </FormModal>
  );
}
