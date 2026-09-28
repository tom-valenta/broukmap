-- One bounded, ordered collection per post. Likes continue referencing sightings.id.
create table public.sighting_photo_sets (
  sighting_id uuid primary key references public.sightings(id) on delete cascade,
  paths text[] not null check (array_ndims(paths)=1 and array_lower(paths,1)=1 and cardinality(paths) between 1 and 6 and array_position(paths,null) is null)
);
alter table public.sighting_photo_sets enable row level security;
grant select on public.sighting_photo_sets to anon,authenticated;
grant insert on public.sighting_photo_sets to authenticated;
grant update(paths) on public.sighting_photo_sets to authenticated;
create policy photo_sets_read on public.sighting_photo_sets for select to anon,authenticated
using (private.can_access_sighting(sighting_id));
create policy photo_sets_insert on public.sighting_photo_sets for insert to authenticated
with check (exists(select 1 from public.sightings s where s.id=sighting_id and s.user_id=(select auth.uid())));
create policy photo_sets_reorder on public.sighting_photo_sets for update to authenticated
using (exists(select 1 from public.sightings s where s.id=sighting_id and s.user_id=(select auth.uid())))
with check (exists(select 1 from public.sightings s where s.id=sighting_id and s.user_id=(select auth.uid())));

create function private.validate_photo_set() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if cardinality(new.paths) <> (select count(distinct p) from unnest(new.paths) p) then
   raise exception 'Duplicate photos' using errcode='22023';
 end if;
 if tg_op='UPDATE' then
   if new.sighting_id is distinct from old.sighting_id or not (new.paths @> old.paths and new.paths <@ old.paths) then
     raise exception 'Only photo order may change' using errcode='42501';
   end if;
 else
   if exists(select 1 from unnest(new.paths) p where split_part(p,'/',1) is distinct from auth.uid()::text
      or not exists(select 1 from storage.objects o where o.bucket_id='sighting-photos' and o.name=p)) then
     raise exception 'Upload your photos first' using errcode='22023';
   end if;
   if not exists(select 1 from public.sightings s where s.id=new.sighting_id and s.photo_url=new.paths[1]) then
     raise exception 'Cover must match the new sighting' using errcode='22023';
   end if;
 end if;
 return new;
end; $$;
revoke all on function private.validate_photo_set() from public;
create trigger validate_photo_set before insert or update on public.sighting_photo_sets
for each row execute function private.validate_photo_set();

create function public.create_sighting_with_photos(
 p_id uuid,p_photos text[],p_latitude float8,p_longitude float8,p_found_date date,
 p_geoprivacy text default 'obscured',p_sensitive boolean default false,p_notes text default null,
 p_species_id uuid default null,p_species_text text default null,p_timezone text default 'UTC'
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if p_photos is null or cardinality(p_photos) not between 1 and 6 then
   raise exception 'Choose between 1 and 6 photos' using errcode='22023';
 end if;
 -- Explicit timezone selects the existing 11-argument overload.
 perform public.create_sighting(p_id,p_photos[1],p_latitude,p_longitude,p_found_date,
   p_geoprivacy,p_sensitive,p_notes,p_species_id,p_species_text,p_timezone);
 insert into public.sighting_photo_sets(sighting_id,paths) values(p_id,p_photos);
 return p_id;
end; $$;
revoke all on function public.create_sighting_with_photos(uuid,text[],float8,float8,date,text,boolean,text,uuid,text,text) from public,anon;
grant execute on function public.create_sighting_with_photos(uuid,text[],float8,float8,date,text,boolean,text,uuid,text,text) to authenticated;

-- Extend the existing private-bucket authorization helper to all gallery photos.
create or replace function private.can_read_sighting_photo(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.sightings s
   where (s.photo_url=object_name or split_part(s.photo_url,'/sighting-photos/',2)=object_name
     or exists(select 1 from public.sighting_photo_sets p where p.sighting_id=s.id and object_name=any(p.paths)))
   and private.can_access_sighting(s.id));
$$;
