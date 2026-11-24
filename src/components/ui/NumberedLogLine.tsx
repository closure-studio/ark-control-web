import { cx } from "@/utils";

export function NumberedLogLine({
  isError,
  number,
  text
}: {
  isError: boolean;
  number: number;
  text: string;
}) {
  return (
    <span className={cx("flex min-h-lh gap-3 rounded-sm px-1.5", isError && "bg-error/20")}>
      <span
        aria-hidden="true"
        className="min-w-7 shrink-0 select-none text-right tabular-nums text-neutral-content/65"
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">{text}</span>
    </span>
  );
}
