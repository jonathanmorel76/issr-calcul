create table if not exists public.issr_establishments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  is_rep boolean not null default false,
  is_rep_plus boolean not null default false,
  usual_distance_km numeric(8,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issr_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  establishment_id uuid references public.issr_establishments(id) on delete set null,
  title text,
  start_date date not null,
  end_date date not null,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint issr_missions_dates_check check (end_date >= start_date)
);

alter table public.issr_establishments enable row level security;
alter table public.issr_missions enable row level security;

revoke all on public.issr_establishments from anon;
revoke all on public.issr_missions from anon;
grant select, insert, update, delete on public.issr_establishments to authenticated;
grant select, insert, update, delete on public.issr_missions to authenticated;

drop policy if exists "Users manage own establishments" on public.issr_establishments;
create policy "Users manage own establishments" on public.issr_establishments
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own missions" on public.issr_missions;
create policy "Users manage own missions" on public.issr_missions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists issr_establishments_user_id_idx on public.issr_establishments(user_id);
create index if not exists issr_missions_user_dates_idx on public.issr_missions(user_id,start_date,end_date);
create index if not exists issr_missions_establishment_id_idx on public.issr_missions(establishment_id);
