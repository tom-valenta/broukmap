begin;
create temporary table actors(name text primary key,id uuid default gen_random_uuid());
insert into actors(name) select 'u'||n from generate_series(0,9) n;
insert into actors(name) values('admin'),('moderator');
grant select on actors to anon,authenticated;
insert into auth.users(id,email,raw_user_meta_data) select id,id::text||'@example.invalid','{}'::jsonb from actors;
update public.profiles set role='admin' where id=(select id from actors where name='admin');
update public.profiles set role='moderator' where id=(select id from actors where name='moderator');
create temporary table fixtures(name text primary key,id uuid default gen_random_uuid());
insert into fixtures(name) values('text'),('canonical'),('disputed'),('deletion'),('editing'),('private'),('flagged'),('backdated'),('atomic'),('invalid');
grant select on fixtures to anon,authenticated;
create temporary table taxa(name text primary key,id uuid default gen_random_uuid());
insert into taxa(name) values('sensitive'),('ordinary');
grant select on taxa to anon,authenticated;
insert into public.species(id,scientific_name,is_sensitive) select id,'test_'||id::text,name='sensitive' from taxa;
create function pg_temp.check_it(value boolean,label text) returns void language plpgsql as $$ begin
 if value is distinct from true then raise exception 'FAILED: %',label; end if;
end; $$;
-- Metadata fixture only; no object bytes are uploaded, and the transaction rolls back.
insert into storage.objects(bucket_id,name,owner_id)
select 'sighting-photos',a.id::text||'/'||f.id::text||'.jpg',a.id::text from fixtures f cross join actors a where a.name='u0';
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='u0'),true);
select public.create_sighting(id,auth.uid()::text||'/'||id::text||'.jpg',50,14,
 case when name='backdated' then current_date-1 else current_date end,
 case when name='private' then 'private' when name in ('canonical','flagged') then 'open' else 'obscured' end,
 name='flagged',null,null,case when name in ('text','atomic') then '  Beetle A  ' else null end)
from fixtures where name<>'invalid';
select pg_temp.check_it((select count(*)=1 from public.identifications where sighting_id=(select id from fixtures where name='atomic')), 'atomic initial guess');
select pg_temp.check_it((select is_backdated from public.sightings where id=(select id from fixtures where name='backdated')), 'yesterday is backdated');
select pg_temp.check_it((select geoprivacy='obscured' and reported_sensitive from public.sightings where id=(select id from fixtures where name='flagged')), 'sensitive signal preserved');
select pg_temp.check_it((select latitude=50 and longitude=14 from public.public_sightings where id=(select id from fixtures where name='private')), 'author sees exact private location');
select pg_temp.check_it((select sighting_count=9 from public.profile_sighting_stats(auth.uid())), 'author stats include private');
do $$ begin
 begin
  perform public.create_sighting((select id from fixtures where name='invalid'),auth.uid()::text||'/'||(select id from fixtures where name='invalid')::text||'.jpg',50,14,current_date,'obscured',false,null,gen_random_uuid(),null);
  raise exception 'FAILED: invalid species accepted';
 exception when foreign_key_violation then null; end;
 perform pg_temp.check_it(not exists(select 1 from public.sightings where id=(select id from fixtures where name='invalid')), 'failed guess rolls sighting back');
end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='u1'),true);
select pg_temp.check_it((select count(*)=0 from public.identifications where sighting_id=(select id from fixtures where name='text')), 'blind rows hidden');
select pg_temp.check_it((select species_id is null and species_name_text is null from public.public_sightings where id=(select id from fixtures where name='text')), 'initial guess not leaked through view');
select pg_temp.check_it((select count(*)=0 from public.public_sightings where id=(select id from fixtures where name='private')), 'private absent from other queries');
select pg_temp.check_it((select count(*)=0 from public.help_verify where id=(select id from fixtures where name='private')), 'private absent from feed');
select pg_temp.check_it((select sighting_count=8 from public.profile_sighting_stats((select id from actors where name='u0'))), 'public stats exclude private');
select pg_temp.check_it((select latitude<>50 or longitude<>14 from public.public_sightings where id=(select id from fixtures where name='text')), 'obscured coordinates masked');
select pg_temp.check_it((select 6371008.8*2*asin(sqrt(power(sin(radians(latitude-50)/2),2)+cos(radians(50))*cos(radians(latitude))*power(sin(radians(longitude-14)/2),2)))<=100.01 from public.public_sightings where id=(select id from fixtures where name='text')), 'mask distance <=100m');
insert into public.user_skips(sighting_id,user_id) values((select id from fixtures where name='text'),auth.uid());
select pg_temp.check_it((select count(*)=1 from public.identifications where sighting_id=(select id from fixtures where name='text')), 'skip unlocks guesses');
select pg_temp.check_it((select count(*)=0 from public.help_verify where id=(select id from fixtures where name='text')), 'skip excludes feed');
insert into public.identifications(sighting_id,user_id,species_name_text) values((select id from fixtures where name='text'),auth.uid(),'beetle a');
select set_config('request.jwt.claim.sub',(select id::text from actors where name='u2'),true);
insert into public.identifications(sighting_id,user_id,species_name_text) values((select id from fixtures where name='text'),auth.uid(),'Beetle B');
select pg_temp.check_it((select id_status='confirmed' and species_id is null and species_name_text='beetle a' from public.public_sightings where id=(select id from fixtures where name='text')), 'text consensus 2/3 with case trim normalization');
do $$ begin
 begin
  update public.identifications set species_name_text='changed' where sighting_id=(select id from fixtures where name='text') and user_id=auth.uid();
  raise exception 'FAILED: confirmed update accepted';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.identifications where sighting_id=(select id from fixtures where name='text') and user_id=auth.uid();
  raise exception 'FAILED: confirmed delete accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='u3'),true);
do $$ begin
 begin
  insert into public.identifications(sighting_id,user_id,species_name_text) values((select id from fixtures where name='text'),auth.uid(),'new');
  raise exception 'FAILED: confirmed insert accepted';
 exception when insufficient_privilege then null; end;
end $$;
-- Canonical sensitive winner immediately protects initially open location.
do $$ declare n int; begin
 for n in 1..3 loop
  perform set_config('request.jwt.claim.sub',(select id::text from actors where name='u'||n),true);
  insert into public.identifications(sighting_id,user_id,species_id) values((select id from fixtures where name='canonical'),auth.uid(),(select id from taxa where name='sensitive'));
 end loop;
end $$;
select pg_temp.check_it((select id_status='confirmed' and geoprivacy='obscured' and species_id=(select id from taxa where name='sensitive') from public.public_sightings where id=(select id from fixtures where name='canonical')), 'sensitive canonical auto-escalation');
-- 8 votes without an intermediate 66% majority.
do $$ declare n int; begin
 for n in 1..8 loop
  perform set_config('request.jwt.claim.sub',(select id::text from actors where name='u'||n),true);
  insert into public.identifications(sighting_id,user_id,species_name_text) values((select id from fixtures where name='disputed'),auth.uid(),'choice '||(n%3));
 end loop;
end $$;
select pg_temp.check_it((select id_status='disputed' from public.public_sightings where id=(select id from fixtures where name='disputed')), '8 without majority disputed');
-- Update before closure, then delete producing a two-of-three majority.
do $$ declare n int; begin
 for n in 1..4 loop
  perform set_config('request.jwt.claim.sub',(select id::text from actors where name='u'||n),true);
  insert into public.identifications(sighting_id,user_id,species_name_text) values((select id from fixtures where name='deletion'),auth.uid(),case when n in(1,4) then 'A' when n=2 then 'B' else 'C' end);
 end loop;
 perform set_config('request.jwt.claim.sub',(select id::text from actors where name='u2'),true);
 update public.identifications set species_name_text='D' where sighting_id=(select id from fixtures where name='deletion') and user_id=auth.uid();
 delete from public.identifications where sighting_id=(select id from fixtures where name='deletion') and user_id=auth.uid();
end $$;
select pg_temp.check_it((select id_status='confirmed' and species_name_text='a' from public.public_sightings where id=(select id from fixtures where name='deletion')), 'delete recomputes consensus');
-- Likes remain usable after closure; they boost public help feed before closure.
insert into public.sighting_likes(sighting_id,user_id) select id,auth.uid() from fixtures where name in ('text','editing');
select pg_temp.check_it((select like_count=1 from public.help_verify where id=(select id from fixtures where name='editing')), 'feed exposes like count');
delete from public.sighting_likes where sighting_id=(select id from fixtures where name='text') and user_id=auth.uid();
select set_config('request.jwt.claim.sub',(select id::text from actors where name='u0'),true);
update public.sightings set notes='Notes after confirmation' where id=(select id from fixtures where name='text');
select pg_temp.check_it((select id_status='confirmed' and notes='Notes after confirmation' from public.sightings where id=(select id from fixtures where name='text')), 'notes do not reopen confirmation');
do $$ begin
 begin
  update public.sightings set id_status='needs_id' where id=(select id from fixtures where name='text');
  raise exception 'FAILED: author changed computed state';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',(select id::text from actors where name='moderator'),true);
select pg_temp.check_it((select count(*)=0 from public.sightings where id in(select id from fixtures)), 'moderator cannot read raw sightings');
select pg_temp.check_it((select count(*)=1 from public.moderator_private_sightings where id=(select id from fixtures where name='private')), 'moderator sees only private existence');
select pg_temp.check_it((select count(*)=0 from public.public_sightings where id=(select id from fixtures where name='private')), 'moderator sees no private payload');
select set_config('request.jwt.claim.sub',(select id::text from actors where name='admin'),true);
select public.resolve_sighting_species((select id from fixtures where name='text'),(select id from taxa where name='sensitive'));
select pg_temp.check_it((select species_id=(select id from taxa where name='sensitive') and geoprivacy='obscured' from public.sightings where id=(select id from fixtures where name='text')), 'admin pairing applies sensitivity');
select public.resolve_sighting_species((select id from fixtures where name='disputed'),null,'new_test_'||gen_random_uuid()::text,null,null,true);
select pg_temp.check_it((select id_status='confirmed' and species_id is not null from public.sightings where id=(select id from fixtures where name='disputed')), 'admin creates species and resolves disputed');
select public.moderate_sighting((select id from fixtures where name='text'),'delete');
select pg_temp.check_it((select count(*)=0 from public.identifications where sighting_id=(select id from fixtures where name='text')), 'confirmed cascade deletion works');
-- Today's date in the earliest time zone must not be rejected as UTC tomorrow.
insert into public.sightings(user_id,latitude,longitude,found_date,submission_timezone,notes)
values(auth.uid(),0,0,(current_timestamp at time zone 'Pacific/Kiritimati')::date,'Pacific/Kiritimati','timezone test');
select pg_temp.check_it((select not is_backdated from public.sightings where user_id=auth.uid() and notes='timezone test'), 'local today is accepted and not backdated');
reset role;
rollback;
select 'sighting consensus and geoprivacy tests passed; fixtures rolled back' result;
