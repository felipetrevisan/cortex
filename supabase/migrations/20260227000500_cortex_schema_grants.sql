-- Grants para acesso via PostgREST no schema cortex (RLS continua como camada de segurança)

create schema if not exists cortex;

grant usage on schema cortex to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema cortex to authenticated, service_role;
grant select on all tables in schema cortex to anon;

grant usage, select on all sequences in schema cortex to authenticated, service_role;
grant usage, select on all sequences in schema cortex to anon;

alter default privileges in schema cortex
grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema cortex
grant select on tables to anon;

alter default privileges in schema cortex
grant usage, select on sequences to authenticated, service_role;

alter default privileges in schema cortex
grant usage, select on sequences to anon;

alter default privileges in schema cortex
grant execute on functions to anon, authenticated, service_role;
