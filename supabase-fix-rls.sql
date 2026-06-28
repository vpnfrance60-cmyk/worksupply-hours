-- ONE-TIME FIX — paste in Supabase SQL Editor and Run.
-- Fixes the workers↔clients RLS infinite recursion (the 500 error on login).
-- Does NOT drop any tables or data.

create or replace function current_worker_client_id() returns uuid
  language sql stable security definer set search_path = public
  as $$ select client_id from workers where user_id = auth.uid() $$;

drop policy if exists clients_select on clients;
drop policy if exists workers_select on workers;
drop policy if exists logs_select on daily_logs;

create policy clients_select on clients for select to authenticated using (
  user_id = auth.uid() or id = current_worker_client_id()
);

create policy workers_select on workers for select to authenticated using (
  user_id = auth.uid() or client_id = current_client_id()
);

create policy logs_select on daily_logs for select to authenticated using (
  worker_id = current_worker_id() or client_id = current_client_id()
);
