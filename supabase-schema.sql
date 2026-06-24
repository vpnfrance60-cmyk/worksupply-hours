-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create extension if not exists "pgcrypto";

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  contact_email text not null,
  created_at timestamptz default now()
);

create type log_status as enum ('pending', 'confirmed', 'disputed');

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null,
  worker_email text not null,
  client_id uuid references clients(id) not null,
  log_date date not null default current_date,
  hours_worked numeric not null,
  comment text,
  status log_status not null default 'pending',
  hours_confirmed numeric,
  client_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (worker_email, client_id, log_date)
);

create index idx_daily_logs_client_date on daily_logs(client_id, log_date);

-- Seed your real clients here (edit before running, or add later from Supabase Table Editor)
insert into clients (name, slug, contact_email) values
  ('Sample Construction Co', 'sample-construction', 'client@example.com');
