create function public.profile_sighting_stats(p_user_id uuid)
returns table(sighting_count bigint,species_count bigint,confirmed_count bigint,backdated_count bigint)
language sql stable security invoker set search_path='' as $$
 select count(*), count(distinct case when id_status='confirmed' then coalesce(species_id::text,lower(btrim(species_name_text))) end),
 count(*) filter(where id_status='confirmed'), count(*) filter(where is_backdated)
 from public.public_sightings where user_id=p_user_id;
$$;
revoke all on function public.profile_sighting_stats(uuid) from public;
grant execute on function public.profile_sighting_stats(uuid) to anon,authenticated;
