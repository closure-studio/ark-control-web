import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils";

export function FormModal({
  open,
  title,
  children,
  onClose,
  width = "max-w-2xl"
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div aria-labelledby="form-modal-title" aria-modal="true" className="modal modal-open" role="dialog">
      <div className={cx("modal-box max-h-[90vh] rounded-lg border border-base-300 p-0", width)}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-300 bg-base-100 p-4">
          <h2 className="text-lg font-bold" id="form-modal-title">{title}</h2>
          <button aria-label="Close" className="btn btn-square btn-ghost btn-sm" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </div>
      <button aria-label="Close dialog" className="modal-backdrop" onClick={onClose} type="button" />
    </div>
  );
}
