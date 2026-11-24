import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/utils";

export function TerminalFrame({
  actions,
  children,
  icon: Icon,
  title,
  viewportClassName
}: {
  actions: ReactNode;
  children: ReactNode;
  icon?: LucideIcon;
  title: string;
  viewportClassName: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-box border border-neutral-content/15 bg-neutral text-neutral-content">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-content/15 px-3 py-2 text-xs [&_button.btn-ghost:focus-visible]:bg-neutral [&_button.btn-ghost:focus-visible]:text-neutral-content [&_button.btn-ghost:focus-visible]:outline-neutral-content">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-neutral-content/80">
          {Icon && <Icon aria-hidden="true" className="shrink-0" size={13} />}
          <span className="truncate">{title}</span>
        </span>
        {actions}
      </div>
      <div className={cx("scrollbar-thin overflow-auto p-3 font-mono text-xs leading-5", viewportClassName)}>
        {children}
      </div>
    </div>
  );
}
