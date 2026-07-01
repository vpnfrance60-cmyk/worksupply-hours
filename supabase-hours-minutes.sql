-- =====================================================================
-- MIGRATION — store hours with minute precision
--
-- Workers can now enter hours AND minutes manually (e.g. 7 h 15 min).
-- Minutes are stored as decimal hours (7.25), which needs 2 decimal places
-- instead of 1. Widen the two hour columns from numeric(4,1) to numeric(5,2).
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe & non-destructive: existing values (already at 1 dp) are unchanged.
-- =====================================================================

alter table daily_logs
  alter column hours_worked type numeric(5,2),
  alter column night_hours  type numeric(5,2);
