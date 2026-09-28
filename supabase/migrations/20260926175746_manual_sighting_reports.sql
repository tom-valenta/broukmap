-- Extends the inspected schema. Reports NEVER change sightings automatically.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter table public.sightings drop constraint sightings_status_check;
alter table public.sightings add constraint sightings_status_check
  check (status in ('pending', 'approved', 'rejected', 'hidden'));

-- The base table contains exact coordinates. Keep its existing read policies;
-- this restrictive policy additionally protects hidden rows from all non-owners.
create policy hidden_sightings_author_admin_only on public.sightings
  as restrictive for all to anon, authenticated
  using (status <> 'hidden' or user_id = (select auth.uid()) or (select public.is_admin()))
  with check (status <> 'hidden' or user_id = (select auth.uid()) or (select public.is_admin()));

create function private.guard_sighting_moderation() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.status <> 'pending' then
        raise exception 'Only admins may moderate sightings' using errcode = '42501';
      end if;
    elsif new.status is distinct from old.status then
      raise exception 'Only admins may moderate sightings' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_sighting_moderation() from public;
create trigger guard_sighting_moderation before insert or update on public.sightings
  for each row execute function private.guard_sighting_moderation();

-- Preserve the existing view's columns and masking until the geoprivacy migration.
-- pending is public immediately; approved is retained for existing compatibility.
do $$
declare definition text;
begin
  select pg_get_viewdef('public.public_sightings'::regclass, true) into definition;
  if position('s.status = ''approved''::text' in definition) = 0 then
    raise exception 'Unexpected public_sightings definition; inspect before migration';
  end if;
  definition := replace(definition, 's.status = ''approved''::text',
    's.status in (''pending''::text, ''approved''::text)');
  execute 'create or replace view public.public_sightings with (security_barrier=true, security_invoker=false) as ' || definition;
end;
$$;

-- Internal visibility lookup: bypasses base-table RLS only to return a boolean,
-- never exact coordinates. Used by interactions and private photo access.
create function private.can_access_sighting(target_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sightings s where s.id = target_id and (
      (auth.uid() is not null and (s.user_id = auth.uid() or public.is_admin()))
      or (s.status in ('pending', 'approved') and s.geoprivacy in ('open', 'obscured'))
    )
  );
$$;
revoke all on function private.can_access_sighting(uuid) from public;
grant execute on function private.can_access_sighting(uuid) to anon, authenticated;

create policy identification_parent_visibility on public.identifications
  as restrictive for all to anon, authenticated
  using (private.can_access_sighting(sighting_id))
  with check (private.can_access_sighting(sighting_id));

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  sighting_id uuid not null references public.sightings(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  reason text not null check (length(btrim(reason)) > 0),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolution text check (resolution in ('dismissed', 'hidden')),
  constraint reports_review_consistent check (
    (reviewed_at is null and resolution is null and reviewed_by is null)
    or (reviewed_at is not null and resolution is not null)
  )
);
create index reports_sighting_id_idx on public.reports(sighting_id);
create index reports_user_id_idx on public.reports(user_id);
create index reports_reviewed_by_idx on public.reports(reviewed_by);
create index reports_pending_idx on public.reports(created_at) where reviewed_at is null;
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (sighting_id, user_id, reason) on public.reports to authenticated;
grant update (reviewed_at, reviewed_by, resolution) on public.reports to authenticated;
create policy reports_insert_own on public.reports for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_access_sighting(sighting_id)
    and reviewed_at is null and reviewed_by is null and resolution is null);
create policy reports_read_own_or_admin on public.reports for select to authenticated
  using ((select public.is_admin()) or (user_id = (select auth.uid()) and private.can_access_sighting(sighting_id)));
create policy reports_admin_review on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- No report INSERT triggers: counts never change status or consensus.
create view public.admin_report_queue with (security_invoker=true) as
select s.id as sighting_id, s.status, s.photo_url, s.found_date,
  count(*) as report_count, count(distinct r.user_id) as reporter_count,
  count(*) filter (where r.reviewed_at is null) as pending_count,
  count(distinct r.user_id) filter (where r.reviewed_at is null) as pending_reporter_count,
  min(r.created_at) filter (where r.reviewed_at is null) as oldest_pending_at
from public.sightings s join public.reports r on r.sighting_id=s.id
where (select public.is_admin())
group by s.id;
revoke all on public.admin_report_queue from public, anon;
grant select on public.admin_report_queue to authenticated;

-- The IDs are those actually reviewed in the UI. New concurrent reports stay open.
create function public.moderate_sighting(
  p_sighting_id uuid, p_action text, p_report_ids uuid[] default '{}'
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('dismiss', 'hide', 'delete') then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;
  perform 1 from public.sightings where id=p_sighting_id for update;
  if not found then raise exception 'Sighting not found' using errcode = 'P0002'; end if;
  if p_action='delete' then
    delete from public.sightings where id=p_sighting_id;
    return;
  end if;
  if p_action='hide' then
    update public.sightings set status='hidden' where id=p_sighting_id;
  end if;
  update public.reports set reviewed_at=now(), reviewed_by=auth.uid(),
    resolution=case when p_action='hide' then 'hidden' else 'dismissed' end
    where sighting_id=p_sighting_id and id=any(p_report_ids) and reviewed_at is null;
end;
$$;
revoke all on function public.moderate_sighting(uuid,text,uuid[]) from public, anon;
grant execute on function public.moderate_sighting(uuid,text,uuid[]) to authenticated;

-- Public Storage URLs bypass RLS, so private/hidden photo protection needs a
-- private bucket. No sighting photos existed when this migration was prepared.
update storage.buckets set public=false where id='sighting-photos';
drop policy public_read_sighting_photos on storage.objects;
create function private.can_read_sighting_photo(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sightings s
    where (s.photo_url=object_name or split_part(s.photo_url, '/sighting-photos/', 2)=object_name)
      and private.can_access_sighting(s.id)
  );
$$;
revoke all on function private.can_read_sighting_photo(text) from public;
grant execute on function private.can_read_sighting_photo(text) to anon, authenticated;
create policy read_accessible_sighting_photos on storage.objects for select to anon, authenticated
  using (bucket_id='sighting-photos' and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (select public.is_admin()) or private.can_read_sighting_photo(name)
  ));
