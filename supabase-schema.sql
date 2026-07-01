-- =====================================================================
-- WorkSupply Hours — full schema  (REPLACES the previous version)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Business rules enforced HERE (not just in the UI, so they can't be
-- bypassed by editing client-side code):
--   • One log row per worker per day (unique worker_id + log_date).
--   • A worker can only submit "today" (Europe/Paris).
--     TEST: the 18:00–24:00 submission window has been removed.
--   • Only the client a worker is assigned to can confirm/refuse + comment.
--   • Nothing is ever deleted → full history kept for payment/reporting,
--     even though the UI only shows a rolling 7-day window.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ── Reset (safe to re-run) ───────────────────────────────────────────
drop function if exists submit_today_hours(numeric, text) cascade;
drop function if exists submit_today_hours(numeric, numeric, text) cascade;
drop function if exists review_day(uuid, boolean, text) cascade;
drop table if exists daily_logs cascade;
drop table if exists workers cascade;
drop table if exists clients cascade;
drop type if exists log_status cascade;

create type log_status as enum ('pending', 'confirmed', 'refused');

-- ── Clients ──────────────────────────────────────────────────────────
-- user_id links a client to their Supabase Auth login.
create table clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  contact_email text,
  hourly_rate  numeric(8,2) not null default 0,   -- base €/h; +25%/+50% apply on top
  user_id      uuid unique references auth.users(id) on delete set null,
  created_at   timestamptz default now()
);

-- ── Workers (each belongs to exactly ONE client) ─────────────────────
-- worker_code is the public-facing "ID" the worker types to log in.
create table workers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  worker_code text unique not null,
  client_id   uuid not null references clients(id) on delete cascade,
  user_id     uuid unique references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);
create index idx_workers_client on workers(client_id);

-- ── Daily logs (one row per worker per day) ──────────────────────────
create table daily_logs (
  id             uuid primary key default gen_random_uuid(),
  worker_id      uuid not null references workers(id) on delete cascade,
  client_id      uuid not null references clients(id) on delete cascade,
  log_date       date not null,
  hours_worked   numeric(4,1) not null check (hours_worked >= 0 and hours_worked <= 24),
  night_hours    numeric(4,1) not null default 0   -- portion worked after 18:00 (gets +25%)
                   check (night_hours >= 0 and night_hours <= hours_worked),
  worker_comment text,
  status         log_status not null default 'pending',
  client_comment text,
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz,
  unique (worker_id, log_date)
);
create index idx_logs_client_date on daily_logs(client_id, log_date);
create index idx_logs_worker_date on daily_logs(worker_id, log_date);

-- ── Time helpers (Europe/Paris business clock) ───────────────────────
create or replace function paris_today() returns date
  language sql stable as $$ select (now() at time zone 'Europe/Paris')::date $$;

create or replace function paris_hour() returns int
  language sql stable as $$ select extract(hour from (now() at time zone 'Europe/Paris'))::int $$;

-- ── Identity helpers ─────────────────────────────────────────────────
create or replace function current_worker_id() returns uuid
  language sql stable security definer set search_path = public
  as $$ select id from workers where user_id = auth.uid() $$;

create or replace function current_client_id() returns uuid
  language sql stable security definer set search_path = public
  as $$ select id from clients where user_id = auth.uid() $$;

-- the client a worker is assigned to (SECURITY DEFINER → bypasses RLS,
-- which is what breaks the workers↔clients policy recursion)
create or replace function current_worker_client_id() returns uuid
  language sql stable security definer set search_path = public
  as $$ select client_id from workers where user_id = auth.uid() $$;

-- =====================================================================
-- WRITE PATHS — only these two functions can write daily_logs.
-- They run as SECURITY DEFINER (bypass RLS) but enforce every rule.
-- =====================================================================

-- Worker submits / re-submits TODAY's hours.
-- TEST: submission window disabled — hours can be submitted any time of day.
-- p_night = the portion of p_hours worked after 18:00 (gets the +25%).
create or replace function submit_today_hours(p_hours numeric, p_night numeric default 0, p_comment text default null)
returns daily_logs
language plpgsql security definer set search_path = public as $$
declare
  v_worker workers;
  v_today  date := paris_today();
  v_row    daily_logs;
begin
  select * into v_worker from workers where user_id = auth.uid();
  if v_worker.id is null then
    raise exception 'Not a worker account';
  end if;

  if p_night > p_hours then
    raise exception 'Night hours cannot exceed total hours';
  end if;

  insert into daily_logs (worker_id, client_id, log_date, hours_worked, night_hours, worker_comment, status)
  values (v_worker.id, v_worker.client_id, v_today, p_hours, coalesce(p_night, 0), p_comment, 'pending')
  on conflict (worker_id, log_date) do update
    set hours_worked   = excluded.hours_worked,
        night_hours    = excluded.night_hours,
        worker_comment = excluded.worker_comment,
        status         = 'pending',   -- re-submitting clears any prior review
        client_comment = null,
        reviewed_at    = null,
        submitted_at   = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- Client confirms (true) or refuses (false) a single day, with optional remark.
create or replace function review_day(p_log_id uuid, p_confirmed boolean, p_comment text default null)
returns daily_logs
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid := current_client_id();
  v_row       daily_logs;
begin
  if v_client_id is null then
    raise exception 'Not a client account';
  end if;

  update daily_logs
     set status         = case when p_confirmed then 'confirmed'::log_status else 'refused'::log_status end,
         client_comment = p_comment,
         reviewed_at    = now()
   where id = p_log_id
     and client_id = v_client_id        -- can ONLY review own workers' logs
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Log not found or not assigned to you';
  end if;

  return v_row;
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY — reads only. (No insert/update policies = direct
-- writes are blocked; the SECURITY DEFINER functions above are the only
-- way to write, and they enforce ownership + the time window.)
-- =====================================================================
alter table clients    enable row level security;
alter table workers    enable row level security;
alter table daily_logs enable row level security;

-- NOTE: these use the SECURITY DEFINER helpers above, NOT inline subqueries,
-- so a policy on one table never re-triggers the policy on the other
-- (that would be infinite recursion → 500 from PostgREST).
create policy clients_select on clients for select to authenticated using (
  user_id = auth.uid() or id = current_worker_client_id()
);

create policy workers_select on workers for select to authenticated using (
  user_id = auth.uid() or client_id = current_client_id()
);

create policy logs_select on daily_logs for select to authenticated using (
  worker_id = current_worker_id() or client_id = current_client_id()
);

grant execute on function submit_today_hours(numeric, numeric, text) to authenticated;
grant execute on function review_day(uuid, boolean, text)            to authenticated;

-- =====================================================================
-- SEED — example. Create the Auth users FIRST (see SETUP-SUPABASE.md),
-- then paste their user UUIDs below.
-- =====================================================================
-- insert into clients (name, slug, contact_email, hourly_rate, user_id) values
--   ('Elsa le Azalea', 'elsa-le-azalea', 'elsa@example.com', 12.50, '<CLIENT_AUTH_UUID>');
--
-- insert into workers (name, worker_code, client_id, user_id) values
--   ('John Doe', 'WS-1024',
--    (select id from clients where slug = 'elsa-le-azalea'),
--    '<WORKER_AUTH_UUID>');
