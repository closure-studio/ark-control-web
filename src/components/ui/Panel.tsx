import type { AriaAttributes, ReactNode } from "react";
import { cx } from "@/utils";

type PanelProps = Pick<AriaAttributes, "aria-label" | "aria-labelledby"> & {
  children: ReactNode;
  className?: string;
  header?: {
    id: string;
    title: string;
    detail?: ReactNode;
    action?: ReactNode;
  };
};

export function Panel({
  "aria-label": label,
  "aria-labelledby": labelledBy,
  children,
  className,
  header
}: PanelProps) {
  return (
    <section
      aria-label={label}
      aria-labelledby={header?.id ?? labelledBy}
      className={cx("surface min-w-0 overflow-hidden", className)}
    >
      {header ? (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-base-300 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold" id={header.id}>
              {header.title}
            </h2>
            {header.detail ? (
              <p className="mt-1 text-xs text-base-content/55">{header.detail}</p>
            ) : null}
          </div>
          {header.action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
