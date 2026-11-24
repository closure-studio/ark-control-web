import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/utils";

export function PresetButton({
  className = "btn-xs h-7 min-h-7 px-2 text-[0.7rem] tabular-nums",
  pressed,
  ...props
}: Omit<ComponentPropsWithoutRef<"button">, "aria-pressed" | "type"> & { pressed: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={pressed}
      className={cx(
        "btn btn-ghost border-base-300 bg-base-100 text-base-content hover:border-base-content/40 aria-pressed:border-info aria-pressed:bg-info/10",
        className
      )}
      type="button"
    />
  );
}
