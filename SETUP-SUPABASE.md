# WorkSupply Hours — Supabase setup

## 1. Run the schema
Supabase Dashboard → **SQL Editor** → New query → paste all of
[`supabase-schema.sql`](./supabase-schema.sql) → **Run**.
(Safe to re-run — it drops and recreates everything. ⚠️ that also wipes log data.)

## 2. Env vars
`.env.local` must have (you already have these):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3. Create the two test accounts (no code — just a form + one paste)

You create the **login** in a form, then paste **one block** that links it to a
table row by email (so you never have to copy a UUID).

### Step A — create the two Auth logins (Dashboard form)
Dashboard → **Authentication → Users → Add user**, twice:

| | Email to type | Password | Auto Confirm |
|---|---|---|---|
| **Client** | `elsa@example.com` | (your choice, e.g. `elsa1234`) | ✅ on |
| **Worker** | `ws-1024@workers.worksupply.local` | (your choice, e.g. `john1234`) | ✅ on |

> The worker's email **must** be `<their ID, lowercased>@workers.worksupply.local`.
> Worker ID `WS-1024` → email `ws-1024@workers.worksupply.local`.

### Step B — link them to table rows (paste in SQL Editor, Run once)
```sql
insert into clients (name, slug, contact_email, hourly_rate, user_id)
values ('Elsa le Azalea', 'elsa-le-azalea', 'elsa@example.com', 12.50,
        (select id from auth.users where email = 'elsa@example.com'));

insert into workers (name, worker_code, client_id, user_id)
values ('John Doe', 'WS-1024',
        (select id from clients where slug = 'elsa-le-azalea'),
        (select id from auth.users where email = 'ws-1024@workers.worksupply.local'));
```

Done. Logins:
- **Worker** → ID `WS-1024` + the worker password
- **Client** → email `elsa@example.com` + the client password

Each worker is permanently tied to one client; a client only ever sees/confirms
their own workers' logs.

## How each of your rules is enforced
| Rule | Where |
|---|---|
| One entry per day, only "today" | `submit_today_hours()` always writes `log_date = paris_today()`; unique `(worker_id, log_date)` |
| Window 18:00–24:00 (Paris) | `submit_today_hours()` rejects if `paris_hour() < 18` (server clock, can't be faked) |
| Only the client confirms/refuses + comment | `review_day()` checks `client_id = current_client_id()`; no direct UPDATE allowed by RLS |
| Worker sees confirmed/refused | `status` column read back per day |
| Yesterday's hours shown on the new day | `getYesterdayLog()` |
| 7-day rolling view, full history kept | UI queries last 7 days; rows are never deleted |
| Each worker → one client | `workers.client_id` FK, set at creation |
