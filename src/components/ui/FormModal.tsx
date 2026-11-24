import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils";

const FORM_FRAME = {
  titleId: "form-modal-title",
  closeLabel: "Close",
  backdropLabel: "Close dialog"
};

const MODAL_KINDS = {
  confirm: {
    maxWidth: "max-w-lg",
    titleId: "confirm-dialog-title",
    closeLabel: null,
    backdropLabel: "Close confirmation"
  },
  form: { ...FORM_FRAME, maxWidth: "max-w-2xl" },
  script: { ...FORM_FRAME, maxWidth: "max-w-3xl" },
  log: { ...FORM_FRAME, maxWidth: "max-w-5xl" }
} as const;

export function FormModal({
  busy = false,
  children,
  kind,
  onClose,
  open,
  title
}: {
  busy?: boolean;
  children: ReactNode;
  kind: keyof typeof MODAL_KINDS;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;
  const { titleId, maxWidth, closeLabel, backdropLabel } = MODAL_KINDS[kind];
  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="modal modal-open grid-cols-1 grid-rows-1"
      role="dialog"
    >
      <div
        className={cx(
          "modal-box glass-chrome grid max-h-[90vh] w-11/12 grid-cols-1 overflow-x-hidden overflow-y-auto rounded-box border border-base-content/20 p-0 text-base-content shadow-lg",
          maxWidth
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="min-w-0 text-lg font-bold wrap-anywhere" id={titleId}>
            {title}
          </h2>
          {closeLabel !== null && (
            <button
              aria-label={closeLabel}
              className="btn btn-square btn-ghost btn-sm shrink-0"
              disabled={busy}
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <div className="border-t border-base-300 bg-base-100">
          {children}
        </div>
      </div>
      <button
        aria-label={backdropLabel}
        className="modal-backdrop"
        disabled={busy}
        onClick={onClose}
        type="button"
      />
    </div>
  );
}
