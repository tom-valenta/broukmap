alter table public.sightings add column submission_timezone text not null default 'UTC';
alter table public.sightings drop constraint sightings_found_date_range;
alter table public.sightings add constraint sightings_found_date_range check (
 found_date >= '1900-01-01'::date and found_date <= (current_timestamp at time zone submission_timezone)::date
);
create or replace function public.set_is_backdated() returns trigger
language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.submission_timezone) then
   raise exception 'Invalid time zone' using errcode='22023';
 end if;
 if tg_op='INSERT' or new.found_date is distinct from old.found_date then
   new.is_backdated := new.found_date < (current_timestamp at time zone new.submission_timezone)::date;
 end if;
 return new;
end; $$;
drop function public.create_sighting(uuid,text,float8,float8,date,text,boolean,text,uuid,text);
create function public.create_sighting(
 p_id uuid,p_photo text,p_latitude float8,p_longitude float8,p_found_date date,
 p_geoprivacy text default 'obscured',p_sensitive boolean default false,p_notes text default null,
 p_species_id uuid default null,p_species_text text default null,p_timezone text default 'UTC'
) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_photo is null or split_part(p_photo,'/',1)<>auth.uid()::text
   or not exists(select 1 from storage.objects where bucket_id='sighting-photos' and name=p_photo) then
   raise exception 'Upload a photo first' using errcode='22023';
 end if;
 insert into public.sightings(id,user_id,photo_url,latitude,longitude,found_date,geoprivacy,reported_sensitive,notes,status,id_status,submission_timezone)
 values(p_id,auth.uid(),p_photo,p_latitude,p_longitude,p_found_date,
   case when p_sensitive then 'obscured' else p_geoprivacy end,p_sensitive,nullif(btrim(p_notes),''),'pending','needs_id',p_timezone);
 if p_species_id is not null or nullif(btrim(p_species_text),'') is not null then
   insert into public.identifications(sighting_id,user_id,species_id,species_name_text)
   values(p_id,auth.uid(),p_species_id,nullif(btrim(p_species_text),''));
 end if;
 return p_id;
end; $$;
revoke all on function public.create_sighting(uuid,text,float8,float8,date,text,boolean,text,uuid,text,text) from public,anon;
grant execute on function public.create_sighting(uuid,text,float8,float8,date,text,boolean,text,uuid,text,text) to authenticated;
