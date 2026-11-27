-- Access-rule tests for schema.sql. Run with scripts/test_db.sh (needs a local Postgres).
-- Every check raises an exception on failure, so the script stops at the first broken rule.
\set ON_ERROR_STOP 1
\o /dev/null

-- Seed data as the database owner (like the SQL Editor / import script would).
insert into public.members (email, full_name, phone, company, status, is_admin, updated_at) values
  ('admin@x.com',   'Admin',   '972500000001', 'Wix',    'approved', true,  '2020-01-01'),
  ('alice@x.com',   'Alice',   '972500000002', 'Google', 'approved', false, '2020-01-01'),
  ('bob@x.com',     'Bob',     '972500000003', 'Intel',  'approved', false, '2020-01-01'),
  ('pending@x.com', 'Pending', null,           null,     'pending',  false, '2020-01-01'),
  ('removed@x.com', 'Removed', null,           null,     'removed',  false, '2020-01-01'),
  ('carol@x.com',   'Carol',   null,           'Elbit',  'approved', false, null);

create function pg_temp.login(p_email text) returns void
language sql as $$ select set_config('request.jwt.claims', json_build_object('email', p_email)::text, false) $$;

create function pg_temp.check(ok boolean, what text) returns void
language plpgsql as $$ begin if not ok then raise exception 'FAILED: %', what; end if; end $$;

create function pg_temp.expect_error(stmt text, what text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED (no error): %', what;
exception when others then
  if sqlerrm like 'FAILED (no error)%' then raise; end if;
end $$;

grant execute on all functions in schema pg_temp to authenticated;

-- ── Approved member ──
select pg_temp.login('alice@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.members) = 4, 'approved member sees exactly the 4 approved members');
select pg_temp.check(not exists (select 1 from public.members where status <> 'approved'), 'approved member never sees pending/removed');

update public.members set company = 'Meta' where email = 'alice@x.com';
select pg_temp.check((select company from public.members where email = 'alice@x.com') = 'Meta', 'member edits own profile');
select pg_temp.check((select updated_at from public.members where email = 'alice@x.com') > now() - interval '1 minute', 'own edit refreshes updated_at');

update public.members set company = 'Hacked' where email = 'bob@x.com';
select pg_temp.check((select company from public.members where email = 'bob@x.com') = 'Intel', 'member cannot edit someone else');
select pg_temp.expect_error($$update public.members set is_admin = true where email = 'alice@x.com'$$, 'member cannot make self admin');
select pg_temp.expect_error($$update public.members set email = 'other@x.com' where email = 'alice@x.com'$$, 'member cannot change own email');

delete from public.members where email = 'bob@x.com';
select pg_temp.check(exists (select 1 from public.members where email = 'bob@x.com'), 'member cannot delete someone else');

insert into public.jobs (member_id, company, title) values (public.my_member_id(), 'Meta', 'Backend Engineer');
select pg_temp.check((select count(*) from public.jobs) = 1, 'member posts and sees a job');
select pg_temp.expect_error(
  $$insert into public.jobs (member_id, company, title) select id, 'Intel', 'Fake' from public.members where email = 'bob@x.com'$$,
  'member cannot post a job as someone else');
reset role;

-- ── Pending applicant ──
select pg_temp.login('pending@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.members) = 1, 'pending user sees only their own row');
select pg_temp.check((select count(*) from public.jobs) = 0, 'pending user sees no jobs');
select pg_temp.expect_error($$update public.members set status = 'approved' where email = 'pending@x.com'$$, 'pending user cannot self-approve');
reset role;

-- ── Brand new login (no profile yet) ──
select pg_temp.login('new@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.members) = 0, 'unknown user sees nobody');
insert into public.members (email, full_name) values ('new@x.com', 'Newbie');
select pg_temp.check((select status from public.members where email = 'new@x.com') = 'pending', 'join request starts pending');
select pg_temp.expect_error($$insert into public.members (email, full_name, status) values ('new2@x.com', 'X', 'pending')$$, 'cannot create a profile for another email');
select pg_temp.expect_error($$insert into public.members (email, full_name, status) values ('new@x.com', 'X', 'approved')$$, 'cannot self-insert as approved');
reset role;

-- ── Removed member ──
select pg_temp.login('removed@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.members) = 1, 'removed member sees only own row');
reset role;

-- ── Admin ──
select pg_temp.login('admin@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.members) = 7, 'admin sees everyone including pending/removed');
update public.members set status = 'approved' where email = 'new@x.com';
select pg_temp.check((select status from public.members where email = 'new@x.com') = 'approved', 'admin approves a join request');
update public.members set company = 'Fixed typo' where email = 'bob@x.com';
select pg_temp.check((select updated_at from public.members where email = 'bob@x.com') = '2020-01-01', 'admin edit does not refresh someone else''s updated_at');
update public.members set company = 'Elbit Systems' where email = 'carol@x.com';
select pg_temp.check((select updated_at from public.members where email = 'carol@x.com') is null, 'admin edit keeps an imported profile unconfirmed');
reset role;

-- ── Imported profile confirmed by its owner ──
select pg_temp.login('carol@x.com');
set role authenticated;
update public.members set full_name = full_name where email = 'carol@x.com';
select pg_temp.check((select updated_at from public.members where email = 'carol@x.com') is not null, 'owner confirming an imported profile dates it');
reset role;

-- ── Anonymous (not logged in) ──
select set_config('request.jwt.claims', '', false);
set role anon;
select pg_temp.expect_error($$select * from public.members$$, 'anonymous visitors cannot read members');
reset role;

-- ── Expired jobs are hidden ──
update public.jobs set created_at = now() - interval '40 days', expires_at = now() - interval '10 days';
select pg_temp.login('alice@x.com');
set role authenticated;
select pg_temp.check((select count(*) from public.jobs) = 0, 'expired jobs are hidden');
reset role;

\echo 'ALL RLS TESTS PASSED'
