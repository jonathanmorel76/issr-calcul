create extension if not exists pgcrypto;

create table if not exists public.issr_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  origine text not null,
  destination text not null,
  km numeric(8,1) not null check (km >= 0),
  is_rep boolean not null default false,
  is_rep_plus boolean not null default false,
  indem_km numeric(10,2) not null,
  prime_rep numeric(10,2) not null default 0,
  prime_rep_plus numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  distance_source text not null default 'osrm' check (distance_source in ('osrm','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.issr_entries enable row level security;

grant select, insert, update, delete on table public.issr_entries to authenticated;

create policy "issr_select_own" on public.issr_entries for select to authenticated
using ((select auth.uid()) = user_id);
create policy "issr_insert_own" on public.issr_entries for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "issr_update_own" on public.issr_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "issr_delete_own" on public.issr_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create index if not exists issr_entries_user_date_idx on public.issr_entries(user_id, date desc);
