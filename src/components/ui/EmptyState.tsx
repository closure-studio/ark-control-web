import { Inbox } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="grid min-h-44 place-items-center border-y border-dashed border-base-300 px-4 text-center">
      <div>
        <Inbox aria-hidden="true" className="mx-auto text-muted" size={28} />
        <h3 className="mt-3 font-black">{title}</h3>
        {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
      </div>
    </div>
  );
}
