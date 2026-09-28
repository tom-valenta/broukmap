-- RLS and exact coordinates stay unchanged.
alter table public.sightings add column obfuscation_radius_m integer not null default 100 check (obfuscation_radius_m >= 100);

create or replace function private.protect_sighting_location() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
 SENSITIVE_OBFUSCATION_RADIUS_M constant integer := 3000;
 radius_m integer := 100;
 sensitive boolean;
 bearing float8; distance float8; lat1 float8; lon1 float8; lat2 float8; lon2 float8;
begin
 sensitive := new.reported_sensitive or exists(select 1 from public.species where id=new.species_id and is_sensitive)
   or exists(select 1 from public.identifications i join public.species sp on sp.id=i.species_id
     where i.sighting_id=new.id and sp.is_sensitive);
 -- Protection is sticky: deleting/changing a guess must not reveal a smaller area.
 if tg_op='UPDATE' and old.obfuscation_radius_m>100 then sensitive:=true; end if;
 if sensitive then radius_m:=SENSITIVE_OBFUSCATION_RADIUS_M; end if;
 if tg_op='UPDATE' then radius_m:=greatest(radius_m,old.obfuscation_radius_m); end if;
 new.obfuscation_radius_m:=radius_m;
 if sensitive and new.geoprivacy='open' then new.geoprivacy:='obscured'; end if;
 if tg_op='INSERT' or new.public_latitude is null or new.public_longitude is null
   or new.latitude is distinct from old.latitude or new.longitude is distinct from old.longitude
   or new.obfuscation_radius_m is distinct from old.obfuscation_radius_m then
   bearing:=random()*2*pi(); distance:=sqrt(random())*radius_m/6371008.8;
   lat1:=radians(new.latitude); lon1:=radians(new.longitude);
   lat2:=asin(sin(lat1)*cos(distance)+cos(lat1)*sin(distance)*cos(bearing));
   lon2:=lon1+atan2(sin(bearing)*sin(distance)*cos(lat1),cos(distance)-sin(lat1)*sin(lat2));
   new.public_latitude:=degrees(lat2);
   new.public_longitude:=degrees(lon2)-360*floor((degrees(lon2)+180)/360);
 end if;
 return new;
end; $$;

-- Existing BEFORE identification guard locks the parent and checks author permissions.
-- This AFTER trigger runs before consensus; no new externally callable mutation API.
create function private.protect_sensitive_guess() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.species where id=new.species_id and is_sensitive) then
   update public.sightings set geoprivacy=geoprivacy where id=new.sighting_id;
 end if;
 return null;
end; $$;
revoke all on function private.protect_sensitive_guess() from public,anon,authenticated;
create trigger b_protect_sensitive_guess after insert or update on public.identifications
for each row execute function private.protect_sensitive_guess();

create or replace function private.protect_newly_sensitive_species() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.is_sensitive then
   update public.sightings s set geoprivacy=s.geoprivacy
   where s.species_id=new.id or exists(select 1 from public.identifications i where i.sighting_id=s.id and i.species_id=new.id);
 end if;
 return new;
end; $$;

-- Backfill includes already-obscured and private sightings, and unconfirmed guesses.
update public.sightings set geoprivacy=geoprivacy;

create function private.sighting_obfuscation_radius(target uuid) returns integer
language sql stable security definer set search_path='' as $$
 select s.obfuscation_radius_m from public.sightings s where s.id=target and private.can_access_sighting(s.id);
$$;
revoke all on function private.sighting_obfuscation_radius(uuid) from public;
grant execute on function private.sighting_obfuscation_radius(uuid) to anon,authenticated;

create or replace view public.public_sightings with (security_invoker=true,security_barrier=true) as
select id,photo_url,found_date,created_at,species_id,species_name_text,status,country_code::varchar(2),
 geoprivacy,individual_count,life_stage,is_backdated,id_status,common_name,scientific_name,family,is_sensitive,
 notes,location_precision,latitude,longitude,poster_username,user_id,reported_sensitive,like_count,
 private.sighting_obfuscation_radius(id) as obfuscation_radius_m
from private.visible_sightings();

create or replace view public.help_verify with (security_invoker=true) as
select s.* from public.public_sightings s where s.id_status='needs_id'
 and s.status in ('pending','approved') and s.geoprivacy<>'private'
 and not exists(select 1 from public.user_skips k where k.sighting_id=s.id and k.user_id=(select auth.uid()))
 and not exists(select 1 from public.identifications i where i.sighting_id=s.id and i.user_id=(select auth.uid()));
