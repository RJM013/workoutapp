-- Phase 3 GZCLP Schema Additions
-- Adds day_structure, rounding, T3 increment, etc.

-- Profiles: day_structure, current_day, custom_exercises; update rest_timer_t2 default to 120
alter table public.profiles
  add column if not exists day_structure jsonb,
  add column if not exists current_day text check (current_day in ('A1', 'B1', 'A2', 'B2')),
  add column if not exists custom_exercises jsonb default '[]'::jsonb;

-- Set default day_structure for new profiles (Phase 3 default)
update public.profiles
set day_structure = '{"A1":{"t1":"Smith Squat","t2":"Bench Press"},"B1":{"t1":"Dumbbell OHP","t2":"Leg Press"},"A2":{"t1":"Bench Press","t2":"Smith Squat"},"B2":{"t1":"Leg Press","t2":"Dumbbell OHP"}}'::jsonb
where day_structure is null;

-- Migrate existing users: map old MAIN_LIFTS to day_structure
update public.profiles p
set day_structure = '{"A1":{"t1":"Squat","t2":"Bench Press"},"B1":{"t1":"OHP","t2":"Deadlift"},"A2":{"t1":"Bench Press","t2":"Squat"},"B2":{"t1":"Deadlift","t2":"OHP"}}'::jsonb
where day_structure is null
  and setup_complete = true
  and exists (select 1 from public.lift_state ls where ls.user_id = p.id and ls.lift_name = 'Squat');

-- Lift state: add rounding (default 5 for legacy)
alter table public.lift_state
  add column if not exists rounding numeric not null default 5;

-- T3 state: add increment, is_bodyweight, track_duration
alter table public.t3_state
  add column if not exists increment numeric not null default 5,
  add column if not exists is_bodyweight boolean default false,
  add column if not exists track_duration boolean default false;

-- Note: rest_timer_t2 default remains 150 for existing; new app defaults use 120 in DEFAULT_PROFILE
