-- GZCLP Workout Tracker - Normalized Supabase Schema
-- Replaces user_data JSON blob with clear, defined tables
--
-- NOTE: This drops user_data. Existing data in user_data will be lost.
-- For data migration, export from old app first, then import after migration.

-- Drop legacy user_data table
drop table if exists public.user_data;

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  units text not null default 'lbs' check (units in ('lbs', 'kg')),
  t3_exercises jsonb not null default '{"A1":[],"B1":[],"A2":[],"B2":[]}'::jsonb,
  rest_timer_t1 int not null default 180,
  rest_timer_t2 int not null default 150,
  rest_timer_t3 int not null default 75,
  setup_complete boolean not null default false,
  last_workout_day text check (last_workout_day in ('A1', 'B1', 'A2', 'B2')),
  last_workout_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lift state for the 4 main lifts (T1 and T2 tracked independently)
create table public.lift_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lift_name text not null,
  tier text not null check (tier in ('T1', 'T2')),
  current_weight numeric not null,
  current_stage int not null default 1 check (current_stage between 1 and 3),
  current_scheme text not null,
  increment numeric not null,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lift_state_user_lift_tier_key unique(user_id, lift_name, tier)
);

-- T3 exercise state
create table public.t3_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  current_weight numeric not null default 0,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint t3_state_user_exercise_key unique(user_id, exercise_name)
);

-- Workout sessions
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null check (day in ('A1', 'B1', 'A2', 'B2')),
  date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned'))
);

-- Individual exercise entries within a workout
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_name text not null,
  tier text not null check (tier in ('T1', 'T2', 'T3')),
  target_weight numeric not null,
  target_scheme text not null,
  notes text,
  sort_order int not null default 0
);

-- Individual sets within an exercise
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int not null,
  actual_reps int,
  is_amrap boolean not null default false,
  completed_at timestamptz
);

-- Progression event log
create table public.progression_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lift_name text not null,
  tier text not null check (tier in ('T1', 'T2')),
  event_type text not null check (event_type in (
    'weight_increased', 'session_completed', 'session_failed',
    'stage_advanced', 'reset', 'manual_override'
  )),
  from_weight numeric,
  to_weight numeric,
  from_stage int,
  to_stage int,
  details jsonb,
  workout_id uuid references public.workouts(id),
  created_at timestamptz not null default now()
);

-- Body weight log
create table public.bodyweight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null,
  logged_at date not null default current_date,
  constraint bodyweight_log_user_date_key unique(user_id, logged_at)
);

-- Personal records
create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  tier text,
  record_type text not null check (record_type in ('weight', 'volume', 'estimated_1rm')),
  value numeric not null,
  workout_id uuid references public.workouts(id),
  achieved_at timestamptz not null default now()
);

-- Indexes
create index idx_lift_state_user on public.lift_state(user_id);
create index idx_t3_state_user on public.t3_state(user_id);
create index idx_workouts_user_date on public.workouts(user_id, date desc);
create index idx_workouts_user_status on public.workouts(user_id, status);
create index idx_workout_exercises_workout on public.workout_exercises(workout_id);
create index idx_workout_sets_exercise on public.workout_sets(workout_exercise_id);
create index idx_progression_events_user_lift on public.progression_events(user_id, lift_name, tier, created_at desc);
create index idx_bodyweight_user_date on public.bodyweight_log(user_id, logged_at desc);
create index idx_personal_records_user on public.personal_records(user_id);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.lift_state enable row level security;
alter table public.t3_state enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.progression_events enable row level security;
alter table public.bodyweight_log enable row level security;
alter table public.personal_records enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own lift state" on public.lift_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own t3 state" on public.t3_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own workout exercises" on public.workout_exercises
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

create policy "Users can manage own workout sets" on public.workout_sets
  for all using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy "Users can manage own progression events" on public.progression_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own bodyweight log" on public.bodyweight_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own personal records" on public.personal_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
