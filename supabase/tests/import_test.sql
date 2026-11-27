-- Loads the importer's output, simulates later activity, re-imports, and checks the result.
-- scripts/test_db.sh generates :import_file from supabase/tests/fixtures/sheet_sample.csv (with --lenient).
\set ON_ERROR_STOP 1
\o /dev/null
\i :import_file

create function pg_temp.check(ok boolean, what text) returns void
language plpgsql as $$ begin if not ok then raise exception 'FAILED: %', what; end if; end $$;

select pg_temp.check((select count(*) from public.members where email like '%@example.com') = 3, 'three valid rows imported, row without email skipped');
select pg_temp.check((select bool_and(updated_at is null and status = 'approved') from public.members where email like '%@example.com'), 'imported profiles are approved and unconfirmed');
select pg_temp.check((select linkedin_url from public.members where email = 'yoni@example.com') = 'https://il.linkedin.com/in/yoni-test', 'google redirect unwrapped');
select pg_temp.check((select linkedin_url from public.members where email = 'dana.example@example.com') = 'https://www.linkedin.com/in/dana-example', 'tracking parameters removed');
select pg_temp.check((select company from public.members where email = 'yoni@example.com') is null, '"-" means no company');
select pg_temp.check((select contact_prefs from public.members where email = 'dana.example@example.com') = array['email', 'whatsapp'], 'contact preferences parsed');
select pg_temp.check((select course from public.members where email = 'yoni@example.com') = '53', 'Hebrew-numeral course converted (נג = 53)');
select pg_temp.check((select course from public.members where email = 'avi@example.com') = '132-ח', 'other course text kept as written');

-- Later: an admin is appointed and Dana confirms her profile in the app.
update public.members set is_admin = true where email = 'avi@example.com';
update public.members set company = 'Dana''s Startup', updated_at = now() where email = 'dana.example@example.com';
\i :import_file
select pg_temp.check((select is_admin from public.members where email = 'avi@example.com'), 're-import keeps the admin flag');
select pg_temp.check((select company from public.members where email = 'dana.example@example.com') = 'Dana''s Startup', 're-import never overwrites a profile the member confirmed');
\echo 'ALL IMPORT TESTS PASSED'
