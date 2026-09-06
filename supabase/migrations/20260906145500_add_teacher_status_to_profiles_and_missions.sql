alter table public.issr_profiles
  add column if not exists teacher_status text;

alter table public.issr_profiles
  drop constraint if exists issr_profiles_teacher_status_check;

alter table public.issr_profiles
  add constraint issr_profiles_teacher_status_check
  check (teacher_status is null or teacher_status in (
    'first_degree_titular_replacement',
    'first_degree_trainee_replacement',
    'first_degree_contractual',
    'second_degree_tzr_titular',
    'second_degree_tzr_trainee',
    'second_degree_contractual_cdd',
    'second_degree_contractual_cdi'
  ));

alter table public.issr_missions
  drop constraint if exists issr_missions_teacher_replacement_status_check;

alter table public.issr_missions
  add constraint issr_missions_teacher_replacement_status_check
  check (teacher_replacement_status is null or teacher_replacement_status in (
    'first_degree_titular_replacement',
    'first_degree_trainee_replacement',
    'first_degree_contractual',
    'second_degree_tzr_titular',
    'second_degree_tzr_trainee',
    'second_degree_contractual_cdd',
    'second_degree_contractual_cdi'
  ));
