-- Existing tables and profile policies are deliberately preserved.
drop trigger trg_identifications_consensus on public.identifications;
alter table public.sightings drop constraint sightings_geoprivacy_check;
alter table public.sightings drop constraint sightings_id_status_check;
update public.sightings set geoprivacy='private' where geoprivacy='hidden';
update public.sightings set id_status=case when id_status in ('community_confirmed','expert_confirmed') then 'confirmed' else 'needs_id' end;
alter table public.sightings add constraint sightings_geoprivacy_check check (geoprivacy in ('open','obscured','private'));
alter table public.sightings add constraint sightings_id_status_check check (id_status in ('needs_id','confirmed','disputed'));
alter table public.sightings alter column geoprivacy set default 'obscured';
alter table public.sightings add column reported_sensitive boolean not null default false;
alter table public.sightings add column public_latitude double precision;
alter table public.sightings add column public_longitude double precision;
create index sightings_user_id_idx on public.sightings(user_id);
create index sightings_species_id_idx on public.sightings(species_id);
create index sightings_feed_idx on public.sightings(id_status,created_at) where status in ('pending','approved') and geoprivacy <> 'private';
create index identifications_user_id_idx on public.identifications(user_id);
create index identifications_species_id_idx on public.identifications(species_id);

create table public.user_skips (
  sighting_id uuid not null references public.sightings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(sighting_id,user_id)
);
create table public.sighting_likes (
  sighting_id uuid not null references public.sightings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(sighting_id,user_id)
);
create index user_skips_user_id_idx on public.user_skips(user_id);
create index sighting_likes_user_id_idx on public.sighting_likes(user_id);
alter table public.user_skips enable row level security;
alter table public.sighting_likes enable row level security;
revoke all on public.user_skips, public.sighting_likes from anon,authenticated;
grant select on public.user_skips, public.sighting_likes to authenticated;
grant insert(sighting_id,user_id) on public.user_skips, public.sighting_likes to authenticated;
grant delete on public.sighting_likes to authenticated;
create policy skips_read on public.user_skips for select to authenticated
  using (user_id=(select auth.uid()) and private.can_access_sighting(sighting_id));
create policy skips_insert on public.user_skips for insert to authenticated
  with check (user_id=(select auth.uid()) and private.can_access_sighting(sighting_id));
create policy likes_read on public.sighting_likes for select to authenticated
  using (private.can_access_sighting(sighting_id));
create policy likes_insert on public.sighting_likes for insert to authenticated
  with check (user_id=(select auth.uid()) and private.can_access_sighting(sighting_id));
create policy likes_delete on public.sighting_likes for delete to authenticated
  using (user_id=(select auth.uid()) and private.can_access_sighting(sighting_id));

-- Replace only the audited sighting policies, never profile role protections.
drop policy "moderator vidi vsechny nalezy" on public.sightings;
drop policy "moderator_can_update_any_sighting" on public.sightings;
drop policy "vlastnik muze upravit neschvaleny nalez" on public.sightings;
drop policy "vlastnik nebo moderator muze smazat nalez" on public.sightings;
create policy admin_reads_sightings on public.sightings for select to authenticated using ((select public.is_admin()));
create policy owner_admin_updates on public.sightings for update to authenticated
  using (user_id=(select auth.uid()) or (select public.is_admin()))
  with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy owner_admin_deletes on public.sightings for delete to authenticated
  using (user_id=(select auth.uid()) or (select public.is_admin()));

create or replace function public.set_is_backdated() returns trigger
language plpgsql set search_path='' as $$ begin
  new.is_backdated := new.found_date < current_date;
  return new;
end; $$;

-- Only the owner may edit notes; all moderation/resolution fields are protected.
-- Internal definer triggers run as the table owner to write computed fields.
create function private.guard_sighting_fields() returns trigger
language plpgsql security invoker set search_path='' as $$ begin
  if current_user in ('anon','authenticated') and not public.is_admin() then
    if tg_op='INSERT' then
      if new.user_id is distinct from auth.uid() or new.id_status<>'needs_id'
        or new.species_id is not null or new.species_name_text is not null
        or new.rejection_reason is not null or new.status<>'pending' then
        raise exception 'Invalid initial sighting fields' using errcode='42501';
      end if;
    elsif (to_jsonb(new)-'notes') is distinct from (to_jsonb(old)-'notes') then
      raise exception 'Only notes may be edited by the author' using errcode='42501';
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.guard_sighting_fields() from public;
create trigger a_guard_sighting_fields before insert or update on public.sightings
  for each row execute function private.guard_sighting_fields();

-- Great-circle destination, uniform disk with radius <=100m, generated only once.
create function private.protect_sighting_location() returns trigger
language plpgsql security invoker set search_path='' as $$
declare bearing float8; distance float8; lat1 float8; lon1 float8; lat2 float8; lon2 float8;
begin
  if (new.reported_sensitive or (new.id_status='confirmed' and exists(
    select 1 from public.species where id=new.species_id and is_sensitive))) and new.geoprivacy='open' then
    new.geoprivacy := 'obscured';
  end if;
  if tg_op='INSERT' or new.public_latitude is null or new.public_longitude is null
     or new.latitude is distinct from old.latitude or new.longitude is distinct from old.longitude then
    bearing := random()*2*pi(); distance := sqrt(random())*100.0/6371008.8;
    lat1 := radians(new.latitude); lon1 := radians(new.longitude);
    lat2 := asin(sin(lat1)*cos(distance)+cos(lat1)*sin(distance)*cos(bearing));
    lon2 := lon1+atan2(sin(bearing)*sin(distance)*cos(lat1),cos(distance)-sin(lat1)*sin(lat2));
    new.public_latitude := degrees(lat2);
    new.public_longitude := degrees(lon2)-360*floor((degrees(lon2)+180)/360);
  end if;
  return new;
end; $$;
revoke all on function private.protect_sighting_location() from public;
create trigger b_protect_sighting_location before insert or update on public.sightings
  for each row execute function private.protect_sighting_location();
update public.sightings set latitude=latitude;
alter table public.sightings alter column public_latitude set not null;
alter table public.sightings alter column public_longitude set not null;

create function private.identifications_unlocked(target_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select private.can_access_sighting(target_id) and exists (
    select 1 from public.sightings s where s.id=target_id and (
      s.id_status<>'needs_id' or (auth.uid() is not null and (
        exists(select 1 from public.identifications i where i.sighting_id=s.id and i.user_id=auth.uid())
        or exists(select 1 from public.user_skips k where k.sighting_id=s.id and k.user_id=auth.uid())
      ))
    )
  );
$$;
revoke all on function private.identifications_unlocked(uuid) from public;
grant execute on function private.identifications_unlocked(uuid) to anon,authenticated;
drop policy identifications_visibility_read on public.identifications;
drop policy "vlastnik nebo moderator muze smazat navrh" on public.identifications;
create policy blind_identification_read on public.identifications for select to anon,authenticated
  using (private.identifications_unlocked(sighting_id));
create policy delete_own_identification on public.identifications for delete to authenticated
  using (user_id=(select auth.uid()));
alter table public.identifications alter column sighting_id set not null;
alter table public.identifications alter column user_id set not null;
alter table public.identifications drop constraint identifications_species_or_text_check;
alter table public.identifications add constraint identifications_species_or_text_check
  check (species_id is not null or nullif(btrim(species_name_text),'') is not null);

create function private.guard_identification() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid; state text; owner uuid;
begin
  target := case when tg_op='DELETE' then old.sighting_id else new.sighting_id end;
  owner := case when tg_op='DELETE' then old.user_id else new.user_id end;
  -- Serialize BEFORE writes, not just during recomputation. The next SQL command
  -- after the lock receives a fresh READ COMMITTED snapshot.
  select id_status into state from public.sightings where id=target for update;
  if not found and tg_op='DELETE' then return old; end if; -- parent cascade
  if auth.uid() is null or owner is distinct from auth.uid() or not private.can_access_sighting(target) then
    raise exception 'Identification not allowed' using errcode='42501';
  end if;
  if state is distinct from 'needs_id' then
    raise exception 'Identification is closed' using errcode='42501';
  end if;
  if tg_op='UPDATE' and (new.sighting_id<>old.sighting_id or new.user_id<>old.user_id or new.id<>old.id or new.created_at is distinct from old.created_at) then
    raise exception 'Identification ownership is immutable' using errcode='42501';
  end if;
  if tg_op='DELETE' then return old; end if;
  new.species_name_text := nullif(btrim(new.species_name_text),'');
  return new;
end; $$;
revoke all on function private.guard_identification() from public;
create trigger a_guard_identification before insert or update or delete on public.identifications
  for each row execute function private.guard_identification();

create or replace function public.recompute_identification_consensus() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid; total bigint; winner record;
begin
  target := case when tg_op='DELETE' then old.sighting_id else new.sighting_id end;
  perform 1 from public.sightings where id=target and id_status='needs_id' for update;
  if not found then return null; end if;
  select count(*) into total from public.identifications where sighting_id=target;
  select species_id, case when species_id is null then lower(btrim(species_name_text)) end as name, count(*) as votes
    into winner from public.identifications where sighting_id=target
    group by species_id, case when species_id is null then lower(btrim(species_name_text)) end
    order by count(*) desc, species_id nulls last, name limit 1;
  if total>=3 and winner.votes::numeric/total >= 0.66 then
    update public.sightings set id_status='confirmed',species_id=winner.species_id,
      species_name_text=case when winner.species_id is null then winner.name else null end where id=target;
  elsif total>=8 then
    update public.sightings set id_status='disputed' where id=target;
  end if;
  return null;
end; $$;
revoke all on function public.recompute_identification_consensus() from public,anon,authenticated;
create trigger trg_identifications_consensus after insert or update or delete on public.identifications
  for each row execute function public.recompute_identification_consensus();

-- The public view runs as caller; only this private projection has elevated reads.
-- It cannot return true obscured coordinates, even when filtered by a caller.
create function private.visible_sightings() returns table (
 id uuid,photo_url text,found_date date,created_at timestamptz,species_id uuid,species_name_text text,
 status text,country_code varchar,geoprivacy text,individual_count int,life_stage text,is_backdated boolean,id_status text,
 common_name text,scientific_name text,family text,is_sensitive boolean,notes text,location_precision text,
 latitude float8,longitude float8,poster_username public.citext,user_id uuid,reported_sensitive boolean,like_count bigint
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
 p.username,s.user_id,s.reported_sensitive,(select count(*) from public.sighting_likes l where l.sighting_id=s.id)
from public.sightings s left join public.species sp on sp.id=s.species_id left join public.profiles p on p.id=s.user_id
where (s.status in ('pending','approved') and s.geoprivacy<>'private')
 or (auth.uid() is not null and (s.user_id=auth.uid() or public.is_admin()));
$$;
revoke all on function private.visible_sightings() from public;
grant execute on function private.visible_sightings() to anon,authenticated;
create or replace view public.public_sightings with (security_invoker=true,security_barrier=true)
as select id,photo_url,found_date,created_at,species_id,species_name_text,status,country_code::varchar(2),
 geoprivacy,individual_count,life_stage,is_backdated,id_status,common_name,scientific_name,family,is_sensitive,
 notes,location_precision,latitude,longitude,poster_username,user_id,reported_sensitive,like_count
 from private.visible_sightings();
grant select on public.public_sightings to anon,authenticated;

create view public.help_verify with (security_invoker=true) as
select s.* from public.public_sightings s where s.id_status='needs_id'
 and s.status in ('pending','approved') and s.geoprivacy<>'private'
 and not exists(select 1 from public.user_skips k where k.sighting_id=s.id and k.user_id=(select auth.uid()))
 and not exists(select 1 from public.identifications i where i.sighting_id=s.id and i.user_id=(select auth.uid()));
grant select on public.help_verify to authenticated;
revoke all on public.help_verify from anon;

-- Moderators may discover only the ID of a private, non-hidden sighting.
create function private.moderator_private_ids() returns table(id uuid)
language sql stable security definer set search_path='' as $$
 select s.id from public.sightings s where auth.uid() is not null and public.is_moderator_or_admin()
 and s.geoprivacy='private' and s.status in ('pending','approved');
$$;
revoke all on function private.moderator_private_ids() from public;
grant execute on function private.moderator_private_ids() to authenticated;
create view public.moderator_private_sightings with (security_invoker=true) as select * from private.moderator_private_ids();
grant select on public.moderator_private_sightings to authenticated;

-- Both rows are created in one transaction, under the caller's RLS permissions.
create function public.create_sighting(
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
 insert into public.sightings(id,user_id,photo_url,latitude,longitude,found_date,geoprivacy,reported_sensitive,notes,status,id_status)
 values(p_id,auth.uid(),p_photo,p_latitude,p_longitude,p_found_date,
   case when p_sensitive then 'obscured' else p_geoprivacy end,p_sensitive,nullif(btrim(p_notes),''),'pending','needs_id');
 if p_species_id is not null or nullif(btrim(p_species_text),'') is not null then
   insert into public.identifications(sighting_id,user_id,species_id,species_name_text)
   values(p_id,auth.uid(),p_species_id,nullif(btrim(p_species_text),''));
 end if;
 return p_id;
end; $$;
revoke all on function public.create_sighting(uuid,text,float8,float8,date,text,boolean,text,uuid,text) from public,anon;
grant execute on function public.create_sighting(uuid,text,float8,float8,date,text,boolean,text,uuid,text) to authenticated;

-- Admin pairing and disputed resolution, including optional species creation.
create function public.resolve_sighting_species(
 p_sighting_id uuid,p_species_id uuid default null,p_scientific_name text default null,
 p_common_name text default null,p_family text default null,p_sensitive boolean default false
) returns void language plpgsql security invoker set search_path='' as $$
declare chosen uuid; state text;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select id_status into state from public.sightings where id=p_sighting_id for update;
 if state is null or state not in ('confirmed','disputed') then raise exception 'Sighting is not ready for resolution'; end if;
 chosen:=p_species_id;
 if chosen is null then
   if nullif(btrim(p_scientific_name),'') is null then raise exception 'Scientific name required'; end if;
   insert into public.species(scientific_name,common_name,family,is_sensitive)
   values(btrim(p_scientific_name),nullif(btrim(p_common_name),''),nullif(btrim(p_family),''),p_sensitive)
   returning id into chosen;
 end if;
 update public.sightings set species_id=chosen,id_status='confirmed' where id=p_sighting_id;
end; $$;
revoke all on function public.resolve_sighting_species(uuid,uuid,text,text,text,boolean) from public,anon;
grant execute on function public.resolve_sighting_species(uuid,uuid,text,text,text,boolean) to authenticated;

-- Changing sensitivity in the catalogue also protects already resolved sightings.
create function private.protect_newly_sensitive_species() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if new.is_sensitive then
   update public.sightings set geoprivacy='obscured' where species_id=new.id and id_status='confirmed' and geoprivacy='open';
 end if;
 return new;
end; $$;
revoke all on function private.protect_newly_sensitive_species() from public;
create trigger protect_sensitive_species after update of is_sensitive on public.species
 for each row execute function private.protect_newly_sensitive_species();
