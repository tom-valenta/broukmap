export const MAX_SIGHTING_PHOTOS = 6;

export function movePhoto<T>(photos: T[], index: number, direction: -1 | 1): T[] {
  return reorderPhoto(photos, index, index + direction);
}

export function reorderPhoto<T>(photos: T[], index: number, target: number): T[] {
  if (index < 0 || index >= photos.length || target < 0 || target >= photos.length) return photos;
  const next = [...photos];
  const [photo] = next.splice(index, 1);
  next.splice(target, 0, photo);
  return next;
}
