import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function ModalFormActions({
  busy,
  children,
  disabled = false,
  idleIcon,
  onCancel
}: {
  busy: boolean;
  children: ReactNode;
  disabled?: boolean;
  idleIcon?: ReactNode;
  onCancel: () => void;
}) {
  return (
    <div className="modal-action mt-0 border-t border-base-300 pt-4">
      <button className="btn btn-sm" disabled={busy} onClick={onCancel} type="button">
        Cancel
      </button>
      <button className="btn btn-primary btn-sm gap-2" disabled={busy || disabled} type="submit">
        {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : idleIcon}
        {children}
      </button>
    </div>
  );
}
