-- Minimal stand-ins for what a Supabase project already provides,
-- so schema.sql can be tested on a plain local Postgres. NOT for use on Supabase.
create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth, public to anon, authenticated;

-- Same implementation Supabase uses: claims come from the request.jwt.claims setting.
create function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
