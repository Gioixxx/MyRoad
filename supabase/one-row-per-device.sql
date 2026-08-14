-- =====================================================================
-- Incrementale: una riga per dispositivo in ogni tab della classifica.
-- Da eseguire sul progetto Supabase GIA' esistente (NON rieseguire
-- schema.sql per intero). Idempotente: create index if not exists,
-- create or replace view, grant/revoke.
--
-- Dopo l'esecuzione PostgREST deve vedere le nuove viste: il NOTIFY in
-- fondo forza il reload dello schema cache.
-- =====================================================================

create index if not exists myroad_leaderboard_device_ovr_idx
  on public.myroad_leaderboard_entries (device_id, peak_ovr desc, created_at desc);
create index if not exists myroad_leaderboard_device_trophy_idx
  on public.myroad_leaderboard_entries (device_id, trophy_count desc, created_at desc);
create index if not exists myroad_leaderboard_device_savings_idx
  on public.myroad_leaderboard_entries (device_id, final_savings_eur desc, created_at desc);
create index if not exists myroad_leaderboard_device_popularity_idx
  on public.myroad_leaderboard_entries (device_id, final_popularity desc, created_at desc);

create or replace view public.myroad_leaderboard_by_ovr as
select
  id, nickname, app_version, last_name, nationality, position,
  peak_ovr, trophy_count, award_count, retired_age, retired_at_iso,
  career_apps, career_goals, career_assists, final_savings_eur,
  final_popularity, career_title, archetype_id, shadow_title, created_at
from (
  select distinct on (device_id) *
  from public.myroad_leaderboard_entries
  order by device_id, peak_ovr desc, created_at desc
) t;

create or replace view public.myroad_leaderboard_by_trophies as
select
  id, nickname, app_version, last_name, nationality, position,
  peak_ovr, trophy_count, award_count, retired_age, retired_at_iso,
  career_apps, career_goals, career_assists, final_savings_eur,
  final_popularity, career_title, archetype_id, shadow_title, created_at
from (
  select distinct on (device_id) *
  from public.myroad_leaderboard_entries
  order by device_id, trophy_count desc, created_at desc
) t;

create or replace view public.myroad_leaderboard_by_savings as
select
  id, nickname, app_version, last_name, nationality, position,
  peak_ovr, trophy_count, award_count, retired_age, retired_at_iso,
  career_apps, career_goals, career_assists, final_savings_eur,
  final_popularity, career_title, archetype_id, shadow_title, created_at
from (
  select distinct on (device_id) *
  from public.myroad_leaderboard_entries
  order by device_id, final_savings_eur desc, created_at desc
) t;

create or replace view public.myroad_leaderboard_by_popularity as
select
  id, nickname, app_version, last_name, nationality, position,
  peak_ovr, trophy_count, award_count, retired_age, retired_at_iso,
  career_apps, career_goals, career_assists, final_savings_eur,
  final_popularity, career_title, archetype_id, shadow_title, created_at
from (
  select distinct on (device_id) *
  from public.myroad_leaderboard_entries
  order by device_id, final_popularity desc, created_at desc
) t;

grant select on public.myroad_leaderboard_by_ovr to anon;
grant select on public.myroad_leaderboard_by_trophies to anon;
grant select on public.myroad_leaderboard_by_savings to anon;
grant select on public.myroad_leaderboard_by_popularity to anon;
revoke insert, update, delete on public.myroad_leaderboard_by_ovr from anon;
revoke insert, update, delete on public.myroad_leaderboard_by_trophies from anon;
revoke insert, update, delete on public.myroad_leaderboard_by_savings from anon;
revoke insert, update, delete on public.myroad_leaderboard_by_popularity from anon;

notify pgrst, 'reload schema';
