import { GripVertical } from "lucide-react";

export default function PhotoOrderBadge({ index, draggable }: { index: number; draggable: boolean }) {
  return <div className="pointer-events-none absolute inset-x-1 top-1 z-10 flex items-center justify-between gap-1">
    <span className="flex items-center gap-1 rounded-full bg-black/75 px-1.5 py-1 text-xs font-bold text-white shadow-sm"><span className="tabular-nums">{index + 1}</span>{index === 0 && <span>Úvodní</span>}</span>
    {draggable && <span className="rounded-lg bg-black/65 p-1 text-white"><GripVertical className="size-3" aria-hidden="true" /></span>}
  </div>;
}
