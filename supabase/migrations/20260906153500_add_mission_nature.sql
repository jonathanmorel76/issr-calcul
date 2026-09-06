alter table public.issr_missions add column if not exists mission_nature text;

alter table public.issr_missions drop constraint if exists issr_missions_mission_nature_check;
alter table public.issr_missions add constraint issr_missions_mission_nature_check check (
  mission_nature is null or mission_nature in (
    'teacher_absence',
    'headteacher_release',
    'part_time_complement',
    'trainer_release',
    'training_or_support_release',
    'annual_fractionated_service',
    'other'
  )
);
