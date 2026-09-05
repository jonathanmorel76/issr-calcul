create table if not exists public.issr_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','success','error')),
  checked_jo integer not null default 0,
  checked_texts integer not null default 0,
  candidates integer not null default 0,
  upserted integer not null default 0,
  error_message text,
  details jsonb not null default '{}'::jsonb
);

alter table public.issr_sync_runs enable row level security;
revoke all on table public.issr_sync_runs from anon, authenticated;
grant select, insert, update on table public.issr_sync_runs to service_role;

create index if not exists issr_sync_runs_started_idx
  on public.issr_sync_runs (started_at desc);

create table if not exists public.issr_sync_seen_texts (
  source_text_id text primary key,
  parser_version integer not null,
  contains_issr boolean not null default false,
  checked_at timestamptz not null default now()
);

alter table public.issr_sync_seen_texts enable row level security;
revoke all on table public.issr_sync_seen_texts from anon, authenticated;
grant select, insert, update on table public.issr_sync_seen_texts to service_role;

create index if not exists issr_sync_seen_checked_idx
  on public.issr_sync_seen_texts (checked_at desc);
