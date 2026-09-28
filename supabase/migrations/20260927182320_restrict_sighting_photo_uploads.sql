-- Enforce the same upload contract at Storage level; client-side checks are bypassable.
update storage.buckets
set
  file_size_limit = 30 * 1024 * 1024,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
where id = 'sighting-photos';
