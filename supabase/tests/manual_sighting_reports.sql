-- Run as postgres against the extended existing schema. All fixtures roll back.
begin;
create temporary table actors (name text primary key, id uuid default gen_random_uuid());
insert into actors(name) values ('author'), ('reporter1'), ('reporter2'), ('reporter3'), ('moderator'), ('admin');
grant select on actors to anon, authenticated;
insert into auth.users(id, email, raw_user_meta_data)
  select id, id::text || '@example.invalid', '{}'::jsonb from actors;
update public.profiles set role='admin' where id=(select id from actors where name='admin');
update public.profiles set role='moderator' where id=(select id from actors where name='moderator');
create temporary table fixtures (name text primary key, id uuid default gen_random_uuid());
insert into fixtures(name) values ('reported'), ('unreported');
grant select on fixtures to anon, authenticated;
create function pg_temp.assert_true(value boolean, label text) returns void
language plpgsql as $$ begin
  if value is distinct from true then raise exception 'FAILED: %', label; end if;
end; $$;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='author'),true);
insert into public.sightings(id,user_id,latitude,longitude,found_date,photo_url)
select f.id, auth.uid(), 50, 14, current_date, auth.uid()::text || '/' || f.id::text || '.jpg' from fixtures f;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_true((select count(*)=2 from public.public_sightings where id in (select id from fixtures)), 'pending visible immediately');
do $$ begin
  begin
    perform pg_temp.assert_true((select count(*)=0 from public.sightings where id in (select id from fixtures)), 'exact base table not public');
  exception when insufficient_privilege then null; end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='reporter1'),true);
insert into public.reports(sighting_id,user_id,reason)
select (select id from fixtures where name='reported'),auth.uid(),'First reporter, reason '||n from generate_series(1,5) n;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='reporter2'),true);
insert into public.reports(sighting_id,user_id,reason)
select (select id from fixtures where name='reported'),auth.uid(),'Second reporter, reason '||n from generate_series(1,5) n;
select pg_temp.assert_true((select count(*)=0 from public.admin_report_queue), 'regular user cannot read queue');
do $$ begin
  begin
    perform public.moderate_sighting((select id from fixtures where name='reported'),'hide');
    raise exception 'FAILED: regular user moderation accepted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub',(select id::text from actors where name='admin'),true);
select pg_temp.assert_true((select report_count=10 and reporter_count=2 and pending_count=10
  from public.admin_report_queue where sighting_id=(select id from fixtures where name='reported')), '10 reports from 2 people distinguished');
reset role;
create temporary table reviewed_snapshot as select id from public.reports where sighting_id=(select id from fixtures where name='reported');
grant select on reviewed_snapshot to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='reporter3'),true);
insert into public.reports(sighting_id,user_id,reason)
values ((select id from fixtures where name='reported'),auth.uid(),'Arrived after admin opened page');
select set_config('request.jwt.claim.sub',(select id::text from actors where name='admin'),true);
select pg_temp.assert_true((select status='pending' from public.sightings where id=(select id from fixtures where name='reported')), '3 distinct reporters never hide automatically');
select public.moderate_sighting((select id from fixtures where name='reported'),'dismiss',array(select id from reviewed_snapshot));
select pg_temp.assert_true((select status='pending' from public.sightings where id=(select id from fixtures where name='reported')), 'dismissal preserves sighting status');
select pg_temp.assert_true((select report_count=11 and reporter_count=3 and pending_count=1
  from public.admin_report_queue where sighting_id=(select id from fixtures where name='reported')), 'new report remains open, totals retained');
select public.moderate_sighting((select id from fixtures where name='reported'),'hide');
select pg_temp.assert_true((select status='hidden' from public.sightings where id=(select id from fixtures where name='reported')), 'admin hides explicitly');

select set_config('request.jwt.claim.sub',(select id::text from actors where name='reporter3'),true);
select pg_temp.assert_true((select count(*)=0 from public.public_sightings where id=(select id from fixtures where name='reported')), 'hidden absent from public view');
select pg_temp.assert_true((select count(*)=0 from public.reports where sighting_id=(select id from fixtures where name='reported')), 'hidden inaccessible through reports');
select pg_temp.assert_true(not private.can_access_sighting((select id from fixtures where name='reported')), 'hidden inaccessible to third party');
select pg_temp.assert_true(not private.can_read_sighting_photo((select id::text from actors where name='author') || '/' || (select id::text from fixtures where name='reported') || '.jpg'), 'hidden photo inaccessible');
do $$ begin
  begin
    insert into public.reports(sighting_id,user_id,reason) values ((select id from fixtures where name='reported'),auth.uid(),'Blocked');
    raise exception 'FAILED: hidden sighting report accepted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='moderator'),true);
select pg_temp.assert_true((select count(*)=0 from public.sightings where id=(select id from fixtures where name='reported')), 'hidden inaccessible to moderator');
select set_config('request.jwt.claim.sub',(select id::text from actors where name='author'),true);
select pg_temp.assert_true((select count(*)=1 from public.sightings where id=(select id from fixtures where name='reported')), 'author retains hidden history');
do $$ begin
  begin
    update public.sightings set status='pending' where id=(select id from fixtures where name='reported');
    raise exception 'FAILED: author could unhide';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='admin'),true);
select public.moderate_sighting((select id from fixtures where name='unreported'),'hide');
select pg_temp.assert_true((select status='hidden' from public.sightings where id=(select id from fixtures where name='unreported')), 'admin can hide without reports');
select public.moderate_sighting((select id from fixtures where name='reported'),'delete');
select pg_temp.assert_true((select count(*)=0 from public.reports where sighting_id=(select id from fixtures where name='reported')), 'permanent delete cascades reports');
select pg_temp.assert_true((select count(*)=0 from public.sightings where id=(select id from fixtures where name='reported')), 'permanent delete removes sighting');
reset role;
rollback;
select 'manual moderation tests passed; all fixtures rolled back' as result;
