-- RLS already restricts catalogue writes to is_admin(); table grants were absent.
grant insert(scientific_name,common_name,family,is_sensitive) on public.species to authenticated;
