# Locality lookup

Profile cards request `/api/sightings/<id>/locality`. The server reads the existing public projection using a publishable key WITHOUT a session. Exact owner/admin coordinates cannot reach the geocoder. Private/hidden sightings are not geocoded, even on an owner's profile. Access is checked again before every lookup, including cache hits; HTTP responses are not cached.

Nominatim returns city/town/village/hamlet/municipality, never a street or house number. Missing coverage is shown honestly. Obscured sightings use only their public randomized coordinates; the municipality may differ near a boundary.

## Deployment

Development uses `.cache/geocoding`. **Production must set `GEOCODING_CACHE_DIR` to persistent writable storage shared by ALL app processes.** Without it lookups fail closed. The shared exclusive file lock serializes calls with at least 1.1 seconds between requests, including failures. Successful results (including no settlement found) persist across restarts. Do not deploy this adapter on independent serverless filesystems; use a single geocoding server/shared volume instead.

If a process crashes while holding `provider.lock`, calls fail closed. Stop geocoding workers, remove only that lock file, then restart. Keep cached JSON files. Do not clear the cache on deployment.

`NOMINATIM_URL` changes the reverse endpoint without source edits. Default: `https://nominatim.openstreetmap.org/reverse`. Server identifies itself as BroukMap; profile displays OSM attribution. No periodic or bulk backfill jobs. For larger traffic use a dedicated provider.

Policy: https://operations.osmfoundation.org/policies/nominatim/
API: https://nominatim.org/release-docs/latest/api/Reverse/
