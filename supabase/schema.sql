-- 7Tech member directory — database schema and access rules.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Access model
--   * Everyone logs in with an email code / magic link (Supabase Auth).
--   * A logged-in person is identified by the email in their login token.
--   * Only APPROVED members can see the directory and the jobs board.
--   * Anyone logged in may create ONE profile for their own email; it starts as 'pending'
--     until an admin approves it. Profiles imported from the old sheet are already 'approved'.
--   * Members edit only their own profile. Only admins change status / admin flag / email.

-- ───────────────────────── Tables ─────────────────────────

create table public.members (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique
                     check (email = lower(trim(email)) and email like '%_@_%'),
  full_name        text not null check (length(trim(full_name)) > 0),
  -- Digits only, international format without '+', e.g. 972501234567 (used for wa.me links).
  phone            text check (phone ~ '^[0-9]{8,15}$'),
  linkedin_url     text check (linkedin_url ~* '^https://([a-z]{2,3}\.)?linkedin\.com/'),
  course           text,             -- cohort as members write it: 115, נג, 132-ח …
  company          text,
  job_title        text,
  field            text check (field in ('backend', 'frontend', 'fullstack', 'mobile', 'devops', 'data', 'qa',
                     'security', 'hardware', 'product', 'design', 'project', 'it', 'sales', 'marketing', 'hr',
                     'finance', 'management', 'other')),
  seniority        text check (seniority in ('student', 'junior', 'mid', 'senior', 'lead', 'manager',
                     'director', 'executive')),
  location         text,
  education        text,
  bio              text check (length(bio) <= 2000),
  seeking          text check (length(seeking) <= 500),
  skills           text[] not null default '{}',
  offers           text[] not null default '{}'
                     check (offers <@ array['referrals', 'questions', 'cv_review', 'mock_interview', 'mentoring']),
  contact_prefs    text[] not null default '{}'
                     check (contact_prefs <@ array['whatsapp', 'phone', 'email', 'linkedin']),
  looking_for_job  boolean not null default false,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'removed')),
  is_admin         boolean not null default false,
  created_at       timestamptz not null default now(),
  -- Last time the member themselves saved or confirmed their profile (drives "updated N months ago").
  -- NULL = imported from the old sheet and not confirmed by the member yet.
  updated_at       timestamptz default now()
);

create table public.jobs (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  company     text not null check (length(trim(company)) > 0),
  title       text not null check (length(trim(title)) > 0),
  url         text check (url ~* '^https?://'),
  details     text check (length(details) <= 1000),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days',
  check (expires_at <= created_at + interval '90 days')
);

create index jobs_expires_at_idx on public.jobs (expires_at);

-- ───────────────────────── Helper functions ─────────────────────────
-- SECURITY DEFINER so policies can look up the caller's own row without recursing into RLS.

create function public.current_email() returns text
language sql stable
as $$ select lower(auth.jwt() ->> 'email') $$;

create function public.is_approved_member() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.members where email = public.current_email() and status = 'approved')
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.members
                 where email = public.current_email() and status = 'approved' and is_admin)
$$;

create function public.my_member_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.members where email = public.current_email() and status = 'approved'
$$;

-- Protect admin-only columns and keep updated_at meaningful.
-- current_user is 'authenticated' for app users; SQL Editor / service role bypass the check.
create function public.members_before_update() returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated'
     and not public.is_admin()
     and (new.status     is distinct from old.status
       or new.is_admin   is distinct from old.is_admin
       or new.email      is distinct from old.email
       or new.id         is distinct from old.id
       or new.created_at is distinct from old.created_at) then
    raise exception 'Only admins can change status, admin flag, email or id';
  end if;

  if current_user = 'authenticated' then
    if old.email = public.current_email() then
      new.updated_at := now();          -- the member saved/confirmed their own profile
    else
      new.updated_at := old.updated_at; -- admin edits do not count as "fresh"
    end if;
  end if;
  return new;
end
$$;

create trigger members_before_update
before update on public.members
for each row execute function public.members_before_update();

-- ───────────────────────── Row Level Security ─────────────────────────

alter table public.members enable row level security;
alter table public.jobs    enable row level security;

revoke all on public.members, public.jobs from anon;
grant select, insert, update, delete on public.members, public.jobs to authenticated;

create policy members_select on public.members for select to authenticated
using (
  (status = 'approved' and public.is_approved_member())
  or email = public.current_email()
  or public.is_admin()
);

create policy members_insert on public.members for insert to authenticated
with check (
  (email = public.current_email() and status = 'pending' and not is_admin)
  or public.is_admin()
);

create policy members_update on public.members for update to authenticated
using      (email = public.current_email() or public.is_admin())
with check (email = public.current_email() or public.is_admin());

create policy members_delete on public.members for delete to authenticated
using (email = public.current_email() or public.is_admin());

create policy jobs_select on public.jobs for select to authenticated
using (public.is_approved_member() and expires_at > now());

create policy jobs_insert on public.jobs for insert to authenticated
with check (member_id = public.my_member_id());

create policy jobs_update on public.jobs for update to authenticated
using      (member_id = public.my_member_id() or public.is_admin())
with check (member_id = public.my_member_id() or public.is_admin());

create policy jobs_delete on public.jobs for delete to authenticated
using (member_id = public.my_member_id() or public.is_admin());
