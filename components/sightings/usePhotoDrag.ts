"use client";

import { useRef, useState, type DragEvent } from "react";

/** Keep drag ownership local: file drops and other galleries cannot reorder this list. */
export default function usePhotoDrag(disabled: boolean, onMove: (from: number, to: number) => void) {
  const source = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  function reset() { source.current = null; setDragging(null); setTarget(null); }
  function itemProps(index: number) {
    return {
      draggable: !disabled,
      onDragStart(event: DragEvent<HTMLLIElement>) {
        if (disabled || (event.target as HTMLElement).closest("[data-no-drag]")) { event.preventDefault(); return; }
        source.current = index; setDragging(index); setTarget(index);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      },
      onDragOver(event: DragEvent<HTMLLIElement>) {
        if (disabled || source.current === null) return;
        event.preventDefault(); event.dataTransfer.dropEffect = "move"; setTarget(index);
      },
      onDragLeave(event: DragEvent<HTMLLIElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null);
      },
      onDrop(event: DragEvent<HTMLLIElement>) {
        if (source.current === null) return;
        event.preventDefault();
        if (!disabled && source.current !== index) onMove(source.current, index);
        reset();
      },
      onDragEnd: reset,
    };
  }
  function itemClass(index: number) {
    return `relative rounded-xl transition-[opacity,box-shadow,transform] motion-reduce:transition-none ${!disabled ? "cursor-grab active:cursor-grabbing" : ""} ${dragging === index ? "opacity-40 scale-[0.98]" : ""} ${target === index && dragging !== index ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" : ""}`;
  }
  return { itemProps, itemClass, target, dragging };
}
