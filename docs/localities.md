# Locality lookup

Profile cards request `/api/sightings/<id>/locality`. The server reads the existing public projection using a publishable key WITHOUT a session. Exact owner/admin coordinates cannot reach the geocoder. Private/hidden sightings are not geocoded, even on an owner's profile. Access is checked again before every lookup, including cache hits; HTTP responses are not cached.

Nominatim returns city/town/village/hamlet/municipality, never a street or house number. Missing coverage is shown honestly. Obscured sightings use only their public randomized coordinates; the municipality may differ near a boundary.

## Deployment

Responses from the reverse-geocoding URL are cached for 30 days by Next's fetch cache, which is durable on Vercel and does not require a writable serverless filesystem. Within one application instance, misses are spaced at least 1.1 seconds apart. A new deployment can have cold cache entries, so keep traffic modest or use a dedicated provider when traffic grows.

`NOMINATIM_URL` changes the reverse endpoint without source edits. Default: `https://nominatim.openstreetmap.org/reverse`. Server identifies itself as BroukMap; profile displays OSM attribution. No periodic or bulk backfill jobs. For larger traffic use a dedicated provider.

Policy: https://operations.osmfoundation.org/policies/nominatim/
API: https://nominatim.org/release-docs/latest/api/Reverse/
