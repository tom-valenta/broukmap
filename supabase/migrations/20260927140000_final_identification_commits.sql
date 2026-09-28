-- A post author's initial suggestion is context, not a community vote.
alter table public.sightings add column author_species_id uuid references public.species(id);
alter table public.sightings add column author_species_name_text text;
alter table public.sightings add constraint sightings_author_species_or_text_check
  check (author_species_id is null or author_species_name_text is null);
alter table public.identifications disable trigger a_guard_identification;

-- Preserve legacy author guesses as context, then remove them from the vote pool.
update public.sightings s set
  author_species_id = i.species_id,
  author_species_name_text = i.species_name_text
from lateral (
  select species_id, species_name_text from public.identifications
  where sighting_id=s.id and user_id=s.user_id order by created_at, id limit 1
) i
where s.user_id is not null and s.author_species_id is null;
delete from public.identifications i using public.sightings s
where i.sighting_id=s.id and i.user_id=s.user_id;

-- Historical UI allowed both paths. Keep whichever commitment was made first.
delete from public.identifications i using public.user_skips k
where i.sighting_id=k.sighting_id and i.user_id=k.user_id and k.created_at<=i.created_at;
delete from public.user_skips k using public.identifications i
where i.sighting_id=k.sighting_id and i.user_id=k.user_id;

-- One community member can make only one final commitment per sighting.
delete from public.identifications i using (
  select id, row_number() over (partition by sighting_id, user_id order by created_at, id) as ordinal
  from public.identifications
) duplicates where i.id=duplicates.id and duplicates.ordinal>1;
alter table public.identifications add constraint identifications_one_commit_per_user unique (sighting_id,user_id);

-- Never expose the author's private working tip to other visitors.
drop view public.help_verify;
drop view public.public_sightings;
drop function private.visible_sightings();
create or replace function private.visible_sightings() returns table (
 id uuid,photo_url text,found_date date,created_at timestamptz,species_id uuid,species_name_text text,
 status text,country_code varchar,geoprivacy text,individual_count int,life_stage text,is_backdated boolean,id_status text,
 common_name text,scientific_name text,family text,is_sensitive boolean,notes text,location_precision text,
 latitude float8,longitude float8,poster_username public.citext,user_id uuid,reported_sensitive boolean,like_count bigint,
 author_species_id uuid,author_species_name_text text
) language sql stable security definer set search_path='' as $$
select s.id,s.photo_url,s.found_date,s.created_at,
 case when s.id_status='confirmed' then s.species_id end,
 case when s.id_status='confirmed' then s.species_name_text end,
 s.status,s.country_code,s.geoprivacy,s.individual_count,s.life_stage,s.is_backdated,s.id_status,
 case when s.id_status='confirmed' then sp.common_name end,
 case when s.id_status='confirmed' then sp.scientific_name end,
 case when s.id_status='confirmed' then sp.family end,
 case when s.id_status='confirmed' then sp.is_sensitive end,
 s.notes,
 case when s.user_id=auth.uid() or public.is_admin() then 'exact' else s.geoprivacy end,
 case when s.geoprivacy='open' or s.user_id=auth.uid() or public.is_admin() then s.latitude else s.public_latitude end,
 case when s.geoprivacy='open' or s.user_id=auth.uid() or public.is_admin() then s.longitude else s.public_longitude end,
 p.username,s.user_id,s.reported_sensitive,(select count(*) from public.sighting_likes l where l.sighting_id=s.id),
 case when s.user_id=auth.uid() or public.is_admin() then s.author_species_id end,
 case when s.user_id=auth.uid() or public.is_admin() then s.author_species_name_text end
from public.sightings s left join public.species sp on sp.id=s.species_id left join public.profiles p on p.id=s.user_id
where (s.status in ('pending','approved') and s.geoprivacy<>'private')
 or (auth.uid() is not null and (s.user_id=auth.uid() or public.is_admin()));
$$;

create or replace view public.public_sightings with (security_invoker=true,security_barrier=true) as
select id,photo_url,found_date,created_at,species_id,species_name_text,status,country_code::varchar(2),
 geoprivacy,individual_count,life_stage,is_backdated,id_status,common_name,scientific_name,family,is_sensitive,
 notes,location_precision,latitude,longitude,poster_username,user_id,reported_sensitive,like_count,
 author_species_id,author_species_name_text,private.sighting_obfuscation_radius(id) as obfuscation_radius_m
from private.visible_sightings();

create or replace view public.help_verify with (security_invoker=true) as
select s.* from public.public_sightings s where s.id_status='needs_id'
 and s.status in ('pending','approved') and s.geoprivacy<>'private'
 and not exists(select 1 from public.user_skips k where k.sighting_id=s.id and k.user_id=(select auth.uid()))
 and not exists(select 1 from public.identifications i where i.sighting_id=s.id and i.user_id=(select auth.uid()))
 and s.user_id is distinct from (select auth.uid());
grant select on public.public_sightings to anon,authenticated;
grant select on public.help_verify to authenticated;
revoke all on public.help_verify from anon;

-- The author can follow discussion without casting a community vote.
create or replace function private.identifications_unlocked(target_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.can_access_sighting(target_id) and exists (
    select 1 from public.sightings s where s.id=target_id and (
      s.id_status<>'needs_id' or (auth.uid() is not null and (
        s.user_id=auth.uid()
        or exists(select 1 from public.identifications i where i.sighting_id=s.id and i.user_id=auth.uid())
        or exists(select 1 from public.user_skips k where k.sighting_id=s.id and k.user_id=auth.uid())
      ))
    )
  );
$$;

create or replace function private.guard_identification() returns trigger
language plpgsql security definer set search_path='' as $$
declare state text; owner uuid;
begin
  if tg_op='DELETE' then
    -- The only supported delete is a parent sighting cascade.
    if not exists(select 1 from public.sightings where id=old.sighting_id) then return old; end if;
    raise exception 'Community identification is final' using errcode='42501';
  end if;
  if tg_op='UPDATE' then raise exception 'Community identification is final' using errcode='42501'; end if;
  owner := new.user_id;
  select id_status into state from public.sightings where id=new.sighting_id for update;
  if not found or auth.uid() is null or owner is distinct from auth.uid() or not private.can_access_sighting(new.sighting_id) then
    raise exception 'Identification not allowed' using errcode='42501';
  end if;
  if state is distinct from 'needs_id' then raise exception 'Identification is closed' using errcode='42501'; end if;
  if exists(select 1 from public.sightings where id=new.sighting_id and user_id=auth.uid()) then
    raise exception 'The author cannot cast a community vote' using errcode='42501';
  end if;
  if exists(select 1 from public.user_skips where sighting_id=new.sighting_id and user_id=auth.uid()) then
    raise exception 'A skipped identification cannot be changed into a vote' using errcode='42501';
  end if;
  new.species_name_text := nullif(btrim(new.species_name_text),'');
  return new;
end; $$;
alter table public.identifications enable trigger a_guard_identification;

create or replace function private.guard_identification_skip() returns trigger
language plpgsql security definer set search_path='' as $$
declare state text;
begin
  select id_status into state from public.sightings where id=new.sighting_id for update;
  if not found or auth.uid() is null or new.user_id is distinct from auth.uid() or not private.can_access_sighting(new.sighting_id) then
    raise exception 'Skip not allowed' using errcode='42501';
  end if;
  if state is distinct from 'needs_id' then raise exception 'Identification is closed' using errcode='42501'; end if;
  if exists(select 1 from public.sightings where id=new.sighting_id and user_id=auth.uid()) then
    raise exception 'The author does not skip community identification' using errcode='42501';
  end if;
  if exists(select 1 from public.identifications where sighting_id=new.sighting_id and user_id=auth.uid()) then
    raise exception 'A committed vote cannot be changed into a skip' using errcode='42501';
  end if;
  return new;
end; $$;
drop trigger if exists a_guard_identification_skip on public.user_skips;
create trigger a_guard_identification_skip before insert on public.user_skips
for each row execute function private.guard_identification_skip();
revoke update,delete on public.identifications from authenticated;
drop policy if exists delete_own_identification on public.identifications;

create or replace function public.create_sighting(
 p_id uuid,p_photo text,p_latitude float8,p_longitude float8,p_found_date date,
 p_geoprivacy text default 'obscured',p_sensitive boolean default false,p_notes text default null,
 p_species_id uuid default null,p_species_text text default null
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_photo is null or split_part(p_photo,'/',1)<>auth.uid()::text
   or not exists(select 1 from storage.objects where bucket_id='sighting-photos' and name=p_photo) then
   raise exception 'Upload a photo first' using errcode='22023';
 end if;
 insert into public.sightings(id,user_id,photo_url,latitude,longitude,found_date,geoprivacy,reported_sensitive,notes,status,id_status,author_species_id,author_species_name_text)
 values(p_id,auth.uid(),p_photo,p_latitude,p_longitude,p_found_date,
   case when p_sensitive then 'obscured' else p_geoprivacy end,p_sensitive,nullif(btrim(p_notes),''),'pending','needs_id',
   p_species_id,case when p_species_id is null then nullif(btrim(p_species_text),'') end);
 return p_id;
end; $$;
