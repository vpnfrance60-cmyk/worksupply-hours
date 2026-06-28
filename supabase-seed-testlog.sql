-- OPTIONAL — demo only. Inserts one "today" log for John so you can watch the
-- client confirm/refuse loop without waiting for the 18:00 submission window.
-- (Direct insert in the SQL editor bypasses the window check on purpose.)
-- Safe to delete the row afterwards.

insert into daily_logs (worker_id, client_id, log_date, hours_worked, night_hours, worker_comment, status)
values (
  (select id from workers where worker_code = 'WS-1024'),
  (select id from clients where slug = 'elsa-le-azalea'),
  paris_today(),
  8, 2, 'Collected 40 crates', 'pending'
)
on conflict (worker_id, log_date) do update
  set hours_worked = excluded.hours_worked,
      night_hours  = excluded.night_hours,
      status       = 'pending';
