import type { RecLabel } from "@/lib/types";
import { labelStyle } from "@/lib/labels";
import clsx from "clsx";

export function RecLabelChip({
  label,
  className,
}: {
  label: RecLabel;
  className?: string;
}) {
  const s = labelStyle(label);
  return (
    <span className={clsx("chip", s.className, className)}>
      <span>{s.emoji}</span>
      {s.text}
    </span>
  );
}
