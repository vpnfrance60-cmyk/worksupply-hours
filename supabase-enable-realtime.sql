-- ONE-TIME — paste in Supabase SQL Editor and Run.
-- Turns on live updates: the client dashboard refreshes the instant a worker
-- submits/edits hours, without needing to reload the page.
-- Safe to re-run (skips quietly if already enabled).

do $$
begin
  alter publication supabase_realtime add table public.daily_logs;
exception
  when duplicate_object then
    null; -- already enabled, nothing to do
end $$;
