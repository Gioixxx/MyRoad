-- =====================================================================
-- My Road - L'Ascesa — Classifica globale A PUNTEGGIO (piano "Due classifiche", Fase 5).
-- Migrazione incrementale da eseguire UNA VOLTA nel SQL editor del progetto Supabase,
-- DOPO schema.sql + one-row-per-device.sql + nickname-uniqueness.sql (già eseguiti in
-- precedenza) — NON rieseguire schema.sql per intero, stesso principio di sempre.
--
-- Il database e' CONDIVISO con un'altra applicazione: questo script crea SOLO nuovi
-- oggetti con prefisso "myroad_" e non tocca, legge o modifica nulla di gia' esistente.
-- Le tabelle/viste della vecchia classifica (myroad_leaderboard_entries e viste
-- myroad_leaderboard_by_*) NON vengono toccate ne' droppate — il client smette solo di
-- leggerle/scriverle da questo rilascio in poi (vedi src/lib/leaderboard/client.ts).
--
-- Cosa cambia rispetto alla vecchia classifica: un solo numero (career_score, calcolato
-- in SQL, mai inviato dal client) al posto di 4 categorie/Pareto a 4 assi, e due piste
-- separate (calciatore/allenatore, colonna `track`) — l'allenatore non pubblicava affatto
-- prima d'ora. Una sola riga per (track, nickname): un dispositivo può avere al massimo
-- una riga per pista, sostituita solo se la nuova carriera ha uno score più alto.
-- =====================================================================

create table public.myroad_career_ranks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  device_id uuid not null,
  nickname text not null,
  -- Normalizzato (trim + lowercase) per il confronto di unicità sotto — stesso schema di
  -- myroad_nickname_claims.nickname_key, generato qui invece che calcolato lato client per
  -- essere sempre coerente con quello che il DB confronta.
  nickname_key text generated always as (lower(trim(nickname))) stored,
  track text not null,

  -- "OVR di picco" per il calciatore, "reputazione di picco" per l'allenatore — stessa scala
  -- 1-99 in entrambi i casi, colonna condivisa per poter avere un'unica formula di punteggio.
  peak_rating smallint not null,
  trophy_count smallint not null,
  award_count smallint not null,
  final_savings_eur bigint not null,

  last_name text not null,
  nationality text not null,
  -- Ruolo in campo (es. "ST") per il calciatore, letteralmente "Allenatore" per l'allenatore —
  -- sola visualizzazione, non usato in nessun confronto/filtro.
  role_label text not null,
  career_title text not null default '',
  archetype_id text,

  app_version text not null default 'unknown',
  -- Id locale (ArchivedCareer/ArchivedCoachCareer.id) solo a scopo di tracciabilita'/debug —
  -- MAI usato come chiave di unicita', stesso principio di myroad_leaderboard_entries.
  client_entry_id text,

  -- Punteggio derivato in SQL, MAI inviato dal client — vedi piano "Due classifiche": pesi di
  -- partenza, da ritoccare dopo un backfill sui dati live se risultano fuori scala. Il peso
  -- trofeo (40 calciatore / 50 allenatore) è l'unico termine che varia per pista; il resto della
  -- formula è condiviso.
  career_score bigint generated always as (
    (peak_rating::bigint * 20)
    + (trophy_count::bigint * case when track = 'player' then 40 else 50 end)
    + (award_count::bigint * 80)
    + floor(final_savings_eur / 1000000.0)::bigint
  ) stored,

  constraint myroad_ranks_track_valid check (track in ('player', 'coach')),
  constraint myroad_ranks_nickname_len check (char_length(trim(nickname)) between 2 and 20),
  constraint myroad_ranks_nickname_charset check (nickname ~ '^[[:alnum:] _.-]+$'),
  constraint myroad_ranks_last_name_len check (char_length(last_name) between 1 and 40),
  constraint myroad_ranks_role_label_len check (char_length(role_label) between 1 and 20),
  constraint myroad_ranks_peak_rating_range check (peak_rating between 1 and 99),
  constraint myroad_ranks_trophy_count_range check (trophy_count between 0 and 300),
  constraint myroad_ranks_award_count_range check (award_count between 0 and 150),
  constraint myroad_ranks_final_savings_range check (final_savings_eur between 0 and 5000000000),
  constraint myroad_ranks_career_title_len check (char_length(career_title) <= 120),
  constraint myroad_ranks_app_version_len check (char_length(app_version) <= 20)
);

-- Una riga per pista per (device_id implicito via nickname): il nickname è già univoco per
-- dispositivo (myroad_nickname_claims, riagganciato sotto), quindi (track, nickname_key) è
-- univoco per dispositivo+pista. Target del "native upsert" nella RPC sotto.
create unique index myroad_ranks_track_nickname_idx on public.myroad_career_ranks (track, nickname_key);

-- Query di classifica: top-N per pista ordinato per punteggio, "più recente prima" a parità.
create index myroad_ranks_track_score_idx on public.myroad_career_ranks (track, career_score desc, created_at desc);

alter table public.myroad_career_ranks enable row level security;

-- NESSUNA policy per "anon" sulla tabella base, ne' in lettura ne' in scrittura: a differenza
-- della vecchia myroad_leaderboard_entries (insert diretto con policy `with check (true)`), qui
-- l'UNICA via di scrittura e' la RPC SECURITY DEFINER sotto (myroad_submit_career_rank), e
-- l'UNICA via di lettura pubblica e' la vista senza device_id piu' sotto. RLS abilitata senza
-- policy nega tutto il resto per costruzione — nessun grant esplicito da revocare qui, a
-- differenza delle viste (vedi sotto), perche' non ne concediamo mai nessuno in primo luogo.

-- =====================================================================
-- Vista pubblica (stesse colonne di myroad_leaderboard_public: niente device_id/client_entry_id).
--
-- Deliberatamente SENZA `security_invoker = true` (il piano originale lo suggeriva) — vedi
-- .claude/memory/decisions.md per il ragionamento completo: su Postgres 15+, una vista
-- security_invoker valuta i privilegi/RLS del CHIAMANTE sulla tabella sottostante, il che
-- richiederebbe `grant select` + una policy RLS permissiva su anon anche sulla TABELLA BASE
-- (non solo sulla vista) perché la vista funzioni — ma PostgREST espone automaticamente ogni
-- oggetto su cui anon ha un grant come proprio endpoint REST, quindi quel grant riaprirebbe
-- `/rest/v1/myroad_career_ranks` con device_id incluso nel payload, esattamente la fuga di dati
-- che le viste esistevano per evitare. La vista qui usa invece il comportamento di default
-- (esegue con i privilegi del PROPRIETARIO, come myroad_leaderboard_public) — sicura in lettura
-- perché seleziona solo colonne pubbliche, e sicura in scrittura perché anon non ha (e non deve
-- mai avere) alcun grant INSERT/UPDATE/DELETE su di essa, applicato esplicitamente sotto.
-- =====================================================================

create or replace view public.myroad_career_ranks_public as
select
  id, created_at, nickname, track, peak_rating, trophy_count, award_count,
  final_savings_eur, last_name, nationality, role_label, career_title,
  archetype_id, app_version, career_score
from public.myroad_career_ranks;

grant select on public.myroad_career_ranks_public to anon;
revoke insert, update, delete on public.myroad_career_ranks_public from anon;

-- =====================================================================
-- Unicità del nickname: riaggancia il trigger/tabella GIÀ esistenti (supabase/nickname-
-- uniqueness.sql, myroad_claim_nickname/myroad_nickname_claims) — nessuna ridefinizione, la
-- funzione è già generica su new.nickname/new.device_id e la tabella di possesso resta GLOBALE
-- (non per-pista): un nickname vale per entrambe le piste, così lo stesso dispositivo non può
-- comparire come persone diverse tra Calciatori e Allenatori. Nessun problema di ordine tra
-- trigger su questa tabella (non c'è un secondo trigger "keep best" qui, quel comportamento vive
-- nell'ON CONFLICT della RPC sotto), quindi nessun bisogno del prefisso "00_" usato altrove per
-- forzare l'ordine alfabetico.
-- =====================================================================

drop trigger if exists myroad_claim_nickname_trigger on public.myroad_career_ranks;

create trigger myroad_claim_nickname_trigger
  before insert on public.myroad_career_ranks
  for each row execute function public.myroad_claim_nickname();

-- =====================================================================
-- RPC di pubblicazione — "upsert nativo" (INSERT ... ON CONFLICT ... DO UPDATE ... WHERE),
-- non un trigger BEFORE INSERT dedicato: un solo asse di confronto (career_score, non più 4 come
-- il Pareto della classifica vecchia) non giustifica quella complessità. Passa dalla RPC (non un
-- POST diretto alla tabella, che anon non può comunque fare per via delle RLS/grant sopra) così
-- la condizione "solo se il nuovo punteggio è più alto" può vivere in una singola istruzione SQL
-- invece che in PL/pgSQL procedurale.
--
-- SECURITY DEFINER: anon non ha alcun grant sulla tabella base, la RPC scrive con i privilegi
-- del proprietario. Il trigger di unicità nickname sopra scatta comunque per OGNI riga proposta
-- (anche quella che poi prende il path ON CONFLICT DO UPDATE, non solo un vero INSERT — è così
-- che funzionano i trigger BEFORE INSERT con ON CONFLICT in Postgres), quindi un nickname
-- rivendicato da un altro dispositivo continua a essere rifiutato con NICKNAME_TAKEN qui esattamente
-- come sulla tabella vecchia.
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
  p_client_entry_id text
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
    archetype_id, app_version, client_entry_id
  ) values (
    p_device_id, p_nickname, p_track, p_peak_rating, p_trophy_count, p_award_count,
    p_final_savings_eur, p_last_name, p_nationality, p_role_label, p_career_title,
    p_archetype_id, p_app_version, p_client_entry_id
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
    created_at = now()
  where excluded.career_score > public.myroad_career_ranks.career_score;
end;
$$;

revoke all on function public.myroad_submit_career_rank(
  uuid, text, text, smallint, smallint, smallint, bigint, text, text, text, text, text, text, text
) from public;
grant execute on function public.myroad_submit_career_rank(
  uuid, text, text, smallint, smallint, smallint, bigint, text, text, text, text, text, text, text
) to anon;

-- =====================================================================
-- Backfill: una riga per dispositivo dalla vecchia myroad_leaderboard_entries (solo pista
-- "player" — l'allenatore non pubblicava nulla prima d'ora, parte vuoto). Un dispositivo può
-- avere più righe Pareto-incomparabili nella tabella vecchia: si sceglie quella con lo score più
-- alto secondo la NUOVA formula (non semplicemente il peak_ovr più alto, che mescolerebbe stat
-- di carriere diverse). Il nickname è già sincronizzato su tutte le righe dello stesso
-- dispositivo dal vecchio trigger keep_best, quindi DISTINCT ON (device_id) equivale a
-- raggruppare per nickname_key qui.
-- =====================================================================

insert into public.myroad_career_ranks (
  device_id, nickname, track, peak_rating, trophy_count, award_count,
  final_savings_eur, last_name, nationality, role_label, career_title,
  archetype_id, app_version, client_entry_id
)
select distinct on (device_id)
  device_id, nickname, 'player', peak_ovr, trophy_count, award_count,
  final_savings_eur, last_name, nationality, position, career_title,
  archetype_id, app_version, client_entry_id
from public.myroad_leaderboard_entries
order by device_id,
  (peak_ovr::bigint * 20 + trophy_count::bigint * 40 + award_count::bigint * 80
    + floor(final_savings_eur / 1000000.0)::bigint) desc,
  created_at desc
on conflict (track, nickname_key) do nothing;

notify pgrst, 'reload schema';
