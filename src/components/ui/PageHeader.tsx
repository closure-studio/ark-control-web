import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  actions
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-base-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="page-kicker m-0">{eyebrow}</p>
        <h1 className="mt-1.5 text-[2rem] font-black leading-tight text-base-content sm:text-[2.25rem]" id="page-title">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </header>
  );
}
