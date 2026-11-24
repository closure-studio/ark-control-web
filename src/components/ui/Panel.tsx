import type { AriaAttributes, ReactNode } from "react";
import { cx } from "@/utils";

type PanelHeadingContent = {
  id: string;
  title: string;
  detail?: ReactNode;
  action?: ReactNode;
};

type PanelProps = Pick<AriaAttributes, "aria-label" | "aria-labelledby"> & {
  children: ReactNode;
  className?: string;
  header?: PanelHeadingContent;
};

export function PanelHeading({ action, className, detail, id, title }: PanelHeadingContent & { className: string }) {
  return (
    <header className={cx("flex flex-wrap items-center justify-between gap-x-4 gap-y-3", className)}>
      <div>
        <h2 className="text-base font-extrabold" id={id}>
          {title}
        </h2>
        {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
      </div>
      {action}
    </header>
  );
}

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
      {header ? <PanelHeading {...header} className="border-b border-base-300 px-5 py-4 sm:px-6" /> : null}
      {children}
    </section>
  );
}
