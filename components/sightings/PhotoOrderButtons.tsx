export default function PhotoOrderButtons({ index, count, disabled, onMove }: {
  index: number; count: number; disabled?: boolean; onMove: (direction: -1 | 1) => void;
}) {
  return <div data-no-drag className="photo-order-buttons flex gap-1">
    <button type="button" disabled={disabled || index === 0} onClick={() => onMove(-1)} aria-label={`Posunout fotografii ${index + 1} dopředu`} className="min-h-11 min-w-11 rounded-lg border border-[var(--border)] disabled:opacity-30">←</button>
    <button type="button" disabled={disabled || index === count - 1} onClick={() => onMove(1)} aria-label={`Posunout fotografii ${index + 1} dozadu`} className="min-h-11 min-w-11 rounded-lg border border-[var(--border)] disabled:opacity-30">→</button>
  </div>;
}
