import type { Sighting } from "./sightings";
export const MAP_SIGHTING_FIELDS = "id,latitude,longitude,geoprivacy,id_status,photo_url,common_name,scientific_name,species_name_text,location_precision,obfuscation_radius_m" as const;
export type MapSighting = Pick<Sighting, "id" | "latitude" | "longitude" | "geoprivacy" | "id_status" | "photo_url" | "common_name" | "scientific_name" | "species_name_text" | "location_precision" | "obfuscation_radius_m">;
