-- India Green Grid - Postgres schema (Supabase).
-- The app currently reads the JSON snapshots in data/clean/. These tables hold
-- the same data in normalised form for when the project moves to Supabase.

create table if not exists source_log (
  id            bigint generated always as identity primary key,
  dataset       text not null,
  publisher     text not null,
  url           text not null,
  report_date   date,
  frequency     text,
  fetched_at    timestamptz not null default now()
);

create table if not exists installed_capacity (
  as_of         date not null,
  area_type     text not null check (area_type in ('india', 'region', 'state')),
  area          text not null,
  region        text,
  coal_mw       numeric(12,2) not null,
  lignite_mw    numeric(12,2) not null,
  gas_mw        numeric(12,2) not null,
  diesel_mw     numeric(12,2) not null,
  hydro_mw      numeric(12,2) not null,
  res_mw        numeric(12,2) not null,
  nuclear_mw    numeric(12,2) not null,
  total_mw      numeric(12,2) not null,
  source_id     bigint references source_log(id),
  primary key (as_of, area_type, area)
);

create table if not exists res_breakup (
  as_of             date primary key,
  solar_mw          numeric(12,2) not null,
  wind_mw           numeric(12,2) not null,
  small_hydro_mw    numeric(12,2) not null,
  biomass_mw        numeric(12,2) not null,
  waste_to_energy_mw numeric(12,2) not null,
  source_id         bigint references source_log(id)
);

create table if not exists daily_generation (
  gen_date      date not null,
  source        text not null check (source in ('thermal', 'nuclear', 'hydro', 'bhutan_import')),
  program_mu    numeric(12,2),
  actual_mu     numeric(12,2) not null,
  ytd_actual_mu numeric(14,2),
  source_id     bigint references source_log(id),
  primary key (gen_date, source)
);

create table if not exists live_power_position (
  read_at       timestamptz primary key,
  demand_met_mw integer not null,
  thermal_mw    integer not null,
  gas_mw        integer not null,
  nuclear_mw    integer not null,
  hydro_mw      integer not null,
  renewable_mw  integer not null,
  other_res_mw  integer,
  storage_mw    integer
);

create table if not exists rpo_targets (
  financial_year text primary key,
  target_pct     numeric(5,2) not null
);

insert into rpo_targets (financial_year, target_pct) values
  ('2024-25', 29.91), ('2025-26', 33.01), ('2026-27', 35.95),
  ('2027-28', 38.81), ('2028-29', 41.36), ('2029-30', 43.33)
on conflict (financial_year) do nothing;

create table if not exists jobs (
  id        bigint generated always as identity primary key,
  title     text not null,
  sector    text not null,
  location  text not null,
  level     text,
  job_type  text,
  skills    text[] not null default '{}',
  is_sample boolean not null default true
);

-- Role-based access: profiles carry the stakeholder role used by the portals.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('citizen', 'discom', 'industry', 'financier', 'policymaker'))
);
