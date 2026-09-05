alter table public.issr_entries
  add column if not exists mission_id uuid references public.issr_missions(id) on delete set null;

alter table public.issr_entries
  add column if not exists generated_by_mission boolean not null default false;

create index if not exists issr_entries_mission_id_idx
  on public.issr_entries(mission_id);

create unique index if not exists issr_entries_mission_day_uidx
  on public.issr_entries(mission_id, travel_date)
  where mission_id is not null;
