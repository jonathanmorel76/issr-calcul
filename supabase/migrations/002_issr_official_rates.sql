create table if not exists public.issr_rate_schedules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  valid_from date not null,
  valid_to date,
  brackets jsonb not null,
  extra_20km numeric(10,2) not null,
  source_name text not null default 'Légifrance',
  source_url text not null,
  source_nor text,
  source_jorf text,
  source_text_id text,
  published_at date,
  verified_at timestamptz not null default now(),
  is_official boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint issr_rate_validity check (valid_to is null or valid_to >= valid_from),
  constraint issr_rate_brackets_array check (jsonb_typeof(brackets) = 'array')
);
alter table public.issr_rate_schedules enable row level security;
revoke all on table public.issr_rate_schedules from anon, authenticated;
grant select on table public.issr_rate_schedules to authenticated;
create policy "issr_rates_authenticated_read" on public.issr_rate_schedules for select to authenticated using (true);
alter table public.issr_entries
  add column if not exists rate_schedule_id uuid references public.issr_rate_schedules(id) on delete restrict,
  add column if not exists rate_code text,
  add column if not exists rate_source_url text;
create index if not exists issr_rate_schedules_validity_idx on public.issr_rate_schedules(valid_from desc, valid_to);
create index if not exists issr_entries_rate_schedule_idx on public.issr_entries(rate_schedule_id);

insert into public.issr_rate_schedules
(code,title,valid_from,valid_to,brackets,extra_20km,source_name,source_url,source_nor,source_jorf,source_text_id,published_at,is_official)
values
('ISSR-2022','Barème ISSR – arrêté du 27 août 2022','2022-01-01',null,
 '[{"min":0,"max":9.999999,"amount":15.94},{"min":10,"max":19.999999,"amount":21.04},{"min":20,"max":29.999999,"amount":26.16},{"min":30,"max":39.999999,"amount":30.87},{"min":40,"max":49.999999,"amount":36.86},{"min":50,"max":59.999999,"amount":42.89},{"min":60,"max":80,"amount":49.24}]'::jsonb,
 7.34,'Légifrance','https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046221499','MENH2220470A','JORF n°0199 du 28 août 2022','JORFTEXT000046221499','2022-08-28',true),
('ISSR-2026-TEMP','Majoration temporaire ISSR – arrêté du 26 juin 2026','2026-06-01','2026-12-31',
 '[{"min":0,"max":9.999999,"amount":16.45},{"min":10,"max":19.999999,"amount":21.71},{"min":20,"max":29.999999,"amount":27.00},{"min":30,"max":39.999999,"amount":31.86},{"min":40,"max":49.999999,"amount":38.04},{"min":50,"max":59.999999,"amount":44.26},{"min":60,"max":80,"amount":50.82}]'::jsonb,
 7.57,'Légifrance','https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054392892','MENF2614671A','JORF n°0157 du 7 juillet 2026','JORFTEXT000054392892','2026-07-07',true)
on conflict (code) do update set
 title=excluded.title,valid_from=excluded.valid_from,valid_to=excluded.valid_to,brackets=excluded.brackets,extra_20km=excluded.extra_20km,
 source_name=excluded.source_name,source_url=excluded.source_url,source_nor=excluded.source_nor,source_jorf=excluded.source_jorf,
 source_text_id=excluded.source_text_id,published_at=excluded.published_at,verified_at=now(),is_official=excluded.is_official,updated_at=now();
