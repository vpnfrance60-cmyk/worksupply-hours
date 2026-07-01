-- =====================================================================
-- TEST MIGRATION — remove the 18:00–24:00 submission window
--
-- Lets workers submit their hours at ANY time of day (for testing).
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Safe & non-destructive: this only replaces the submit_today_hours()
-- function. It does NOT touch any tables or log data.
--
-- To restore the window later, re-add the guard:
--   if paris_hour() < 18 then
--     raise exception 'Submission opens at 18:00 (Europe/Paris)';
--   end if;
-- =====================================================================

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

  -- TEST: submission window removed — no paris_hour() check.

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
