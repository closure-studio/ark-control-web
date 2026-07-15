import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-base-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="page-kicker m-0">{eyebrow}</p> : null}
        <h1 className={eyebrow ? "mt-1.5 text-[2rem] font-black leading-tight text-base-content sm:text-[2.25rem]" : "text-[2rem] font-black leading-tight text-base-content sm:text-[2.25rem]"} id="page-title">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/55">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </header>
  );
}
