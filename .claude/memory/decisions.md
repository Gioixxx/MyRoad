---
type: decisions
tags: [memory, architecture]
updated: [2026-08-19]
---

# Decisioni Architetturali
Registro scelte tecniche con motivazioni.

> **Archiviazione 2026-08-12, ripetuta 2026-08-19:** questo file supera periodicamente la soglia
> di lettura diretta di 100KB del tool Read. Le decisioni dal 2026-08-04 al 2026-08-12 sono state
> spostate in **`decisions-archive.md`** ([[decisions-archive]], **non auto-caricato** — leggerlo
> on-demand con Grep/Read offset+limit quando serve contesto storico). Qui restano il template e
> le decisioni dal 2026-08-13 in poi. Quando questo file si riavvicina ai 100KB, ripetere lo
> stesso spostamento (le voci più vecchie in cima vanno in archivio, non cancellate).

## Template
### [Titolo breve]
- **Data:** [YYYY-MM-DD]
- **Decisione:** [scelta fatta]
- **Perché:** [motivazione e trade-off]
- **Alternative:** [scartate e perché]
- **Impatto:** [moduli coinvolti] — entità in [[domain]], se formalizzata vedi [[adr]]

---

### Cartellino mobile richiudibile — primo pezzo del backlog "alleggerimento informazioni mobile"
- **Data:** 2026-08-13
- **Decisione:** su segnalazione diretta dell'utente ("mostriamo un botto di informazioni...
  dobbiamo rendere più semplice") dopo aver aperto il gioco in un iframe mobile 390×844 (stessa
  tecnica di [[decisions-archive]], sessione 2026-08-12) e giocato alcuni cicli reali — confermato
  che già la primissima schermata (offerta settore giovanile) impila timeline + cartellino
  completo (OVR, potenziale, valore, patrimonio, clausola, popolarità, 5 barre attributi,
  trofei/premi) + decisione, tutto senza gerarchia visiva. Proposte 4 ampiezze di intervento
  all'utente (`AskUserQuestion`); scelta la più mirata: **solo il cartellino**. In `PlayerCard.tsx`
  (usato con `compact` **solo** dal loop di gioco in `CareerGame.tsx`, nessun altro call site):
  restano sempre visibili maglia/nome/club/età/OVR/potenziale + box Obiettivo; tutto il resto
  (Valore/Patrimonio/Clausola/Popolarità, `AttributesPanel`, record di stagione, statistiche
  presenze/gol/assist, contatore trofei/premi) è ora dentro un unico wrapper `<div>` richiudibile,
  chiuso di default, dietro un bottone toggle "▾ Dettagli" con stato `detailsOpen` (`useState`).
  Pattern CSS invece di rendering condizionale: `!showDetails ? "hidden lg:flex" : "flex"` sul
  wrapper — a `lg:` (dove il loop passa al layout desktop a 3 colonne) resta **sempre** espanso e
  il bottone toggle è nascosto (`lg:hidden`), esattamente come il comportamento preesistente;
  sotto `lg:` (mobile **e** tablet, non solo telefono) parte chiuso. Rimossi in passaggio i vecchi
  micro-toggle incoerenti che usavano la soglia `sm:` invece di `lg:` su `AttributesPanel`/record
  grid/stats grid (create per un motivo diverso, la riga condensata valore+P·G·A ora ridondante
  col nuovo toggle — eliminata) — tutta la sezione secondaria ora si apre/chiude come un blocco
  unico invece di avere 3 soglie di breakpoint diverse e incoerenti tra loro.
- **Perché:** `AttributesPanel` deve restare **interattivo** (click per impostare il focus di
  allenamento, meccanica aggiunta nel pass di game-feel v0.11.0) anche su mobile — non poteva
  essere semplicemente nascosto in permanenza sotto `lg:` come le altre sezioni, da qui la scelta
  di un toggle esplicito invece di un CSS puro `hidden lg:flex` senza via di accesso su schermi
  piccoli. Le altre 3 ampiezze proposte (Storico richiudibile, badge decisione/offerta ridotti al
  tocco) restano deliberatamente fuori scope in questo giro — l'utente ha scelto l'intervento più
  mirato, coerente con l'item di backlog già aperto ("da definire in una sessione dedicata...quali
  schermate/informazioni toccare").
- **Alternative:** rendering condizionale (`{showDetails ? <>...</> : null}`) invece di CSS
  `hidden`/`flex` — scartato: smonterebbe/rimonterebbe `AttributesPanel` ad ogni toggle, perdendo
  eventuali stati interni e rifacendo il lavoro di `useCountUp` sulle statistiche non necessario;
  il pattern CSS-only (`hidden lg:flex`) è lo stesso già consolidato nel progetto per la
  distinzione mobile/desktop (`lg:min-h-0`, `lg:grid-cols-[...]`), qui semplicemente combinato con
  uno stato locale per il toggle sotto `lg:`.
- **Impatto:** `src/components/features/career/PlayerCard.tsx` (unico file toccato). 517 test
  invariati, `tsc --noEmit`/eslint/prettier puliti. **Verificato dal vivo** nell'iframe mobile
  390px: cartellino ridotto da ~2 schermate a ~320px (nome/club/età/OVR/potenziale/Obiettivo),
  toggle "Dettagli" apre/chiude correttamente tutta la sezione secondaria con la freccia che
  ruota; verificato anche a piena larghezza (>1024px, layout desktop a 3 colonne) che il
  comportamento resti identico a prima (tutto sempre visibile, nessun bottone toggle) — nessuna
  regressione desktop. Storico e card di offerta/decisione **non toccate** in questo giro — vedi
  [[backlog]], restano le prossime candidate se l'utente vuole proseguire l'alleggerimento.
- **Aggiornamento stesso giorno — rilasciato come v0.11.1**: bump `package.json`/
  `package-lock.json` 0.11.0→0.11.1 (patch: fix mirato a un solo componente, coerente col
  criterio già usato per interventi di questa dimensione). `dist/MyRoad.exe` (FileVersion
  0.11.1.0) e `dist/MyRoad.apk` (versionCode 1101/versionName 0.11.1, firma verificata con
  `apksigner verify --print-certs` — stessa chiave stabile del progetto) rigenerati e allegati
  alla [release GitHub v0.11.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.11.1). Prima di
  questo giro, l'app installata sul tablet fisico dell'utente era già stata aggiornata con una
  build locale identica (`adb install -r` di una `assembleRelease` con la stessa chiave, non
  taggata né pubblicata) per farla vedere subito — questa release la allinea formalmente al
  canale pubblico/auto-updater.

### Classifica globale cross-utente — prima feature di rete del progetto (Supabase) — release v0.12.0
- **Data:** 2026-08-13/14
- **Decisione:** su richiesta esplicita dell'utente ("possiamo fare una sorta di classifica di
  tutti gli utenti che giocano al gioco"), implementata la prima funzionalità di rete del progetto
  — finora il gioco era interamente locale (`localStorage`, zero `fetch`/dipendenze di rete in
  `src/`). Sessione di piano completo con ricerca preliminare (3 agenti Explore + 1 agente Plan)
  seguita da diverse iterazioni di correzione **durante** l'implementazione, ognuna su richiesta
  diretta dell'utente. Decisioni chiave, in ordine cronologico:
  1. **Backend: Supabase** (Postgres + PostgREST), scelto tra 3 opzioni proposte via
     `AskUserQuestion` (alternative: Cloudflare Workers+D1, Firebase Firestore) — nessun server
     custom da scrivere/mantenere, RLS al posto di un livello di validazione applicativo.
     **Database condiviso con un'altra applicazione dell'utente** — vincolo esplicito "non
     cancellare nulla, aggiungi solo quello che ti serve": ogni oggetto nuovo ha prefisso
     `myroad_` per escludere collisioni di namespace nello schema `public` condiviso.
  2. **Identità: nickname libero, nessun account/login** (scelto tra 3 opzioni) — identità
     anonima per-dispositivo (`device_id`, `crypto.randomUUID()` generato pigramente al primo
     uso, persistito in `carriera:leaderboard-settings`). **Reso obbligatorio in corsa** (non
     solo opzionale in Impostazioni come pianificato inizialmente): campo richiesto anche in
     `IdentityForm.tsx`, non si può iniziare una carriera senza — motivo dell'utente: altrimenti
     molti giocatori non lo avrebbero mai impostato e sarebbero rimasti fuori dalla classifica,
     vanificando lo scopo "classifica di tutti gli utenti".
  3. **Formato: 4 categorie stile Hall of Fame** (OVR più alto/più trofei/più ricco/più popolare),
     non un punteggio composito — riusa esattamente gli stessi 4 assi della Hall of Fame locale
     già esistente (`computeHallOfFame` in `satisfaction.ts`), ora globale invece che per-browser.
  4. **Pubblicazione: automatica alla fine di ogni carriera, non un bottone** — cambiato in corsa
     su richiesta esplicita ("l'invio deve essere automatico una volta finita la carriera"),
     ribaltando la scelta iniziale (bottone "Pubblica il tuo punteggio" con stati idle/loading/
     done/error). Effect dedicato in `CareerGame.tsx` (guardia `useRef`, stesso pattern di
     `archivedRef` in `useCareerGame.ts` per l'archivio locale), `CareerSummary.tsx` reso
     puramente passivo (riceve `publishStatus`, mostra solo una riga di testo inline).
  5. **Consolidamento per dispositivo: dominanza di Pareto, non un criterio singolo** — prima
     versione: una sola riga per `device_id`, sostituita solo se il nuovo OVR di picco era più
     alto. **Corretto in corsa** su segnalazione dell'utente ("come ci comportiamo se ovr basso
     ma più patrimonio o più trofei?"): con un solo criterio, una carriera con OVR basso ma tanti
     trofei/patrimonio non entrava mai in classifica in nessuna categoria. Sostituito con
     dominanza di Pareto sui 4 assi (OVR/trofei/patrimonio/popolarità): un dispositivo può avere
     fino a una riga per specialità, un insert viene scartato solo se dominato su *tutti* gli assi
     da una carriera già salvata dello stesso dispositivo.
  6. **Propagazione nickname per dispositivo** — problema trovato dall'utente: con la dominanza
     di Pareto, cambiare nickname nelle Impostazioni lasciava le righe vecchie con il nome
     precedente, facendo apparire la stessa persona come account diversi. Risolto estendendo lo
     stesso trigger: ogni insert (anche quello scartato) sincronizza il nickname corrente su
     *tutte* le righe esistenti dello stesso `device_id`.
  7. **Vista pubblica senza `device_id`** — analizzando il problema precedente, trovato un rischio
     collegato non richiesto esplicitamente: la lettura pubblica (`select=*`) esponeva `device_id`
     a chiunque ispezionasse le richieste di rete, raccoglibile per poi spoofare quel dispositivo.
     Confermato con l'utente (`AskUserQuestion`) di chiuderlo nello stesso giro: nuova vista
     `myroad_leaderboard_public` (colonne senza `device_id`/`client_entry_id`), policy di lettura
     rimossa dalla tabella base, lettura pubblica spostata sulla vista.
  8. **Vulnerabilità reale trovata e corretta durante la verifica della vista** (non pianificata,
     scoperta testando dal vivo contro il DB reale): la vista, creata senza `security_invoker`
     (per bypassare intenzionalmente la RLS in lettura), bypassava la RLS **anche in scrittura** —
     Supabase concede di default privilegi ampi (INSERT/UPDATE/DELETE) ad `anon` su ogni nuovo
     oggetto dello schema `public`, e avere concesso solo `grant select` non revocava quel default
     preesistente. Confermato in pratica con `PATCH`/`DELETE` diretti sull'endpoint della vista:
     un nickname è stato riscritto da remoto e una riga di test cancellata, prima di applicare
     `revoke insert, update, delete on ... from anon` e riverificare (401 "permission denied" su
     tutti e tre dopo il fix). Vedi `supabase/schema.sql` per la nota di avviso lasciata nel file.
- **Perché:** ogni correzione in corsa è nata da un problema reale sollevato dall'utente durante
  l'implementazione (mai anticipato a priori) — coerente con l'approccio "harness/verifica prima,
  poi correggi" già consolidato nel progetto, qui applicato per la prima volta a un sistema con
  stato condiviso cross-utente invece che al solo bilanciamento numerico locale.
- **Alternative:** upsert lato client con policy RLS `UPDATE` per `anon` (per il consolidamento
  per-dispositivo) — scartata: avrebbe richiesto una policy `using (true)` troppo permissiva,
  permettendo a chiunque di sovrascrivere la riga di un altro conoscendone il `device_id`. Preferita
  la soluzione con trigger `SECURITY DEFINER` (`myroad_leaderboard_keep_best`), che opera sempre e
  solo sul `device_id` della riga in inserimento, mantenendo `anon` privo di qualunque grant
  `UPDATE`/`DELETE` diretto sulla tabella per tutta la sessione.
- **Impatto:** `supabase/schema.sql` (nuovo — tabella, indici, RLS, vista, trigger, tutto
  documentato con il ragionamento inline), `.env` (nuovo, committato di proposito — chiave
  pubblicabile Supabase, pensata per essere esposta lato client), `.gitignore` (`.env` ora
  trackabile), `src/lib/leaderboard/{types,settings,client}.ts` (+test), `src/hooks/
  useLeaderboardSettings.ts`, `src/components/features/career/Leaderboard.tsx` (+test), `
  CareerGame.tsx`/`CareerSummary.tsx`/`SettingsPanel.tsx`/`IdentityForm.tsx` (+test) per il
  wiring UI. Nessuna dipendenza nuova in `package.json` (fetch nativo, non `@supabase/supabase-js`
  — SDK sovradimensionato per 2 sole operazioni REST). 543 test verdi, `tsc`/eslint puliti (solo i
  4 warning pre-esistenti `react-hooks/set-state-in-effect`, invariati). **Verificato
  approfonditamente dal vivo contro il progetto Supabase reale** (non solo test automatici) prima
  del rilascio: dominanza di Pareto, propagazione nickname, RLS su tabella base e vista, `CHECK`
  fuori range, tutti i vettori di scrittura sulla vista (INSERT/UPDATE/DELETE) prima e dopo la
  `revoke`, submit+fetch reali su GitHub Pages dal sito pubblicato (non solo `localhost`). Bump
  `package.json`/`package-lock.json` 0.11.1→**0.12.0** (minor, prima feature di rete del
  progetto), `APP_RELEASE_DATE_ISO` aggiornato in `src/constants/app-info.ts`, `dist/MyRoad.exe`
  (FileVersion 0.12.0.0) e `dist/MyRoad.apk` (versionCode 1200/versionName 0.12.0, firma
  verificata con la stessa chiave stabile del progetto) rigenerati e allegati alla [release
  GitHub v0.12.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.12.0). **Non verificato**: exe
  desktop aperto e processo avviato correttamente, ma senza conferma visiva che submit/fetch
  funzionino da quel runtime specifico (nessuno strumento disponibile in sessione per
  ispezionare una finestra WebView2 nativa) — rischio basso, stesso bundle statico già verificato
  su web e già noto per non avere restrizioni di rete specifiche (vedi ricerca iniziale di questa
  feature), ma resta un gap di verifica per una sessione futura. Tabella di produzione ripulita
  dai dati di test dall'utente stesso via Table Editor prima del rilascio.

### Nickname della classifica illeggibile su mobile — riga identità mai stata responsive
- **Data:** 2026-08-14
- **Decisione:** su segnalazione diretta dell'utente ("quando vedo la classifica da cellulare non
  si vede bene"), diagnosticato nel browser (tecnica iframe 390×844, vedi [[conventions]]) che la
  riga identità di ogni voce in `Leaderboard.tsx` (introdotta con la classifica globale v0.12.0,
  vedi voce sopra) era un `flex items-center gap-2` **mai reso responsive**: rank, bandiera,
  nickname, cognome, badge ruolo, `OvrBadge` (44×44px) e badge archetipo competevano tutti per lo
  spazio su un'unica riga, con `truncate` solo sul nickname — su un telefono reale (~390px) il
  nickname, l'unico dato realmente identificativo della voce, veniva schiacciato a 3-4 caratteri
  ("Gio…", "F..."), mentre gli altri elementi `shrink-0` restavano interi. A larghezza desktop
  (pannello ~845px) il problema è invisibile per pura abbondanza di spazio, motivo per cui non era
  mai stato notato prima nonostante fosse presente fin dal primo commit della feature. Fix: la riga
  identità è ora `flex-col` sotto `sm:` (nickname da solo sulla prima riga, con `flex-1 truncate`
  per prendersi tutto lo spazio disponibile) e `sm:flex-row` invariato da `sm:` in su — cognome,
  badge ruolo, `OvrBadge` e badge archetipo si spostano su una seconda riga con `flex-wrap` solo
  sotto `sm:`, nessuna riduzione di informazione mostrata, solo redistribuita su due righe quando
  lo spazio è stretto.
- **Perché:** stesso principio già consolidato nel progetto (bug "silenzioso" che si manifesta solo
  sotto un vincolo di spazio specifico, invisibile a chi sviluppa/verifica solo su desktop) — qui
  la causa è diversa dal pattern `min-h-0` già documentato altrove (quello comprime verticalmente
  un contenitore, questo affollava orizzontalmente una riga con troppi elementi `shrink-0` e un
  solo `truncate`), non è quindi un'istanza dello stesso item di tech-debt aperto su `min-h-0`.
- **Alternative:** nessuna — bug con causa isolata univocamente (una riga flex non responsive), un
  solo modo ragionevole di correggerlo (spezzarla su due righe sotto `sm:`, stesso pattern già
  usato altrove nel file per l'outer `<li>`).
- **Impatto:** `src/components/features/career/Leaderboard.tsx` (unico file toccato). 543 test
  invariati, `tsc --noEmit`/eslint puliti. **Verificato dal vivo nel browser**: iframe mobile
  390×844 su entrambe le categorie testate (OVR/trofei) con nickname ora sempre leggibile per
  intero, e a piena larghezza desktop confermato pixel-identico a prima (nessuna regressione).
  Rilasciato come **v0.12.1** (patch, fix mirato a un solo componente), `dist/MyRoad.exe`
  (FileVersion 0.12.1.0) e `dist/MyRoad.apk` (versionCode 1201/versionName 0.12.1, firma verificata
  con `apksigner verify --print-certs` — stessa chiave stabile del progetto) rigenerati e allegati
  alla [release GitHub v0.12.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.12.1).

### Una sola riga per dispositivo in ogni tab della classifica — viste per-categoria con DISTINCT ON
- **Data:** 2026-08-14
- **Decisione:** l'utente ha modificato direttamente `supabase/schema.sql` e i file client della
  classifica (`types.ts`/`client.ts`/`client.test.ts`) fuori da questa sessione ("ho aggiornato dei
  file"), chiedendo poi di committare e rilasciare. Il cambiamento: la tabella base
  `myroad_leaderboard_entries` tiene volutamente più carriere Pareto-incomparabili dello stesso
  `device_id` (dominanza di Pareto su 4 assi, vedi voce "Classifica globale cross-utente" sopra —
  per non nascondere un record vero su un asse solo perché un'altra carriera dello stesso
  dispositivo è più forte su un asse diverso). Il client però leggeva quel dump grezzo
  (`myroad_leaderboard_public`) per **ogni** tab, quindi lo stesso nickname poteva comparire più
  volte nella stessa categoria con punteggi diversi (osservato dal vivo: "Fetti" 2 volte nella tab
  "OVR più alto"). Fix: 4 nuove viste (`myroad_leaderboard_by_ovr`/`_trophies`/`_savings`/
  `_popularity`) con `distinct on (device_id) ... order by device_id, <asse> desc, created_at desc`
  lato SQL — una riga per dispositivo, la migliore su quell'asse specifico — stesse colonne
  pubbliche della vista precedente (niente `device_id`/`client_entry_id`). Il client ora punta a
  `LEADERBOARD_CATEGORY_VIEW[category]` invece del dump unico. `myroad_leaderboard_public` resta
  nello schema (dashboard/debug), il client non la usa più.
  - **Verifica bloccante prima del rilascio**: una richiesta REST diretta contro il progetto
    Supabase reale ha trovato le 4 viste **non ancora presenti** (`404 PGRST205`) — le modifiche a
    `schema.sql`/`one-row-per-device.sql` (la migrazione incrementale, stesso pattern già seguito
    per questa feature — mai rieseguire `schema.sql` per intero su un DB che ce l'ha già in parte)
    erano scritte ma non ancora eseguite sul DB live. Rilasciare in quello stato avrebbe rotto la
    classifica per tutti gli utenti (404 su ogni tab). Bloccato il rilascio finché l'utente non ha
    eseguito `one-row-per-device.sql` nell'SQL Editor di Supabase; poi riverificato dal vivo: tutte
    e 4 le viste raggiungibili (200), non scrivibili da `anon` (PATCH/DELETE/POST → 500 "Views that
    do not select from a single table or view are not automatically updatable" — sono viste con
    subquery, strutturalmente non aggiornabili da Postgres a prescindere dai grant, quindi nessuna
    ripetizione della vulnerabilità RLS-bypass trovata sulla vista precedente), nessun `device_id`
    nel payload. Verificato anche end-to-end nell'app reale (dev server): tab "OVR più alto" passata
    da 3 righe (con "Fetti" duplicato) a 2, tab "Più trofei" corretta allo stesso modo.
- **Perché:** conferma diretta del principio già consolidato nel progetto ("verificare sempre dal
  vivo contro Supabase reale prima di rilasciare, non fidarsi che lo script/la migrazione sia stata
  eseguita solo perché il codice è stato scritto") — qui il gap non era nel codice ma tra codice e
  stato del DB, invisibile a `tsc`/test/lint che non toccano la rete.
- **Alternative:** nessuna — la duplicazione era un bug reale con una causa isolata univocamente
  (lettura dal dump grezzo invece che da una vista deduplicata), un solo modo ragionevole di
  correggerlo lato SQL (DISTINCT ON, coerente con lo stile già usato per la vista pubblica e per il
  trigger di dominanza di Pareto).
- **Impatto:** `supabase/schema.sql`, `supabase/one-row-per-device.sql` (nuovo, migrazione
  incrementale — primo file di questo tipo lasciato nel repo invece di essere applicato e
  scartato, utile come documentazione di cosa gira realmente sul DB live), `src/lib/leaderboard/
  types.ts` (+`LEADERBOARD_CATEGORY_VIEW`), `client.ts` (+1 test in `client.test.ts`, 544 totali).
  `tsc --noEmit`/eslint puliti. Rilasciato come **v0.12.2** (patch), `dist/MyRoad.exe` (FileVersion
  0.12.2.0) e `dist/MyRoad.apk` (versionCode 1202/versionName 0.12.2, firma verificata — stesso
  SHA-256 certificato delle release precedenti) rigenerati e allegati alla [release GitHub
  v0.12.2](https://github.com/Gioixxx/MyRoad/releases/tag/v0.12.2).

### Tre fix urgenti prima di riprendere l'allenatore: terminologia, nickname unico, password su Allenatore — release v0.13.0
- **Data:** 2026-08-16
- **Decisione:** sessione di 3 richieste esplicite dell'utente, in mezzo al lavoro sulla modalità
  allenatore (`feature/carriera-allenatore`, Fase A+B già committate da sessione precedente —
  vedi sotto per il contesto di quel lavoro, mai ancora documentato in memoria prima d'ora).
  1. **"ciclo" → "stagione"** in tutti i testi visibili al giocatore (cartellino, storico, overlay
     obiettivo/infortunio, titoli/hint decisioni calciatore e allenatore) — lasciati invariati i
     commenti interni al codice, dove "ciclo" resta il concetto tecnico corretto (1-3 stagioni a
     seconda del ritmo).
  2. **Nickname unico tra dispositivi in classifica**: nuova tabella `myroad_nickname_claims` +
     trigger `myroad_claim_nickname` (`supabase/nickname-uniqueness.sql`, specchiato in
     `schema.sql`) che gira PRIMA di `myroad_leaderboard_keep_best_trigger` (ordine alfabetico dei
     nomi trigger) e rifiuta l'insert se il nickname è già di un altro `device_id` — non un
     `UNIQUE` diretto sulla colonna (deve poter ripetersi tra righe dello stesso dispositivo). La
     migrazione include un `truncate` della classifica esistente su richiesta esplicita
     dell'utente ("mettiamo il reset della classifica"): senza azzerare, il primo dispositivo a
     pubblicare dopo la migrazione avrebbe "vinto" per caso un nickname già legittimamente in uso
     da altri prima della regola. Nuova RPC `myroad_nickname_available` + controllo "onBlur" in
     `IdentityForm`/`SettingsPanel` per un feedback immediato, con un messaggio dedicato in
     `CareerSummary` come backstop se lo scontro avviene comunque in pubblicazione (race
     condition). Rimossa anche la tab "Più popolare" dalla classifica (solo lato UI, tipo/vista/
     trigger restano intatti per restare reversibile).
  3. **Password per la modalità Allenatore + nessun proseguimento dopo il ritiro**: nuovo step
     `coach-gate` in `CareerGame.tsx` (componente locale `CoachModeGate`) — cliccando "Allenatore"
     nel menu compare un campo password invece di entrare direttamente, verificata client-side in
     `lib/coach-career/access.ts` (password **`coach2026`**, scelta dall'utente — filtro leggero,
     non vera sicurezza, il sorgente resta pubblico su GitHub). Rimosso il bottone "Nuova carriera"
     dalla schermata di fine carriera allenatore: dopo il ritiro si può solo tornare al menu, non
     iniziare un'altra carriera allenatore. Motivo esplicito dell'utente: poter rilasciare e
     testare la modalità allenatore (ancora WIP) senza esporla ai giocatori occasionali.
  **Contesto del lavoro allenatore già presente sul branch** (mai documentato in memoria prima):
  Fase A (`c4d40e3`, standalone giocabile end-to-end — reputazione al posto dell'OVR, 4 categorie
  di decisione, `pickWeighted` condivisa estratta in `lib/shared/weighted-random.ts`) e Fase B
  (`18db9a8`, categorie forzate/ordinarie restanti — crisi societaria, coppa/coppa continentale,
  scandalo riusando le soglie di `shadow.ts`, trofei/premio "Allenatore della stagione/anno").
  Verificate dal vivo nel browser dalla sessione che le ha scritte (non da questa).
- **Perché:** i primi due punti sono correzioni dirette segnalate dall'utente durante il playtest
  (terminologia poco chiara, bug reale di integrità dati in classifica). Il terzo è una scelta di
  processo: rendere possibile rilasciare in produzione (main + GitHub Pages) il lavoro sull'
  allenatore senza che sia già "in pasto" ai giocatori — permette di continuare a svilupparlo e
  testarlo dal vivo sul sito pubblico senza il rischio di un rilascio percepito come incompleto.
- **Alternative:** per il nickname, un vincolo `UNIQUE` diretto sulla colonna — scartato, non
  esprime la regola reale (un dispositivo può avere più righe con lo stesso nickname, una per
  specialità). Per la modalità allenatore, un feature flag/env var invece di una password in-app —
  scartato: avrebbe richiesto una build separata per i tester, mentre la password permette lo
  stesso identico deploy pubblico con un accesso selettivo.
- **Impatto:** `src/components/features/career/{CareerGame,CareerSummary,CareerTable,
  MomentOverlay,PlayerCard,IdentityForm,SettingsPanel,Leaderboard}.tsx`,
  `src/components/features/coach/CoachCareerGame.tsx`, `src/lib/career/{decisions,satisfaction}.ts`,
  `src/lib/coach-career/{decisions,access}.ts` (nuovo), `src/lib/leaderboard/{client,types}.ts`,
  `supabase/schema.sql`, `supabase/nickname-uniqueness.sql` (nuovo). 595 test verdi (era 589),
  `tsc --noEmit`/`npm run build` puliti, lint invariato (i 4 warning `react-hooks/set-state-in-
  effect` pre-esistenti, confermati via `git stash` prima di procedere). Merge fast-forward
  `feature/carriera-allenatore` → `main` (nessun conflitto, main era un antenato diretto). Bump
  `package.json`/`package-lock.json` 0.12.2→**0.13.0** (minor, per il volume complessivo — Fase
  A+B allenatore incluse in questo rilascio insieme ai 3 fix). `dist/MyRoad.exe` (FileVersion
  0.13.0.0) e `dist/MyRoad.apk` (versionCode 1300/versionName 0.13.0, firma verificata) rigenerati
  e allegati alla [release GitHub v0.13.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.13.0).
  Deploy GitHub Pages verificato verde dopo il push (`gh run watch`). **⚠️ Azione manuale
  richiesta**: `supabase/nickname-uniqueness.sql` va eseguito dall'utente sul progetto Supabase
  live — finché non lo fa, il controllo di unicità nickname non è attivo (documentato anche nelle
  note della release). **Non verificato in questa sessione**: coach-gate/blocco proseguimento non
  testati dal vivo nel browser (sessione di codice+release) — vedi [[tech-debt]].

### Continuazione sviluppo Allenatore: Fase C (continuità), parità UI, harness di bilanciamento — bug reale di reputazione trovato e corretto
- **Data:** 2026-08-16
- **Decisione:** su richiesta dell'utente di continuare lo sviluppo della modalità Allenatore
  dopo l'esecuzione di `supabase/nickname-uniqueness.sql`, scelte 3 delle 4 direzioni proposte
  (`AskUserQuestion`): **Fase C** (continuità calciatore→allenatore, mai iniziata), **parità UI**
  col calciatore (overlay celebrativi, storico club, chip relazioni/traits/shadow — assenti),
  **bilanciamento con harness + playtest** (formule mai misurate). Esclusa la Fase D (archivio/
  Hall of Fame allenatore) — resta backlog.
  1. **Fase C**: nuovo `lib/coach-career/bridge.ts` (`seedCoachFromArchivedCareer`,
     `isEligibleForCoachContinuity`/`COACH_CONTINUITY_MIN_PEAK_OVR=80`, `nudgeTraitsFromArchetype`
     con nudge fisso per archetipo) — età di partenza = età di ritiro del calciatore (non
     `COACH_STARTING_AGE`), patrimonio/popolarità ereditati 1:1, reputazione con bonus limitato
     (picco OVR/trofei). `engine.ts::createCoach` accetta un `seed?: Partial<Coach>` opzionale
     applicato sopra la base standard, con reputazione ri-clampata al tetto rollato per sicurezza.
     `CareerArchive.tsx` mostra "Inizia carriera da allenatore" solo per entry con `peakOvr>=80`,
     passa dallo **stesso gate password** dell'ingresso ordinario (`CareerGame.tsx`:
     `pendingCoachSeed` portato attraverso lo step `coach-gate`, poi `onCoachCareer(seedEntry)` →
     `page.tsx` → `CoachCareerGame`). Identità (cognome/nazionalità) precompilata ma editabile
     nello step di creazione (stesso pattern già usato per la persistenza ultima identità
     calciatore), non forzata.
  2. **Parità UI**: nuovo `CoachMomentOverlay.tsx` (mirror strutturale — non tipizzato — di
     `MomentOverlay.tsx` calciatore: stesso shell chalk-panel/confetti/focus-trap/auto-dismiss,
     union `CoachMoment` propria con `trophy`/`award`/`promoted`/`relegated`/`sacked`/`objective`)
     e `CoachHistoryTable.tsx` (mirror di `CareerTable.tsx` per `CoachStint`, con piazzamento/
     coppa al posto di statistiche di gioco). Chip archetipo/rumors (riuso diretto di
     `deriveArchetype`/`SHADOW_RUMOR_THRESHOLD` dal calciatore, stessa soglia `clubHistory>=4`) e
     riga relazioni (società/stampa/capitano/rivale con affinità, riuso di `formatAffinity`)
     aggiunti al cartellino allenatore. `COACH_AWARD_LABELS` spostato da un const locale in
     `CoachCareerGame.tsx` a `coach-satisfaction.ts` (unica fonte, riusato anche dall'overlay).
     Duplicazione UI deliberata rispetto a estendere `MomentOverlay.tsx`: stesso principio già
     dichiarato nel piano di design per l'intero dominio allenatore ("parallelo, mai toccare tipi/
     switch del calciatore già in produzione").
  3. **Bilanciamento — bug reale trovato con l'harness**: nuovo `lib/coach-career/simulation.ts`
     (`simulateCoachCareer`, mirror di `career/simulation.ts`) + `scripts/coach-simulate.ts` +
     `vitest.coach-simulate.config.mts` + `npm run coach-simulate` (mirror completo del setup
     calciatore). Prima esecuzione: **reputazione di picco media 35.6 su 2000 carriere (appena
     sopra i 35 di partenza), 0 titoli e 0 promozioni mai osservati**. Diagnosticato con uno
     script di debug ad-hoc (poi rimosso): `EXPECTED_FINISH_RANK_BY_PRESTIGE` (`engine.ts`,
     giudica sovra/sotto-performance per reputazione/boardConfidence) e `expectedLeagueFinishRank`
     (`season-outcome.ts`, determina l'esito reale in campo) erano state tarate a tavolino in
     sessioni/momenti diversi, senza un ancoraggio comune — a `COACH_STARTING_REPUTATION=35` il
     delta di reputazione medio era negativo per **ogni** fascia di prestigio (da -0.7 a -1.7 a
     stagione), intrappolando ogni carriera vicino al valore di partenza. Fix in due passi,
     entrambi misurati con l'harness prima/dopo: (1) `EXPECTED_FINISH_RANK_BY_PRESTIGE` ora
     **derivata per costruzione** da `expectedLeagueFinishRank` valutata a una reputazione di
     riferimento per fascia (0/1/2/3 → 40/58/78/95 nel primo giro, poi abbassata a 30/50/70/90 nel
     secondo — vedi punto successivo), invece di 4 costanti indipendenti — le due formule non
     possono più andare fuori sincrono per una modifica isolata a una sola delle due; (2) anche con
     l'ancoraggio, un delta medio vicino a zero per costruzione (equilibrio) restava quasi piatto
     per via dell'arrotondamento a intero in `advanceSeasons` (`Math.round`, assorbe variazioni
     sotto ±0.5) — riferimenti abbassati sotto la soglia di fascia (non a metà) + 
     `REPUTATION_OVERPERFORM_STEP` 2.2→4 per dare un margine di crescita reale invece di un
     pareggio statistico. Risultato finale: reputazione di picco media 43.5 (20% delle carriere
     supera 55, 4.9% supera 70), trofei/award/promozioni non più a zero (rari ma presenti), tasso
     di esonero sceso da 92.5% a 69.3% delle carriere. **Non ulteriormente iterato** oltre questo
     giro (stesso standard "harness → misura → aggiusta → rimisura → fermati quando non più
     degenere" già consolidato per il calciatore) — 80% delle carriere resta comunque sotto
     reputazione 55 di picco, plausibile per un sim di management (la maggioranza resta un
     allenatore onesto, una minoranza sfonda), non riaperto senza nuovi dati.
- **Perché:** la scoperta del bug di reputazione è il punto centrale — prima di questo fix la
  modalità Allenatore era sostanzialmente non giocabile in modo soddisfacente (nessuna crescita
  percepibile, nessun trofeo raggiungibile in migliaia di carriere simulate), un problema che
  senza l'harness (mai scritto finora per questa modalità, a differenza del calciatore) sarebbe
  stato visibile solo playtestando a lungo e attribuito erroneamente a "sfortuna" invece che a un
  difetto strutturale nelle costanti.
- **Alternative:** rimuovere `Math.round` e tenere la reputazione frazionaria — scartata, mostrare
  decimali in UI (badge reputazione) sarebbe stato un downgrade visivo per un beneficio che
  l'aumento di `REPUTATION_OVERPERFORM_STEP` ottiene senza toccare il tipo/formato del dato.
- **Impatto:** `lib/coach-career/{bridge,simulation}.ts` (nuovi), `components/features/coach/
  {CoachHistoryTable,CoachMomentOverlay}.tsx` (nuovi), `scripts/coach-simulate.ts` (nuovo),
  `vitest.coach-simulate.config.mts` (nuovo), `engine.ts` (formula reputazione ancorata + seed in
  `createCoach`), `coach-satisfaction.ts` (+`COACH_AWARD_LABELS`), `CoachCareerGame.tsx` (seed/
  overlay/storico/chip), `useCoachCareerGame.ts` (+seed in `startCareer`, +`clubName`/`crestUrl`
  in `CoachCycleOutcomeSummary`), `CareerArchive.tsx`/`CareerGame.tsx`/`page.tsx` (wiring Fase C),
  `package.json` (+script `coach-simulate`). 595 test invariati (nessuna suite nuova aggiunta in
  questo giro — `simulation.ts`/`bridge.ts` coperti solo dall'harness/playtest manuale, non da
  unit test dedicati, stesso gap già accettato altrove per gli script di taratura calciatore),
  `tsc --noEmit` pulito, lint con **5 errori `react-hooks/set-state-in-effect`** (i 4 pre-esistenti
  invariati + 1 nuovo nell'effetto che deriva i moment allenatore da `state.lastOutcome` in
  `CoachCareerGame.tsx` — stesso identico pattern mai risolto nell'equivalente calciatore
  `CareerGame.tsx:439`, lasciato coerente con quel precedente invece di correggerlo isolatamente).
  **Verificato approfonditamente dal vivo nel browser** (dev server): gate password (accesso
  negato con password errata, mostrato "Password errata", accesso concesso con `coach2026`),
  resume di un save esistente con chip archetipo/rumors/relazioni e storico tutti renderizzati
  correttamente, corsa in coppa forzata, crisi societaria forzata → overlay "Esonerato" con testo/
  icona/colore negativo corretti (club pre-esonero, non null), nuove offerte di lavoro da
  svincolato. **Fase C verificata end-to-end iniettando un `ArchivedCareer` di test in
  `localStorage` (peakOvr 88, 3 trofei, patrimonio 25M€)**: bottone "Inizia carriera da
  allenatore" comparso solo per quell'entry, gate password superato, form precompilato
  ("Bianchi"/Italy) con banner di continuità, carriera creata con età 36 (= retiredAge), 
  reputazione 43 (35+4.5+3, formula confermata esatta), popolarità 72 e patrimonio 25.000.000€
  tutti ereditati correttamente (controllato via `localStorage.getItem("carriera:coach-save")`).
  **Non verificato in questo giro**: overlay trofeo/premio/promozione (solo l'overlay esonero è
  stato osservato dal vivo, gli altri kind condividono lo stesso shell/codice già verificato per
  il calciatore ma non sono stati innescati in questa sessione di playtest) — vedi [[tech-debt]].
  Nessun rilascio/bump di versione in questo giro — lavoro non ancora committato a fine sessione.

- **Aggiornamento stessa sessione — QA con 3 agenti paralleli + bug reale trovato e corretto**:
  su richiesta esplicita dell'utente di verificare anche via agenti la grafica/UI, lanciati 3 fork
  in parallelo (isolati sulle rispettive chiavi localStorage: coach-save/coach-archive esclusivi
  al primo, save/archive calciatore esclusivi al secondo, append-only condiviso su
  `carriera:archive` per il terzo). Risultato: zero regressioni calciatore, mobile 390px solido su
  tutte le schermate di entrambe le modalità (incluso il blocco-proseguimento-dopo-ritiro
  allenatore, ora confermato — chiude quella voce di [[tech-debt]]). **Bug reale**: l'overlay
  "Trofeo" in modalità allenatore spariva quasi subito invece di restare visibile 6s — causa
  isolata a `CoachCareerGame.tsx` che montava `<CoachMomentOverlay>` **senza `key` prop**, a
  differenza dell'equivalente calciatore (`CareerGame.tsx:867`, `key={moment-${momentIndex}-
  ${kind}}`) — il timer di auto-dismiss del componente si aspetta un remount ad ogni nuovo moment
  (dichiarato anche nel commento interno del componente). Fix: aggiunta la stessa `key` in
  `CoachCareerGame.tsx`. Una seconda segnalazione ("badge Egyptian Premier League mancante
  nell'overlay") si è rivelata la STESSA causa (URL badge/trofeo verificati raggiungibili con
  `curl`, 200 su entrambi) — non un gap dati. Verificato dopo il fix: `tsc`/595 test/lint
  invariati, e dal vivo nel browser forzando reputazione/prestigio club alti via `localStorage`
  per innescare un vero titolo di campionato — overlay "Trofeo" (Bundesliga) ora resta visibile
  per intero con immagine trofeo, badge e barra di progresso corretti.

### Bug grave di layout allenatore su desktop (contenuto tagliato, nessuno scroll) — layout allineato a 3 colonne come il calciatore — release v0.14.1
- **Data:** 2026-08-17
- **Decisione:** su segnalazione diretta dell'utente ("ci sono gravi problemi di visualizzazione
  della carriera allenatore, usa il browser per definirli e risolverli"), diagnosticato con
  Claude in Chrome (dev server locale): a schermo desktop/tablet (≥1024px, breakpoint `lg:`) il
  wrapper in `src/app/page.tsx` che ospita `CoachCareerGame` aveva `lg:overflow-hidden` — pattern
  copiato dal wrapper del calciatore in `CareerGame.tsx`, dove funziona perché lì il contenuto
  interno è un **layout a 3 colonne** (`lg:grid-cols-[20rem_1fr_16rem]`) con scroll indipendente
  per colonna. `CoachCareerGame.tsx` invece era una singola colonna verticale
  (`flex flex-col gap-3`, cartellino + storico + decisione impilati) senza alcun meccanismo di
  scroll interno — risultato: quando il contenuto superava l'altezza della viewport (già con 5-6
  stagioni di storico + un banner esito), la parte in eccesso veniva **tagliata e resa
  irraggiungibile**, senza alcuno scroll possibile (verificato via DOM: `scrollHeight` 867px
  contro `clientHeight` 675px con `overflow-y: hidden` calcolato). L'utente ha poi chiarito
  esplicitamente ("la ui deve essere come quella del calciatore") che la richiesta non era solo
  "far scrollare qualcosa", ma allineare strutturalmente il layout a quello del calciatore — non
  la correzione minima (rimuovere `lg:overflow-hidden` dal wrapper, lasciando `CoachCareerGame`
  a colonna singola con scroll di pagina) inizialmente applicata e poi scartata.
  Ristrutturato `CoachCareerGame.tsx` per replicare esattamente il grid del calciatore: cartellino
  allenatore (stats, obiettivo, chip archetipo/rumors/relazioni) in colonna sinistra
  (`lg:max-h-full lg:overflow-y-auto`), banner esito/decisione al centro, `CoachHistoryTable`
  ("Storico") a destra con lo stesso pattern `flex-1 overflow-y-auto lg:min-h-0` del calciatore —
  ciascuna colonna scrolla in modo indipendente su desktop, il wrapper esterno torna ad avere
  `lg:overflow-hidden` (coerente col calciatore, non più un bug perché ora il layout interno lo
  supporta). Sotto `lg:` il grid collassa a colonna singola come prima, nessuna modifica al
  comportamento mobile.
- **Perché:** il bug nasceva da un pattern CSS (`overflow-y-auto ... lg:overflow-hidden`) copiato
  da un componente con un'architettura interna diversa (multi-colonna con scroll proprio) senza
  portare anche l'architettura che lo rende sicuro — stesso principio generale già visto altre
  volte nel progetto (una classe "presa in prestito" da un altro componente senza il contesto che
  la rende corretta). La correzione strutturale (allineare l'intero layout, non solo rimuovere la
  classe che tagliava il contenuto) è stata la richiesta esplicita dell'utente dopo il primo fix
  minimo, per ottenere parità visiva reale col calciatore, non solo l'assenza del bug.
- **Alternative:** rimuovere `lg:overflow-hidden` dal wrapper lasciando `CoachCareerGame` a
  colonna singola con scroll dell'intera pagina — scartata dall'utente esplicitamente, voleva la
  UI (struttura a colonne) uguale al calciatore, non solo il bug risolto con un fix più semplice.
- **Impatto:** `src/components/features/coach/CoachCareerGame.tsx` (unico file toccato,
  `src/app/page.tsx` riportato allo stato originale). 595 test invariati, `tsc --noEmit` pulito,
  lint invariato (stesso warning `react-hooks/set-state-in-effect` già noto e accettato).
  **Verificato dal vivo nel browser** (Claude in Chrome, non solo test automatici): desktop
  1568px — creata una carriera da zero e giocati ~8 cicli fino a riempire lo Storico oltre
  l'altezza della viewport, confermato lo scrollbar interno solo sulla colonna Storico mentre
  cartellino e decisione restano fissi (comportamento identico al calciatore); mobile (iframe
  390×844) — layout a colonna singola invariato, Storico raggiungibile scrollando l'intera
  pagina. Overlay (premio individuale, obiettivo raggiunto), form di creazione, offerte di
  lavoro, crisi societaria, rinnovo contratto — tutti verificati funzionanti nel nuovo layout.
  Rilasciato come **v0.14.1** (patch, fix mirato a un componente), `dist/MyRoad.exe` (FileVersion
  0.14.1.0) e `dist/MyRoad.apk` (versionCode 1401/versionName 0.14.1, firma verificata con la
  stessa chiave stabile del progetto) rigenerati e allegati alla [release GitHub
  v0.14.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.14.1). Deploy GitHub Pages
  verificato verde dopo il push (`gh run watch`).

### Completamento carriera Allenatore: riepilogo di fine carriera, archivio/Hall of Fame (Fase D), sblocco pubblico
- **Data:** 2026-08-18
- **Decisione:** su richiesta esplicita dell'utente ("finiamo la parte della carriera
  allenatore"), chiarito lo scope con `AskUserQuestion` — l'utente ha scelto **tutte e 4** le
  opzioni proposte: riepilogo completo, archivio/Hall of Fame, sblocco pubblico, rifiniture
  minori incontrate lungo il percorso. Sessione pianificata in modalità Plan (3 agenti Explore +
  1 agente Plan paralleli, poi verifica a mano dei file critici prima di scrivere il piano finale)
  data l'ampiezza (nuovi componenti, rimozione di un meccanismo di accesso già in produzione).
  **Scoperta chiave**: la persistenza dell'archivio allenatore (`ArchivedCoachCareer`,
  `buildCoachArchiveEntry`/`loadCoachArchive`/`appendToCoachArchive` in `storage.ts`, chiave
  `carriera:coach-archive`) esisteva già al 100% e `useCoachCareerGame.ts` archiviava già in
  automatico al ritiro — il lavoro reale era quasi interamente UI + una funzione di Hall of Fame,
  non nuova persistenza.
  1. **Riepilogo di fine carriera** (`CoachSummary.tsx`, nuovo): mirror di `CareerSummary.tsx` —
     hero con titolo migliore/archetipo/shadow-title, griglia 4 statistiche (reputazione di picco
     via `OvrBadge` in `size="sm"` — stesso pattern già collaudato in `CoachHistoryTable` per
     evitare l'etichetta "OVR" fuorviante — club allenati/trofei/premi), patrimonio+
     `PopularityMeter`, riga Hall of Fame, titoli di stagione, "momenti" (trofei/premi recenti,
     nessun equivalente "nazionale"), griglia dettaglio a 2 colonne (non 3: **Storico** riusa
     direttamente `CoachHistoryTable` invece di scrivere un'aggregazione stile
     `summarizeClubHistory` — `CoachStint` non ha stat additive da sommare, solo un
     `outcome`/`reputation` di fine ciclo, quindi il merge-per-club del calciatore non avrebbe
     nulla di significativo da aggregare; **Trofei e premi** usa `CompetitionBadge` per i trofei
     (componente condiviso, `Trophy` è un tipo riusato as-is) e l'idioma icona `AwardIcon` già
     stabilito in `CoachMomentOverlay.tsx` per i premi, **non** `AwardBadge` del calciatore
     (tipizzato su `AwardType`, unione chiusa incompatibile con `CoachAwardType` — riusarlo
     avrebbe richiesto toccare uno switch calciatore, vietato dalla convenzione "parallelo, mai
     toccare tipi/switch del calciatore già in produzione"). `EmptyShowcase` duplicato localmente
     (8 righe, stesso principio di duplicazione deliberata già dichiarato nell'header di
     `CoachMomentOverlay.tsx`) invece di esportarlo dal file calciatore.
  2. **Archivio + Hall of Fame (Fase D)** (`CoachArchive.tsx`, nuovo; `computeCoachHallOfFame`/
     `coachHallOfFameWinsFor` aggiunte a `coach-satisfaction.ts`): mirror esatto di
     `computeHallOfFame`/`hallOfFameWinsFor` (`lib/career/satisfaction.ts`) sui 4 assi rinominati
     OVR→reputazione (`peakReputation`/`trophyCount`/`finalSavingsEur`/`finalPopularity`).
     Nessuna prop di continuità allenatore→presidente (non esiste, resta backlog).
  3. **Sblocco pubblico**: rimossa interamente la password `coach2026` — eliminato
     `src/lib/coach-career/access.ts` (unico importatore era `CareerGame.tsx`, nessun test lo
     referenziava), rimosso lo step `"coach-gate"` (componente `CoachModeGate`, stato
     `coachGateError`/`pendingCoachSeed`, handler `handleShowCoachGate`/`handleContinueAsCoach`/
     `handleCoachGateSubmit`) da `CareerGame.tsx` — `MainMenu`'s `onCoach` e `CareerArchive`'s
     `onContinueAsCoach` ora chiamano `onCoachCareer` direttamente. **Ribalta esplicitamente** la
     decisione del 2026-08-16 (gate + nessun proseguimento) — non un fix, una scelta deliberata di
     rendere la modalità pubblica ora che è più completa. Riattivato "Nuova carriera" dopo il
     ritiro (chiama `restart()`, già esistente e inutilizzato nell'hook). **Design "seed una
     tantum per mount"**: `CoachCareerGame` cattura `seedEntry` (il bonus di continuità Fase C) in
     un `useState(seedEntry)` locale (`activeSeed`), letto una sola volta al mount — dato che
     `page.tsx` non rimonta mai `CoachCareerGame` tra un ritiro e il successivo "Nuova carriera"
     (resta sempre `mode === "coach"`), questo garantisce che il bonus di continuità si applichi
     una volta sola per carriera e non venga ri-applicato ad ogni "Nuova carriera" successiva;
     `handleRestart` azzera esplicitamente `activeSeed` a `null`.
  4. **Rifiniture minori (item 4 dello scope) — 2 problemi reali trovati durante la verifica dal
     vivo, non una caccia dedicata**: (a) il bottone "Le mie carriere" non compariva subito dopo
     il **primissimo** ritiro di una sessione perché il branch `state.retired` leggeva la
     visibilità del bottone dallo stato `archiveEntries` (aggiornato solo al mount/restart/apertura
     archivio), mentre i dati della Hall of Fame venivano letti freschi via `loadCoachArchive()`
     diretto — corretto calcolando `freshArchive = loadCoachArchive()` una volta e usandolo per
     entrambi; (b) l'utente ha segnalato dal vivo che le card delle offerte di lavoro/mercato
     (`CoachDecisionPanel`) non mostravano mai lo stemma del club nonostante
     `CoachDecisionOption.club?: Club` fosse già nel tipo — mai cablato UI, a differenza
     dell'equivalente calciatore (`OfferPanel.tsx`). Aggiunto `ClubCrest` condizionale
     (`option.club ? ... : ...`) prima della label, riusando il componente già importato.
- **Perché:** l'utente ha scelto lo scope più ampio disponibile — completare davvero la modalità
  prima di eventualmente proseguire con altre carriere multi-ruolo (vedi backlog "calciatore→
  allenatore→presidente"). Il riuso quasi totale di pattern e componenti già esistenti (mirror
  1:1 di `CareerSummary`/`CareerArchive`/`computeHallOfFame`, riuso diretto di
  `CoachHistoryTable`/`ClubCrest`/`CompetitionBadge`/`OvrBadge`/`PopularityMeter`/`CountryFlag`)
  ha reso il lavoro quasi interamente additivo, coerente con la convenzione "parallelo, mai
  toccare tipi/switch del calciatore già in produzione" seguita per l'intero dominio allenatore
  finora.
- **Alternative:** nessuna per lo scope (scelto esplicitamente dall'utente su tutte e 4 le
  opzioni). Per `EmptyShowcase`/`HofRow`, esportarli da `CareerSummary.tsx`/`CareerArchive.tsx`
  invece di duplicarli — scartato, stesso principio di zero-rischio-di-regressione-UI-calciatore
  già stabilito nel progetto per l'intero dominio allenatore.
- **Impatto:** `src/lib/coach-career/coach-satisfaction.ts` (+`CoachHallOfFameRecords`/
  `computeCoachHallOfFame`/`coachHallOfFameWinsFor`), `src/components/features/coach/
  {CoachSummary,CoachArchive}.tsx` (nuovi), `src/components/features/coach/CoachCareerGame.tsx`
  (navigazione "Le mie carriere"/`activeSeed`/`handleRestart`, + crest sulle card decisione),
  `src/components/features/career/CareerGame.tsx` (rimozione gate), `src/lib/coach-career/
  access.ts` (eliminato). 595 test invariati, `tsc --noEmit` pulito, lint con i soli errori
  `react-hooks/set-state-in-effect` pre-esistenti (nessuno nuovo introdotto dai file toccati).
  **Verificato a fondo dal vivo nel browser** (non solo test automatici, sessione con dev server
  reale): rimozione gate confermata da menu e da Fase C continuità (nessuna password richiesta in
  entrambi i punti d'accesso), riepilogo di fine carriera con dati reali (forzando età/trofei/
  premi via `localStorage`, stesso metodo già consolidato nel progetto), Hall of Fame verificata
  con **2 carriere retirate con profili deliberatamente diversi** (una reputazione/trofei-alta,
  una ricca/popolare) — confermato che i 4 assi si distribuiscono su vincitori diversi, non tutti
  sulla stessa carriera; archivio con entrambe le voci e pillole HoF corrette; continuità Fase C
  (bonus reputazione 35+5+3=43, patrimonio/popolarità ereditati) verificata end-to-end da
  un'entry calciatore iniettata con peakOvr≥80; fix del bottone "Le mie carriere" verificato
  ricaricando con lo stesso identico scenario; fix dello stemma club verificato sia col caso
  presente (offerte di lavoro) sia col caso assente (conferenza stampa, nessuna regressione).
  **Non verificato dal vivo in questo giro** (per costo sproporzionato rispetto al guadagno di
  confidenza — la logica è stata comunque implementata e revisionata con cura): il comportamento
  di "Nuova carriera" su una carriera continuity-seedata specificamente (il fatto che non
  ri-applichi il bonus una seconda volta) — richiederebbe ~20 cicli di gioco reale per portare
  un allenatore da 36 a 75 anni senza poter usare lo shortcut via `localStorage` (che bypassa
  proprio lo stato React in memoria che si vuole testare). Nessun rilascio/bump di versione in
  questo giro — lavoro non ancora committato a fine sessione.

### Etichette ruoli calciatore in stile europeo/italiano (POR/DC/TS/TD/…) — solo visualizzazione
- **Data:** 2026-08-18
- **Decisione:** su richiesta dell'utente ("mettiamo quelli europei tipo ATT TS TD"), i 12
  ruoli mostrati a schermo (`GK`/`CB`/`LB`/`RB`/`CDM`/`CM`/`CAM`/`LM`/`RM`/`LW`/`RW`/`ST`) ora
  usano sigle italiane (`POR`/`DC`/`TS`/`TD`/`MED`/`CC`/`TRQ`/`ES`/`ED`/`AS`/`AD`/`ATT`,
  mappatura proposta e confermata dall'utente via `AskUserQuestion`). Nuovo
  `src/lib/career/position-labels.ts` (`POSITION_LABELS: Record<Position, string>`, esaustivo)
  — **il tipo `Position` e i suoi 12 valori interni non sono stati toccati**, solo la
  visualizzazione. Scelta deliberata dopo un'esplorazione completa: `Position` è chiave di
  logica in `Record<Position, …>` esaustivi (`ROLE_WEIGHTS` in `progression.ts`,
  `OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS` in `attributes.ts`, `POSITION_CHANGE_ADJACENCY`/
  `DECLINE_PREFERRED_TARGETS` in `decisions.ts`), `Set<Position>` (`injuries.ts`,
  `last-identity.ts`), confronti `===` sparsi (`playstyles.ts`/`satisfaction.ts`/`tactics.ts`/
  `loop.ts`/`engine.ts`), ed è **persistito** in localStorage (save/archivio) e su Supabase
  (colonna `position` della classifica globale) — rinominare i valori stessi avrebbe richiesto
  una migrazione dati reale, non solo un refactor, oltre a toccare i 17 file di test (81
  occorrenze) che usano i literal come dato di dominio. Una label map di sola visualizzazione è
  zero-rischio su tutto questo, stesso pattern già usato ovunque nel progetto (`AWARD_LABELS`,
  `ARCHETYPE_LABELS`, `COACH_SEASON_TITLE_LABELS`, ecc.).
  Wiring: `PositionPicker.tsx` (bottoni del selettore ruolo in creazione personaggio),
  `PlayerCard.tsx` (chip sul cartellino), `CareerArchive.tsx`/`Leaderboard.tsx` (chip per voce),
  e 2 generatori in `decisions.ts` (`generatePositionChangeDecision`/`generateCoachRoleRequest`)
  dove il codice ruolo era interpolato **dentro il testo narrativo** (`Diventa ${newPosition}`,
  "Ti riadatti al ruolo di...") — tradotto solo il testo mostrato, il campo `newPosition`
  sull'opzione (usato da `changePosition()` per assegnare il ruolo reale) resta invariato.
- **Perché:** l'utente ha chiesto esplicitamente etichette europee/italiane per i ruoli in tutta
  l'interfaccia calciatore; l'approccio label-map-only evita ogni rischio di rottura su dati
  persistiti/logica/test per un cambiamento che è puramente estetico nell'intento dell'utente.
- **Alternative:** rinominare i valori del tipo `Position` stesso — scartata per il costo/rischio
  sproporzionato (migrazione dati + refactor esteso) rispetto a un cambiamento richiesto come
  puramente visivo.
- **Impatto:** `src/lib/career/position-labels.ts` (nuovo), `PositionPicker.tsx`,
  `PlayerCard.tsx`, `CareerArchive.tsx`, `Leaderboard.tsx`, `decisions.ts`. Un test esistente
  (`IdentityForm.test.tsx`, 2 occorrenze) selezionava il radio del ruolo per nome accessibile
  `"ST"` — aggiornato a `"ATT"` dato che il testo del bottone (e quindi il suo nome accessibile)
  è cambiato; l'asserzione sul valore effettivo inviato (`position: "ST"`) resta invariata,
  confermando che solo la label è cambiata, non il dato. 595 test verdi, `tsc --noEmit`/lint
  puliti. **Verificato dal vivo nel browser**: selettore ruolo in creazione personaggio (griglia
  campo completa AS/ATT/AD/TRQ/ES/CC/ED/MED/TS/DC/TD/POR), cartellino in partita ("ATT" al posto
  di "ST"), voce archivio ("TS" per un ruolo LB iniettato via localStorage). Non verificato dal
  vivo: il testo delle 2 decisioni di cambio ruolo (RNG/stato-gated, stessa sostituzione di
  stringa già provata corretta altrove) e la Classifica globale (stesso identico pattern di
  `CareerArchive.tsx`, rischio basso). Nessun rilascio/bump di versione in questo giro.

### Piano "Due classifiche" (campionato posizionale + ranking globale) — Fasi 1-3 implementate, NON committate
- **Data:** 2026-08-18/19
- **Decisione:** l'utente ha portato un piano già scritto (`C:\Users\Gioix\.cursor\plans\due_classifiche_8e0866c3.plan.md`,
  esterno al repo — **leggerlo per il disegno completo**, qui solo il riassunto di cosa è stato
  realmente implementato e perché diverge in alcuni punti). Piano in 6 fasi: 1) motore condiviso
  posizione/zone, 2) wiring allenatore, 3) wiring calciatore, 4) ritaratura con l'harness, 5)
  schema Supabase incrementale per una classifica globale a punteggio unico (due piste
  calciatore/allenatore), 6) esecuzione SQL live + release. Prima di implementare, una review ha
  trovato 4 criticità concrete nel piano stesso (poi corrette nel file del piano, non solo qui):
  1) il cambio "una stint per ciclo" → "una stint per stagione" rompe in silenzio 4 contatori che
     leggevano `clubHistory.length`/`.filter().length` come proxy di "cicli allo stesso club"
     (soglia rivale, tenure allenatore, chip "Stile", **e un quinto trovato solo implementando**:
     `summarizeClubHistory`'s `stintCount`, mostrato come "×N" nel riepilogo — mostrava "×3" per
     un giocatore rimasto 3 stagioni consecutive nello stesso club in un solo ciclo Express) — fix
     comune: `cycleId?: number` opzionale su `ClubStint`/`CoachStint` (tag condiviso da tutte le
     stagioni dello stesso ciclo, incrementato via `Player.cyclesPlayed`/`Coach.cyclesPlayed`) +
     nuovo `lib/shared/club-tenure.ts::cyclesAtClub` (conta cicli distinti, non stint — fallback a
     indice negativo univoco per le stint pre-migrazione senza `cycleId`, dove una stint era già
     un ciclo per definizione).
  2) le zone `continental`/`promotion` collassavano sullo stesso `LeagueFinish` derivato usato
     anche per il copy societario — fix: `objectiveLabelFor`/`offerHint` (coach) ora scelgono il
     testo in base al **tier del club**, non solo al rank numerico (niente "qualifica il club a
     una coppa europea" per una promozione dalla Championship).
  3) il trigger di unicità nickname (`myroad_00_claim_nickname_trigger`) è agganciato solo a
     `myroad_leaderboard_entries` — **non ancora rilevante**, la Fase 5 (schema) non è stata
     toccata in questa sessione, resta un promemoria per quando si arriverà lì.
  4) cadenza del roll coppa nazionale calciatore non specificata dal piano originale — decisa
     esplicitamente durante l'implementazione: **per stagione**, come il campionato (vedi sotto).
- **Fase 1 — `lib/shared/league-season.ts` + `src/data/league-rules.ts`** (nuovi): `LeagueRules`
  (size/title/continental/promotion/relegation spots) derivate da `leagueForTier` per la reale
  disponibilità dei tier in `data/clubs.ts` (es. Championship: 7 club in dati ma 24 "posizioni"
  astratte — il piazzamento non richiede un club reale per ogni posto, solo per chi promuove/
  retrocede davvero). `rollLeaguePosition`/`zoneForPosition`/`applySeasonToClub` — promozione/
  retrocessione ora deterministica dalla zona (niente secondo roll indipendente come il vecchio
  `applyClubTierMovement`, rimosso insieme al suo equivalente allenatore). `expectedLeagueFinishRank`
  (già esistente solo per l'allenatore in `coach-career/season-outcome.ts`) spostata qui: stessa
  formula (`prestige*0.55 + rating/40`) riusata da entrambi i motori, OVR al posto della
  reputazione per il calciatore. 23 test dedicati.
  - **Continental access — idea del piano scartata a metà implementazione**: la prima versione di
    `applySeasonToClub` rendeva l'accesso alla coppa continentale "guadagnato" stagione per
    stagione (zona `title`/`continental`), sostituendo il comportamento attuale (sempre attivo per
    un club di tier 1, derivato dal prestigio). Scartato non appena un test di regressione ha
    mostrato l'effetto a catena: `shouldTriggerContinentalFinal` (evento forzato "finale
    continentale") legge `player.club?.competitions.continental` come gate booleano — renderlo
    quasi sempre `false` avrebbe reso l'evento quasi mai raggiungibile, un cambiamento enorme e non
    richiesto esplicitamente. `applySeasonToClub` fa **solo** promozione/retrocessione.
- **Fase 2 — allenatore** (`lib/coach-career/{engine,season-outcome,loop,coach-satisfaction,
  coach-relations,decisions}.ts`): `advanceOneSeason` estratta da `advanceSeasons`, che ora cicla
  N volte (una `CoachStint` per stagione). **Due bug di raddoppio trovati e corretti prima ancora
  di essere osservati** (stesso meccanismo già noto per `BOARD_CONFIDENCE_DECAY`, segnalato nella
  review del piano): sia il decay di `boardConfidence` sia il logorio di reputazione per età
  (`REPUTATION_AGE_DECLINE_PER_CYCLE`) erano "per ciclo" per costruzione ma sarebbero stati
  applicati N volte per stagione — entrambi ora applicati una sola volta a fine ciclo
  (`reputationAgeDeclineForCycle`, nuova funzione). `STORAGE_VERSION` coach 1→2 (nessuna
  migrazione incrementale, i save v1 vengono scartati — pattern già in uso in questo file).
  `CoachHistoryTable.tsx` mostra il piazzamento reale ("12° · Serie A") invece dell'etichetta
  ambigua.
- **Fase 3 — calciatore** (`lib/career/{engine,trophies,loop,relations,summary}.ts`): stesso
  split `advanceOneSeason`, riusando le primitive **già** a grana singola stagione esistenti in
  `progression.ts` (`projectOvr(...,1,...)`, `projectSeasonStats`) — non servite formule nuove.
  `rollClubTrophies` sostituita da `rollCupTrophy` (solo coppa, il campionato viene dalla zona).
  In `loop.ts`, trofei/movimento categoria ora raccolti su **tutte** le stagioni del ciclo (non
  solo l'ultima, `newTrophiesForCycle`/`lastClubTierMovementInCycle`) — altrimenti un Express
  perdeva 2/3 dei trofei. **Bug reale trovato implementando**: `cycleAgeFrom` (finestra di età per
  il Mondiale/Europei) leggeva `clubHistory[length-1].ageFrom`, che con una stint per stagione è
  solo l'ultima stagione, non l'intero ciclo — corretto a `cycleStints[0].ageFrom`. L'infortunio
  ora taglia le statistiche di **tutte** le stagioni del ciclo (`applyInjuryStatCut` riscritta),
  con la stessa risincronizzazione dell'OVR storico dell'ultima stint già nota da BUG-01
  (2026-08-18) — ripristinata dopo essere stata inizialmente rimossa per errore (il motivo
  originale di BUG-01 non era ovvio a un primo sguardo del nuovo codice). `STORAGE_VERSION`
  calciatore 14→15, `migratePlayerV15` (no-op, `cyclesPlayed` default 0). `CareerTable.tsx`
  mostra il piazzamento reale.
  - **Test flakiness scoperta e isolata**: alcuni test `loop.test.ts` (soglie di promozione/
    retrocessione per un club a prestigio 0) erano intermittenti tra un run e l'altro — causa:
    `createPlayer`/`playerAt()` nei test rollano `attributes` con `Math.random` non seedato di
    default, e con la sensibilità più alta della nuova formula posizionale (OVR nel divisore 40,
    contro il piccolo bonus `CLUB_TROPHY_OVR_BONUS_CAP=0.03` di prima) quel rumore poteva spostare
    il piazzamento oltre il confine di zona tra un run e l'altro. Fix: i test a rischio ora usano
    velocità "intense" (1 stagione) per isolare una singola transizione invece di incatenarne due
    con lo stesso rng costante.
- **Verificato:** suite completa **610/610 test verdi** (stabile su 3 run consecutivi dopo il fix
  di flakiness), `tsc --noEmit` pulito, `npm run simulate`/`npm run coach-simulate` girano senza
  crash su migliaia di carriere simulate — numeri chiaramente fuori bersaglio ma **attesi**, non
  bug: trofeo di club calciatore salito a 90.5% (era ~72%), reputazione di picco allenatore salita
  a 64.2 (era ~43.5) — più roll per carriera con lo stagione-per-stagione. **Nessun rilascio, nessun
  commit** — tutte le modifiche sono nel working tree (`git status` mostra ~33 file modificati/
  nuovi/rimossi), la sessione si è fermata qui su richiesta esplicita dell'utente (Fase 4/5 in una
  sessione futura). Vedi [[sprint]] per lo stato e [[tech-debt]] per i gap noti.
- **Alternative:** nessuna — piano già approvato dall'utente (con le 4 correzioni), implementazione
  fedele salvo la rinuncia al continental-access "guadagnato" (vedi sopra, decisione presa in corsa
  con motivazione tecnica chiara).
- **Impatto:** `lib/shared/{league-season,club-tenure}.ts` + test (nuovi), `data/league-rules.ts`
  (nuovo), `types/{career,coach}.ts` (+campi opzionali `cycleId`/`clubTierChange`/`zone`/`cupWon`/
  `leaguePosition`/`leagueSize`/`cyclesPlayed`), `lib/career/*` e `lib/coach-career/*` (motori
  riscritti), `lib/career/club-progression.ts` e `lib/coach-career/club-progression.ts` **eliminati**
  (superati), `CareerTable.tsx`/`CoachHistoryTable.tsx`/`PlayerCard.tsx`/`CoachCareerGame.tsx` (UI).
  `STORAGE_VERSION` calciatore 15, allenatore 2. **Non toccato**: schema Supabase (Fase 5, il
  piano stesso richiede l'esecuzione SQL manuale dell'utente prima del deploy client), harness
  retuning (Fase 4), release/versione.
