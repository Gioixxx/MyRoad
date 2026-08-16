-- =====================================================================
-- My Road - L'Ascesa — Unicità del nickname tra dispositivi diversi.
-- Migrazione incrementale da eseguire UNA VOLTA nel SQL editor del progetto
-- Supabase, DOPO schema.sql e one-row-per-device.sql (già eseguiti in
-- precedenza) — vedi la nota in cima a schema.sql sul motivo per cui questo
-- file resta separato invece di rieseguire schema.sql per intero.
--
-- Problema: myroad_leaderboard_entries non ha mai impedito a due device_id
-- diversi di pubblicare con lo stesso nickname (solo lo stesso device può
-- avere più righe con lo stesso nickname, sincronizzate dal trigger
-- myroad_leaderboard_keep_best già esistente) — segnalato dall'utente
-- osservando due nickname identici in classifica da dispositivi diversi.
--
-- Soluzione: una tabella di "possesso" del nickname (nickname normalizzato
-- -> device_id che lo ha rivendicato per primo), verificata da un nuovo
-- trigger BEFORE INSERT che rifiuta l'insert se il nickname è già di un
-- altro dispositivo. Non è un vincolo UNIQUE diretto sulla colonna
-- nickname della tabella principale: quella colonna deve poter ripetere lo
-- stesso valore su più righe dello STESSO dispositivo (una per specialità,
-- vedi myroad_leaderboard_keep_best).
--
-- RESET DELLA CLASSIFICA (distruttivo, voluto): la tabella esistente può già
-- contenere nickname duplicati tra dispositivi diversi, creati prima che
-- questa regola esistesse — se non si azzera, il primo dispositivo che
-- pubblica un nuovo punteggio dopo questa migrazione "vince" per caso quel
-- nickname e blocca tutti gli altri che lo usavano già legittimamente prima.
-- Si riparte da una classifica vuota così la regola vale in modo equo per
-- tutti da questo momento in poi.
-- =====================================================================

truncate table public.myroad_leaderboard_entries;

create table public.myroad_nickname_claims (
  -- Nickname normalizzato (trim + lowercase) per un confronto case-insensitive.
  nickname_key text primary key,
  device_id uuid not null,
  claimed_at timestamptz not null default now()
);

-- Nessuna policy di lettura/scrittura per "anon": RLS abilitata senza policy
-- nega di default tutto l'accesso ai ruoli non-owner (stesso pattern già
-- usato per update/delete su myroad_leaderboard_entries). device_id non
-- deve mai essere leggibile da anon, quindi questa tabella non ha nessuna
-- vista pubblica: l'unico accesso è tramite le funzioni SECURITY DEFINER
-- sotto, che girano con i privilegi del proprietario della tabella.
alter table public.myroad_nickname_claims enable row level security;
revoke all on public.myroad_nickname_claims from anon, authenticated;

-- =====================================================================
-- RPC pubblica di sola lettura: il client la chiama per un controllo di
-- disponibilità "onBlur" sul campo nickname, prima ancora di giocare una
-- carriera intera — SECURITY DEFINER perché anon non ha alcun grant sulla
-- tabella sopra. Un nickname è "disponibile" se non è mai stato
-- rivendicato, oppure se è già del device_id che lo sta controllando.
-- =====================================================================

create or replace function public.myroad_nickname_available(p_nickname text, p_device_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.myroad_nickname_claims
    where nickname_key = lower(trim(p_nickname))
      and device_id <> p_device_id
  );
$$;

revoke all on function public.myroad_nickname_available(text, uuid) from public;
grant execute on function public.myroad_nickname_available(text, uuid) to anon;

-- =====================================================================
-- Trigger BEFORE INSERT: rivendica il nickname per il dispositivo se
-- libero, lo conferma se già suo, altrimenti rifiuta l'insert con
-- un'eccezione riconoscibile dal client ("NICKNAME_TAKEN", errcode
-- unique_violation così PostgREST la mappa a HTTP 409).
--
-- Nominato "myroad_00_..." apposta: i trigger BEFORE INSERT sulla stessa
-- tabella girano in ordine alfabetico per nome, e questo deve girare PRIMA
-- di myroad_leaderboard_keep_best_trigger (così un nickname rubato non
-- arriva mai a toccare/cancellare righe esistenti).
--
-- Non rilascia mai la vecchia rivendicazione quando un dispositivo cambia
-- nickname nelle Impostazioni: resta riservata per sempre a quel device_id.
-- Scelta deliberata, non un bug — coerente col rischio già accettato altrove
-- in questo schema (nessuna validazione server-authoritative "perfetta" per
-- un gioco 100% client-side); evita anche che un nickname abbandonato torni
-- immediatamente disponibile per un altro dispositivo.
-- =====================================================================

create or replace function public.myroad_claim_nickname()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_key text := lower(trim(new.nickname));
  owner_device_id uuid;
begin
  select device_id into owner_device_id
  from public.myroad_nickname_claims
  where nickname_key = claim_key
  for update;

  if owner_device_id is null then
    insert into public.myroad_nickname_claims (nickname_key, device_id)
    values (claim_key, new.device_id);
  elsif owner_device_id <> new.device_id then
    raise exception 'NICKNAME_TAKEN' using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists myroad_00_claim_nickname_trigger on public.myroad_leaderboard_entries;

create trigger myroad_00_claim_nickname_trigger
  before insert on public.myroad_leaderboard_entries
  for each row execute function public.myroad_claim_nickname();
