begin;
create temporary table gallery_actors(id uuid default gen_random_uuid(), name text);
insert into gallery_actors(name) values('owner'),('other');
insert into auth.users(id,email,raw_user_meta_data) select id,id::text||'@example.invalid','{}'::jsonb from gallery_actors;
create temporary table gallery_posts(id uuid default gen_random_uuid(), name text);
insert into gallery_posts(name) values('open'),('private'),('invalid');
grant select on gallery_actors,gallery_posts to anon,authenticated;
insert into storage.objects(bucket_id,name,owner_id)
select 'sighting-photos',a.id::text||'/gallery-'||n||'.jpg',a.id::text from gallery_actors a cross join generate_series(1,7) n;
create function pg_temp.check_gallery(ok boolean,label text) returns void language plpgsql as $$ begin
 if ok is distinct from true then raise exception 'FAILED: %',label; end if;
end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from gallery_actors where name='owner'),true);
select public.create_sighting_with_photos(id,array[auth.uid()::text||'/gallery-1.jpg',auth.uid()::text||'/gallery-2.jpg'],50,14,current_date,
 case when name='private' then 'private' else 'open' end) from gallery_posts where name<>'invalid';
select pg_temp.check_gallery((select count(*)=2 from public.sighting_photo_sets),'owner sees both galleries');
update public.sighting_photo_sets set paths=array[paths[2],paths[1]] where sighting_id=(select id from gallery_posts where name='open');
select pg_temp.check_gallery((select paths[1]=auth.uid()::text||'/gallery-2.jpg' from public.sighting_photo_sets where sighting_id=(select id from gallery_posts where name='open')),'reorder persists');
do $$ begin
 begin
  perform public.create_sighting_with_photos((select id from gallery_posts where name='invalid'),array(select auth.uid()::text||'/gallery-'||n||'.jpg' from generate_series(1,7) n),50,14,current_date);
  raise exception 'FAILED: seventh photo accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.create_sighting_with_photos((select id from gallery_posts where name='invalid'),array[auth.uid()::text||'/gallery-1.jpg',auth.uid()::text||'/missing.jpg'],50,14,current_date);
  raise exception 'FAILED: missing photo accepted';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.create_sighting_with_photos((select id from gallery_posts where name='invalid'),array[auth.uid()::text||'/gallery-1.jpg',(select id::text from gallery_actors where name='other')||'/gallery-2.jpg'],50,14,current_date);
  raise exception 'FAILED: foreign photo accepted';
 exception when invalid_parameter_value then null; end;
 begin
  update public.sighting_photo_sets set paths=array[paths[1],paths[1]] where sighting_id=(select id from gallery_posts where name='open');
  raise exception 'FAILED: duplicate accepted';
 exception when invalid_parameter_value then null; end;
 begin
  update public.sighting_photo_sets set paths=array[paths[1]] where sighting_id=(select id from gallery_posts where name='open');
  raise exception 'FAILED: membership changed';
 exception when insufficient_privilege then null; end;
 perform pg_temp.check_gallery(not exists(select 1 from public.sightings where id=(select id from gallery_posts where name='invalid')),'failed upload is atomic');
end; $$;
select set_config('request.jwt.claim.sub',(select id::text from gallery_actors where name='other'),true);
select pg_temp.check_gallery((select count(*)=1 from public.sighting_photo_sets),'private gallery hidden from others');
with changed as (update public.sighting_photo_sets set paths=array[paths[2],paths[1]] returning *) select pg_temp.check_gallery((select count(*)=0 from changed),'other cannot reorder');
insert into public.sighting_likes(sighting_id,user_id) values((select id from gallery_posts where name='open'),auth.uid());
select pg_temp.check_gallery((select count(*)=1 from public.sighting_likes where sighting_id=(select id from gallery_posts where name='open')),'one like per post');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.check_gallery((select count(*)=1 from public.sighting_photo_sets),'anonymous sees only public gallery');
select pg_temp.check_gallery(private.can_read_sighting_photo((select id::text from gallery_actors where name='owner')||'/gallery-2.jpg'),'additional photo can be read');
reset role;
update public.sightings set status='hidden' where id=(select id from gallery_posts where name='open');
set local role anon;
select pg_temp.check_gallery((select count(*)=0 from public.sighting_photo_sets),'hidden and private galleries inaccessible');
select pg_temp.check_gallery(not private.can_read_sighting_photo((select id::text from gallery_actors where name='owner')||'/gallery-2.jpg'),'hidden photo bytes denied');
reset role;
delete from public.sightings where id in (select id from gallery_posts);
select pg_temp.check_gallery((select count(*)=0 from public.sighting_photo_sets where sighting_id in (select id from gallery_posts)),'gallery cascades on deletion');
rollback;
