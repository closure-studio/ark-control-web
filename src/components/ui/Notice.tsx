import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils";

export function Notice({ tone, children, onClose }: {
  tone: "success" | "error" | "info";
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className={cx("alert items-start py-3", tone === "success" && "alert-success alert-soft", tone === "error" && "alert-error alert-soft", tone === "info" && "alert-info alert-soft")} role="status">
      <span className="min-w-0 grow break-words text-sm">{children}</span>
      {onClose ? (
        <button aria-label="Dismiss" className="btn btn-square btn-ghost btn-xs" onClick={onClose} type="button">
          <X aria-hidden="true" size={15} />
        </button>
      ) : null}
    </div>
  );
}
