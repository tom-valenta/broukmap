alter table private.species_catalog_imports
  add column id bigint generated always as identity primary key;

drop function public.register_inaturalist_species(bigint,text,text,text,text);

create function private.register_inaturalist_species(
  p_taxon_id bigint,
  p_scientific_name text,
  p_common_name text default null,
  p_family text default null,
  p_rank text default 'species'
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  caller uuid := auth.uid();
  chosen uuid;
  clean_scientific text := btrim(p_scientific_name);
  clean_common text := nullif(btrim(p_common_name),'');
  clean_family text := nullif(btrim(p_family),'');
begin
  if caller is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_taxon_id is null or p_taxon_id <= 0
    or length(clean_scientific) not between 3 and 200
    or clean_scientific !~ '^[[:alpha:]×][[:alpha:]× .''-]+$'
    or coalesce(length(clean_common),0) > 200
    or coalesce(length(clean_family),0) > 120
    or p_rank not in ('species','subspecies','hybrid') then
    raise exception 'Invalid catalogue taxon' using errcode='22023';
  end if;

  perform pg_advisory_xact_lock(p_taxon_id);
  select id into chosen from public.species where inaturalist_taxon_id=p_taxon_id;
  if chosen is not null then return chosen; end if;

  if (select count(*) from private.species_catalog_imports
      where user_id=caller and created_at > now()-interval '24 hours') >= 50 then
    raise exception 'Daily catalogue limit reached' using errcode='54000';
  end if;

  select id into chosen from public.species
    where lower(scientific_name)=lower(clean_scientific)
    limit 1 for update;
  if chosen is not null then
    update public.species set
      inaturalist_taxon_id=p_taxon_id,
      taxon_rank=coalesce(taxon_rank,p_rank),
      common_name=coalesce(common_name,clean_common),
      family=coalesce(family,clean_family)
    where id=chosen and inaturalist_taxon_id is null;
  else
    insert into public.species(scientific_name,common_name,family,is_sensitive,inaturalist_taxon_id,taxon_rank)
    values(clean_scientific,clean_common,clean_family,false,p_taxon_id,p_rank)
    returning id into chosen;
  end if;

  insert into private.species_catalog_imports(user_id,inaturalist_taxon_id)
  values(caller,p_taxon_id);
  return chosen;
end;
$$;
revoke all on function private.register_inaturalist_species(bigint,text,text,text,text) from public,anon;
grant execute on function private.register_inaturalist_species(bigint,text,text,text,text) to authenticated;

create function public.register_inaturalist_species(
  p_taxon_id bigint,
  p_scientific_name text,
  p_common_name text default null,
  p_family text default null,
  p_rank text default 'species'
) returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.register_inaturalist_species(
    p_taxon_id,p_scientific_name,p_common_name,p_family,p_rank
  );
$$;
revoke all on function public.register_inaturalist_species(bigint,text,text,text,text) from public,anon;
grant execute on function public.register_inaturalist_species(bigint,text,text,text,text) to authenticated;
