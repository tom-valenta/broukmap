# Map, sightings and consensus — implementation record

Completed locally against the existing Supabase project `pwlpyfgvypkwnosoasvq`. The migrations in `supabase/migrations` have been applied to that project. They extend the original schema; they are not a fresh-database bootstrap. Existing profile role-protection policies were preserved.

## Product behavior

- `/map`: worldwide React Leaflet map, clustering, grey unresolved/disputed pins and green confirmed pins. Click/tap to select a place, drag to adjust and confirm to open the form. `/pridat` redirects here.
- Required photo, date in the submitter's time zone, optional catalogue or text guess, editable notes, sensitivity flag and open/obscured/private privacy. Photos are re-encoded to remove EXIF/GPS metadata. Creation and the initial guess commit atomically.
- `pending` is immediately public; there is no pre-publication approval gate. Hidden and private records never enter the public map or help feed.
- `/sightings/[id]`: blind identification, skip, grouped suggestions and agreement, own suggestion updates/deletion until closure, likes, notes and manual reports.
- `/help-verify`: like-count ordering; skipped or already suggested sightings are excluded for the current viewer.
- Profiles show real paginated history and statistics. Authors' counts include private/hidden sightings; other viewers' counts only use records they may see. Existing manual badges are displayed; no new achievement rules were invented.
- `/admin`: report queue (total reports vs distinct reporters, plus outstanding counts), priority sensitive flags, confirmed text without species_id, and disputed identifications. Admin can pair with an existing species or create and pair a new one.
- Reports never hide anything automatically. Only admin actions hide/delete; dismissal preserves status. Only report IDs actually shown to the admin are resolved, preserving later arrivals.
- No comments table or discussion UI.

## Database boundaries

The exact-coordinate base table is readable only by the owner and admins. Moderators use the same masked public projection as other viewers; the separate `moderator_private_sightings` projection exposes only IDs of private, non-hidden records.

`public_sightings` is a security-invoker view over a narrowly scoped projection function in the non-exposed private schema. That function filters visibility and masks coordinates before returning any rows. Obscured coordinates are generated once using a uniform disk of radius 100 metres on the sphere; repeated reads do not generate independent samples. Private and hidden photos use private Storage and a no-store authenticated-access route.

Identification RLS prevents reading proposals before a user's guess or skip. Public species labels are absent before confirmation. A BEFORE trigger locks the parent sighting before mutations; the AFTER trigger recomputes all votes, including case-insensitive trimmed text, using >=3 suggestions and >=0.66 share. At eight votes without a majority it freezes as disputed. Confirmed/disputed guesses cannot be inserted, updated or deleted. Text confirmation stores the normalized name with species_id NULL. Sensitive canonical confirmation or later pairing escalates open privacy to obscured and preserves private.

Author field protection permits notes edits without changing identity, moderation or consensus. Creation validates the uploaded photo and current user; retries reuse a generated sighting ID. Backdating is based on the submission time zone and is not changed by later notes edits.

## Verification

- `supabase/tests/manual_sighting_reports.sql`: passed against the linked database in a rolled-back transaction with synthetic users. Covers immediate visibility, repeated reporters, no automatic hiding, dismissal, later reports, hidden visibility, photo authorization, admin-only actions and permanent deletion.
- `supabase/tests/sighting_consensus.sql`: passed in a rolled-back transaction. Covers atomic creation/rollback, initial vote, blind access/unlock, normalized text majority, terminal insert/update/delete rejection, disputed state, update/delete recomputation, sensitive escalation, private visibility/statistics, moderator precision restrictions, likes, immutable computed fields, notes after confirmation, admin pairing/creation and local date validation.
- TypeScript, lint of changed/new feature files and production build passed.
- Browser checked on localhost:3000: map tiles and marker, click-to-place, dragging and coordinates, public popup, confirmed detail and protected photo download. Browser session was signed out; authenticated UI submission was not exercised end-to-end. The authenticated database paths were exercised by the SQL tests.
- Concurrent database connections were not stress-tested; mutation serialization is enforced by the parent-row lock.

The map fetches up to 1,000 records per viewport and prompts the user to zoom when the result is larger. Feeds/profiles paginate; admin queues show batches of 100. The map uses standard OpenStreetMap tiles; the library is free and no API key is needed. Large-scale tile hosting remains an operational choice, not an unlimited service guarantee.

## Maintenance and advisor notes

Pinned dependencies: Leaflet 1.9.4, React Leaflet 5.0.0, react-leaflet-cluster 4.1.3. The user explicitly chose this stack after reviewing maintenance activity.

- [React Leaflet releases](https://github.com/PaulLeCam/react-leaflet/releases): 5.0.0 dated December 2024, React 19 support.
- [React Leaflet commits](https://github.com/PaulLeCam/react-leaflet/commits/master/): latest returned commit June 2025 when inspected.
- [Cluster releases](https://github.com/akursat/react-leaflet-cluster/releases): 4.1.3 dated March 2026.

The final security advisor no longer flags the former security-definer public view. Remaining pre-existing notices concern `lowercase_username` search_path, public-schema citext, public callable role-check helpers and disabled leaked-password protection. These were not silently changed as part of the map work. [Advisor reference](https://supabase.com/docs/guides/database/database-linter).
