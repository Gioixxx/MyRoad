-- =====================================================================
-- My Road - L'Ascesa — Classifica globale (leaderboard)
-- Da eseguire UNA VOLTA nel SQL editor del progetto Supabase.
--
-- Il database e' CONDIVISO con un'altra applicazione: questo script crea
-- SOLO nuovi oggetti con prefisso "myroad_" e non tocca, legge o modifica
-- nulla di gia' esistente. CREATE TABLE/INDEX/POLICY falliscono con un
-- errore se un nome collide, non sovrascrivono mai nulla.
--
-- Nessun account/login: identita' anonima per-device (device_id) generata
-- lato client + nickname libero. Nessuna validazione server-authoritative
-- e' possibile (gioco 100% client-side) — i CHECK sotto sono l'UNICO
-- filtro anti-abuso reale. Rischio accettato per un progetto hobby a
-- bassa audience; la dashboard Supabase (service_role key, mai esposta al
-- client) resta la via di moderazione manuale per righe palesemente false
-- o abusive.
-- =====================================================================

create extension if not exists pgcrypto;

create table public.myroad_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identita' anonima del client, generata via crypto.randomUUID() e
  -- persistita in localStorage (src/lib/leaderboard/settings.ts).
  device_id uuid not null,
  nickname text not null,
  app_version text not null default 'unknown',

  -- Id locale (ArchivedCareer.id) solo a scopo di tracciabilita'/debug in
  -- dashboard — MAI usato come chiave di unicita': non e' stabile ne'
  -- globale (e' "${lastName}-${Date.now()}" generato lato client).
  client_entry_id text,

  -- Payload mappato 1:1 da ArchivedCareer (src/types/career.ts)
  last_name text not null,
  nationality text not null,
  position text not null,
  peak_ovr smallint not null,
  trophy_count smallint not null,
  award_count smallint not null,
  retired_age smallint not null,
  retired_at_iso timestamptz not null,
  career_apps integer not null,
  career_goals integer not null,
  career_assists integer not null,
  final_savings_eur bigint not null,
  final_popularity smallint not null,
  career_title text not null default '',
  archetype_id text,
  shadow_title text,

  -- Vincoli anti-abuso "morbidi": range generosi ma plausibili rispetto ai
  -- limiti del motore di gioco (vedi src/lib/career/*). Qualsiasi client
  -- puo' comunque inviare stat fabbricate DENTRO questi range — accettato.
  constraint myroad_nickname_len check (char_length(trim(nickname)) between 2 and 20),
  constraint myroad_nickname_charset check (nickname ~ '^[[:alnum:] _.-]+$'),
  constraint myroad_last_name_len check (char_length(last_name) between 1 and 40),
  constraint myroad_position_valid check (
    position in ('GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST')
  ),
  constraint myroad_peak_ovr_range check (peak_ovr between 1 and 99),
  constraint myroad_retired_age_range check (retired_age between 16 and 41),
  constraint myroad_trophy_count_range check (trophy_count between 0 and 300),
  constraint myroad_award_count_range check (award_count between 0 and 150),
  constraint myroad_career_apps_range check (career_apps between 0 and 3000),
  constraint myroad_career_goals_range check (career_goals between 0 and 3000),
  constraint myroad_career_assists_range check (career_assists between 0 and 3000),
  constraint myroad_final_savings_range check (final_savings_eur between 0 and 5000000000),
  constraint myroad_final_popularity_range check (final_popularity between 0 and 100),
  constraint myroad_career_title_len check (char_length(career_title) <= 120),
  constraint myroad_app_version_len check (char_length(app_version) <= 20)

  -- Niente unique(device_id): un dispositivo può avere più righe, una per
  -- "specialità" (OVR/trofei/patrimonio/popolarità) — vedi il trigger sotto.
);

-- Indici per le 4 query di classifica (top-N per categoria, con created_at
-- come tie-break "piu' recente prima").
create index myroad_leaderboard_peak_ovr_idx   on public.myroad_leaderboard_entries (peak_ovr desc, created_at desc);
create index myroad_leaderboard_trophy_idx     on public.myroad_leaderboard_entries (trophy_count desc, created_at desc);
create index myroad_leaderboard_savings_idx    on public.myroad_leaderboard_entries (final_savings_eur desc, created_at desc);
create index myroad_leaderboard_popularity_idx on public.myroad_leaderboard_entries (final_popularity desc, created_at desc);

-- Indici per DISTINCT ON (device_id) nelle viste per-categoria sotto:
-- una riga per dispositivo, la migliore su quell'asse.
create index myroad_leaderboard_device_ovr_idx
  on public.myroad_leaderboard_entries (device_id, peak_ovr desc, created_at desc);
create index myroad_leaderboard_device_trophy_idx
  on public.myroad_leaderboard_entries (device_id, trophy_count desc, created_at desc);
create index myroad_leaderboard_device_savings_idx
  on public.myroad_leaderboard_entries (device_id, final_savings_eur desc, created_at desc);
create index myroad_leaderboard_device_popularity_idx
  on public.myroad_leaderboard_entries (device_id, final_popularity desc, created_at desc);

alter table public.myroad_leaderboard_entries enable row level security;

-- NESSUNA policy di lettura pubblica sulla tabella base: device_id/client_entry_id non devono
-- mai essere leggibili da anon (vedi le viste pubbliche piu' sotto, che li escludono). La
-- lettura pubblica della classifica passa dalle viste per-categoria; myroad_leaderboard_public
-- resta un dump non filtrato (utile in dashboard, non usato dal client).

-- Scrittura pubblica (anche anonima): nessun login, per design. I CHECK
-- sopra sono l'unico filtro; nessuna validazione server-authoritative e'
-- possibile qui.
create policy "myroad_leaderboard_public_insert"
  on public.myroad_leaderboard_entries
  for insert
  to anon
  with check (true);

-- NESSUNA policy di update/delete per "anon": RLS nega di default tutto
-- cio' che non ha una policy esplicita, quindi update/delete restano
-- bloccati per il client pubblico. L'unica via e' manuale, dalla dashboard
-- Supabase con la service_role key.

-- =====================================================================
-- Vista di sola lettura di tutte le righe (nessun filtro per dispositivo).
-- Il client NON la usa piu': la classifica passa dalle viste per-categoria
-- sotto. Resta disponibile in dashboard / debug; stesse colonne pubbliche
-- (niente device_id/client_entry_id).
-- Una vista Postgres senza `security_invoker` (default) esegue con i
-- permessi del proprietario — bypassa la RLS della tabella sottostante a
-- prescindere da chi la interroga, quindi anon puo' leggere tutte le righe
-- tramite questa vista pur non avendo alcuna policy SELECT sulla tabella
-- base.
--
-- ATTENZIONE (bug reale trovato e corretto in questa sessione): Supabase
-- concede di default privilegi ampi (INSERT/UPDATE/DELETE, non solo
-- SELECT) ad anon su ogni nuovo oggetto dello schema public, viste incluse
-- — senza la REVOKE esplicita sotto, chiunque puo' scrivere/cancellare
-- QUALSIASI riga passando dalla vista, bypassando del tutto la RLS della
-- tabella base (lo stesso motivo per cui la vista bypassa la RLS in
-- lettura vale anche in scrittura). Verificato con PATCH/DELETE/POST
-- diretti contro l'endpoint della vista prima e dopo la REVOKE.
-- =====================================================================

create or replace view public.myroad_leaderboard_public as
select
  id, nickname, app_version, last_name, nationality, position,
  peak_ovr, trophy_count, award_count, retired_age, retired_at_iso,
  career_apps, career_goals, career_assists, final_savings_eur,
  final_popularity, career_title, archetype_id, shadow_title, created_at
from public.myroad_leaderboard_entries;

grant select on public.myroad_leaderboard_public to anon;
revoke insert, update, delete on public.myroad_leaderboard_public from anon;

-- =====================================================================
-- Viste per-categoria: una riga per dispositivo (la migliore su quell'asse).
-- La tabella puo' tenere piu' carriere Pareto-incomparabili dello stesso
-- device_id (vedi trigger sotto); in UI pero' ogni tab deve mostrare al
-- massimo una voce per persona, altrimenti lo stesso nickname compare
-- due volte in "OVR piu' alto" con punteggi diversi.
--
-- DISTINCT ON (device_id) avviene qui, internamente: le viste espongono
-- le stesse colonne di myroad_leaderboard_public (niente device_id).
-- Stesso avviso della vista sopra: revoke esplicita di INSERT/UPDATE/DELETE
-- su anon, altrimenti Supabase lascia i privilegi ampi di default.
-- =====================================================================

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

-- =====================================================================
-- Per utente: tiene solo le carriere che sono un record su almeno un asse
-- (dominanza di Pareto su OVR di picco/trofei/patrimonio/popolarità), non
-- una sola riga con un unico criterio. Così un giocatore con OVR basso ma
-- tanti trofei o molto patrimonio resta comunque in classifica in quelle
-- categorie, invece di sparire perché la sua carriera con OVR più alto ne
-- aveva meno. In più, sincronizza il nickname corrente su tutte le righe
-- dello stesso dispositivo — altrimenti chi cambia nickname nelle
-- Impostazioni finirebbe per comparire in classifica sotto più nomi
-- diversi pur essendo sempre la stessa persona.
--
-- Il client invia sempre e solo un INSERT (mai UPDATE/DELETE, mai concessi
-- ad anon sopra). Questo trigger BEFORE INSERT, eseguito con i privilegi
-- del proprietario della tabella (SECURITY DEFINER, non del ruolo anon che
-- chiama):
--   1. se un'altra carriera dello stesso device_id è già "uguale o
--      migliore su tutti e 4 gli assi", propaga comunque il nickname
--      corrente alle righe esistenti di quel dispositivo, poi annulla
--      l'insert — la nuova carriera non sarebbe un record in nessuna
--      categoria, ma il nome visualizzato va comunque aggiornato;
--   2. altrimenti rimuove le carriere dello stesso device_id che la nuova
--      carriera supera a sua volta su tutti gli assi (record superati);
--   3. propaga il nickname corrente alle righe superstiti dello stesso
--      dispositivo (non sostituite, perché non dominate dalla nuova);
--   4. procede con l'insert della nuova carriera.
-- La logica agisce sempre e solo sul device_id della riga in inserimento
-- (mai su un altro), quindi non apre nessuna via per aggiornare/cancellare
-- le righe di un altro utente al di fuori di questo percorso vincolato —
-- device_id non è comunque mai esposto in lettura pubblica (vedi la vista
-- sopra), quindi non è nemmeno raccoglibile da un altro client per tentare
-- di indovinarlo/riusarlo.
-- Non c'è un tetto esplicito al numero di righe per dispositivo (in teoria
-- un client potrebbe inviare più combinazioni "incomparabili" per
-- accumulare più voci) — rischio accettato, stesso principio dei CHECK
-- sopra: nessuna validazione server-authoritative è possibile in un gioco
-- 100% client-side, e l'audience è piccola.
-- =====================================================================

create or replace function public.myroad_leaderboard_keep_best()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.myroad_leaderboard_entries
    where device_id = new.device_id
      and peak_ovr >= new.peak_ovr
      and trophy_count >= new.trophy_count
      and final_savings_eur >= new.final_savings_eur
      and final_popularity >= new.final_popularity
  ) then
    update public.myroad_leaderboard_entries
    set nickname = new.nickname
    where device_id = new.device_id and nickname <> new.nickname;
    return null; -- non è un record su nessun asse: insert annullato
  end if;

  delete from public.myroad_leaderboard_entries
  where device_id = new.device_id
    and peak_ovr <= new.peak_ovr
    and trophy_count <= new.trophy_count
    and final_savings_eur <= new.final_savings_eur
    and final_popularity <= new.final_popularity;

  update public.myroad_leaderboard_entries
  set nickname = new.nickname
  where device_id = new.device_id and nickname <> new.nickname;

  return new; -- procede con l'insert: è un record su almeno un asse
end;
$$;

drop trigger if exists myroad_leaderboard_keep_best_trigger on public.myroad_leaderboard_entries;

create trigger myroad_leaderboard_keep_best_trigger
  before insert on public.myroad_leaderboard_entries
  for each row execute function public.myroad_leaderboard_keep_best();
