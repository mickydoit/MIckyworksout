-- Run this once in the Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: ahecfusgkzzjpbxgvjmh

create table if not exists weight_logs (
  id         uuid default gen_random_uuid() primary key,
  date       date not null unique,
  weight     numeric(5,2) not null,
  created_at timestamptz default now()
);

create table if not exists nutrition_logs (
  id         uuid default gen_random_uuid() primary key,
  date       date not null unique,
  calories   integer not null default 0,
  protein    integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists workout_logs (
  id         uuid default gen_random_uuid() primary key,
  date       date not null unique,
  type       text not null,
  completed  boolean default true,
  duration   integer,
  activity   text,
  created_at timestamptz default now()
);

create table if not exists steps_logs (
  id         uuid default gen_random_uuid() primary key,
  date       date not null unique,
  steps      integer not null default 0,
  created_at timestamptz default now()
);

-- Enable RLS (personal app — allow all via anon key)
alter table weight_logs    enable row level security;
alter table nutrition_logs enable row level security;
alter table workout_logs   enable row level security;
alter table steps_logs     enable row level security;

create policy "allow_all" on weight_logs    for all using (true) with check (true);
create policy "allow_all" on nutrition_logs for all using (true) with check (true);
create policy "allow_all" on workout_logs   for all using (true) with check (true);
create policy "allow_all" on steps_logs     for all using (true) with check (true);
