alter table public.issr_profiles
  add column if not exists teaching_start_date date;

alter table public.issr_profiles
  drop constraint if exists issr_profiles_teaching_start_date_check;

alter table public.issr_profiles
  add constraint issr_profiles_teaching_start_date_check
  check (teaching_start_date is null or teaching_start_date <= current_date);
