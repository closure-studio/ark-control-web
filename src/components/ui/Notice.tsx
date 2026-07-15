import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils";

type NoticeTone = "success" | "error" | "info";

const TONE_CLASSES: Record<NoticeTone, string> = {
  error: "alert-error alert-soft",
  info: "alert-info alert-soft",
  success: "alert-success alert-soft"
};

export function Notice({ tone, children, onClose }: {
  tone: NoticeTone;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className={cx("alert items-start py-3", TONE_CLASSES[tone])} role="status">
      <span className="min-w-0 grow break-words text-sm">{children}</span>
      {onClose ? (
        <button aria-label="Dismiss" className="btn btn-square btn-ghost btn-xs" onClick={onClose} type="button">
          <X aria-hidden="true" size={15} />
        </button>
      ) : null}
    </div>
  );
}
