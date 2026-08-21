-- =====================================================================
-- Dettaglio trofei/premi nella classifica a punteggio — migrazione incrementale da
-- eseguire UNA VOLTA nel SQL editor del progetto Supabase, DOPO career-ranks.sql
-- (e career-ranks-fixup.sql, se già eseguito). NON rieseguire career-ranks.sql per intero.
--
-- Aggiunge due colonne jsonb aggregate (per competizione/tipo premio, non l'elenco puntuale di
-- ogni trofeo con età/club — una carriera può avere fino a 300 trofei/150 premi, l'elenco
-- puntuale gonfierebbe payload/UI senza motivo) a myroad_career_ranks, le espone sulla vista
-- pubblica, e aggiorna la RPC di pubblicazione per accettarle. Vedi
-- src/lib/career/trophy-breakdown.ts per la forma esatta (TrophyBreakdownEntry[]/
-- AwardBreakdownEntry<T>[]) e src/lib/leaderboard/client.ts per chi le invia.
-- =====================================================================

alter table public.myroad_career_ranks
  add column if not exists trophy_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists award_breakdown jsonb not null default '[]'::jsonb;

-- Righe pre-esistenti restano valide (default '[]') — il client mostra "Dettaglio non
-- disponibile" per queste, nessun backfill necessario/possibile (il dato grezzo Trophy[]/
-- Award[] non è mai stato salvato lato server, viveva solo in memoria sul dispositivo che ha
-- pubblicato la riga originale).

do $$
begin
  alter table public.myroad_career_ranks
    add constraint myroad_ranks_trophy_breakdown_shape
      check (jsonb_typeof(trophy_breakdown) = 'array' and jsonb_array_length(trophy_breakdown) <= 60);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.myroad_career_ranks
    add constraint myroad_ranks_trophy_breakdown_size
      check (octet_length(trophy_breakdown::text) <= 4000);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.myroad_career_ranks
    add constraint myroad_ranks_award_breakdown_shape
      check (jsonb_typeof(award_breakdown) = 'array' and jsonb_array_length(award_breakdown) <= 10);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.myroad_career_ranks
    add constraint myroad_ranks_award_breakdown_size
      check (octet_length(award_breakdown::text) <= 1500);
exception
  when duplicate_object then null;
end $$;

-- =====================================================================
-- Vista pubblica — aggiunge le due colonne, resto invariato (deliberatamente SENZA
-- security_invoker, stesso ragionamento di career-ranks.sql: renderla security_invoker
-- richiederebbe un grant anon sulla tabella base, che PostgREST esporrebbe automaticamente
-- come endpoint REST separato con device_id incluso).
-- =====================================================================

create or replace view public.myroad_career_ranks_public as
select
  id, created_at, nickname, track, peak_rating, trophy_count, award_count,
  final_savings_eur, last_name, nationality, role_label, career_title,
  archetype_id, app_version, career_score, trophy_breakdown, award_breakdown
from public.myroad_career_ranks;

grant select on public.myroad_career_ranks_public to anon;
revoke insert, update, delete on public.myroad_career_ranks_public from anon;

-- =====================================================================
-- RPC di pubblicazione — due nuovi parametri FINALI con default, per restare compatibile con
-- una chiamata dal vecchio client (senza i due parametri) durante la finestra di rollout.
-- =====================================================================

create or replace function public.myroad_submit_career_rank(
  p_device_id uuid,
  p_nickname text,
  p_track text,
  p_peak_rating smallint,
  p_trophy_count smallint,
  p_award_count smallint,
  p_final_savings_eur bigint,
  p_last_name text,
  p_nationality text,
  p_role_label text,
  p_career_title text,
  p_archetype_id text,
  p_app_version text,
  p_client_entry_id text,
  p_trophy_breakdown jsonb default '[]'::jsonb,
  p_award_breakdown jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.myroad_career_ranks (
    device_id, nickname, track, peak_rating, trophy_count, award_count,
    final_savings_eur, last_name, nationality, role_label, career_title,
    archetype_id, app_version, client_entry_id, trophy_breakdown, award_breakdown
  ) values (
    p_device_id, p_nickname, p_track, p_peak_rating, p_trophy_count, p_award_count,
    p_final_savings_eur, p_last_name, p_nationality, p_role_label, p_career_title,
    p_archetype_id, p_app_version, p_client_entry_id, p_trophy_breakdown, p_award_breakdown
  )
  on conflict (track, nickname_key) do update set
    device_id = excluded.device_id,
    nickname = excluded.nickname,
    peak_rating = excluded.peak_rating,
    trophy_count = excluded.trophy_count,
    award_count = excluded.award_count,
    final_savings_eur = excluded.final_savings_eur,
    last_name = excluded.last_name,
    nationality = excluded.nationality,
    role_label = excluded.role_label,
    career_title = excluded.career_title,
    archetype_id = excluded.archetype_id,
    app_version = excluded.app_version,
    client_entry_id = excluded.client_entry_id,
    trophy_breakdown = excluded.trophy_breakdown,
    award_breakdown = excluded.award_breakdown,
    created_at = now()
  where excluded.career_score > public.myroad_career_ranks.career_score;
end;
$$;

-- Postgres identifica le funzioni per nome+tipi argomenti: la vecchia firma (14 parametri, senza
-- i due jsonb finali) non esiste più dopo il CREATE OR REPLACE sopra (i parametri aggiuntivi con
-- default cambiano comunque la firma "canonica" a 16 argomenti) — revoke/grant vanno riemessi
-- sulla firma nuova.
revoke all on function public.myroad_submit_career_rank(
  uuid, text, text, smallint, smallint, smallint, bigint, text, text, text, text, text, text, text, jsonb, jsonb
) from public;
grant execute on function public.myroad_submit_career_rank(
  uuid, text, text, smallint, smallint, smallint, bigint, text, text, text, text, text, text, text, jsonb, jsonb
) to anon;

notify pgrst, 'reload schema';
