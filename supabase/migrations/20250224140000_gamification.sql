-- Gamification: XP and level for profiles
alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;
