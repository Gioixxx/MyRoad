---
type: memory
tags: [memory, index]
updated: [2026-08-14]
---

# My Road - L'Ascesa — Next.js
> Contesto persistente. Aggiornato da /remember. Vault Obsidian: vedi workflows/obsidian-vault.md.
> Progetto rinominato da "Carriera" a "My Road - L'Ascesa" il 2026-08-07 — vedi [[decisions]] per il dettaglio del rename (repo GitHub, launcher/exe, UI). La cartella locale del repo resta fisicamente `C:\Dev\Carriera` (non rinominata, solo il nome logico del progetto/repo GitHub).

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Vitest · Capacitor (Android) · Supabase (classifica)  **Sprint:** 8/8 fasi complete (build iniziale conclusa) + feature post-build in corso  **Aggiornamento:** 2026-08-14 (v0.12.2 — fix voci duplicate in classifica)

## Contesto
Clone testuale di "Copero — Simulador de carrera" (https://copero.com.ar/juegos/simulador-carrera):
simulatore della carriera di un calciatore, tutto in italiano, nomi reali di club/leghe/nazionali,
solo locale (localStorage, no backend). Piano completo con 4 sezioni di ricerca sul gioco originale
in `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md`. Tutte le 8 fasi della build iniziale
completate: scaffold, dominio puro, dati (84 club/41 paesi), decisioni, UI creazione personaggio,
loop di gioco, fine carriera (CareerSummary), polish (dark mode toggle, empty state, a11y).
Dopo la build iniziale: immagini reali via hotlink (stemmi club, badge competizioni, bandiere
nazionali), packaging `.exe` desktop, un giro di polish su animazioni/momenti celebrativi
(overlay trofeo/premio/convocazione, timeline di carriera), estensione a 124 club/9 paesi, un
sistema "satisfaction" (Hall of Fame, record personali, milestone OVR, titoli di stagione), e
(2026-08-06) una miglioria del motore di gioco su 4 assi — harness di simulazione statistica,
meccaniche mancanti fedeli all'originale (trofei nazionali indipendenti, promozione/
retrocessione, cambio nazionalità), varietà/ritmo degli eventi, pulizia tecnica — e (2026-08-06,
stessa giornata, sessione successiva) un'espansione mondo a 220 club/12 nuovi paesi (CONCACAF/
CAF/AFC) con una nuova meccanica "Giant Killer" (sorpresa di coppa), e (2026-08-06, sessione
successiva ancora) un sistema di **Traits/archetipo di carriera + Shadow (debito morale)** —
vettori di personalità nascosti che derivano uno stile ("Bandiera"/"Mercenario"/"Showman"/
"Professionista"/"Leader"/"Problema"), un meter privato che accumula scelte rischiose fino a
scatenare uno scandalo forzato. Rinominato "Carriera" → "My Road - L'Ascesa" il 2026-08-07. Il
2026-08-08: persistenza dell'ultima identità giocatore tra una carriera e l'altra (prefill del
form di creazione), e immagini reali dei trofei di club/nazionale (accanto al badge, solo
nell'overlay celebrativo) + premi individuali con immagine differenziata per tipo (invertendo la
scelta di icona generica unica del 2026-08-05) + storico spostato in colonna a destra durante la
partita. Il 2026-08-10: correzione leggibilità delle label "kicker" in tutta l'interfaccia
(font troppo piccoli) e primo **packaging Android** via Capacitor — l'export statico Next.js
(già usato per l'exe desktop) wrappato in un progetto nativo Android con icona coerente
all'exe, verificato end-to-end su un tablet reale via ADB (menu, creazione identità, offerte
club, overlay traguardi). Nella stessa giornata (sessione successiva): 3 nuove meccaniche di
motore — **Potenziale dinamico** (tetto OVR individuale che cresce nei cicli "breakout"),
**Attributi granulari** (velocità/tiro/passaggio/difesa/fisico o riflessi/presa/rinvio/piazzamento
per i portieri, con focus di allenamento mirato e cambio ruolo funzionale) e **PlayStyles**
(6 tratti sbloccabili con bonus concreti) — 3 delle 6 meccaniche gestionali proposte dall'utente,
le altre (Scouting/Staff/Match Sharpness) escluse perché richiederebbero gestire un'intera
rosa/club, estranea al gioco single-player. Nella stessa giornata (terza sessione): un
**bilanciamento generale su 7 fasi** per rigiocabilità/divertimento — trovato e corretto un bug
strutturale nel loop prestiti (~29% dei cicli di gioco intrappolati), Shadow/scandalo reso
raggiungibile (era 0%), trofeo di club ridotto (94%→84%), soglie PlayStyle riequilibrate,
archetipi di personalità resi più raggiungibili ("nessuno" 81%→64%) — vedi [[sprint]] e
[[decisions]]. Il 2026-08-11: attivato GitHub Pages come canale live pubblico, poi (sessione
successiva) una sessione di **ottimizzazione layout per schermi di telefono piccoli** — il gioco
funzionava bene su tablet ma non su telefono (bottoni di decisione irraggiungibili). 5 fix
(scroll della schermata di gioco, tap target più grandi, safe-area Android edge-to-edge,
compressione CSS Grid da `min-h-0` non condizionato, pausa musica in background), verificati per
la prima volta su un dispositivo Android reale via debug USB + ispezione DOM/CSSOM con Chrome
DevTools Protocol invece di soli screenshot. Rilasciato come v0.7.1. Il 2026-08-12 (sessione
successiva a v0.9.2, non ancora rilasciata a sé): su richiesta dell'utente di analizzare 7
dinamiche reali della carriera di un calciatore e capire cosa inserire, implementate **fit
tattico col club** (sistema tattico per club derivato proceduralmente, nessun nuovo dato) e
**contratti/potere degli agenti** (clausola rescissoria con trigger forzato reale, bonus alla
firma, negoziazione col procuratore) — le altre 5 dinamiche mappate come già parzialmente coperte
o rimandate a [[backlog]] su richiesta esplicita. Vedi [[decisions]] per il dettaglio completo.
Nella stessa giornata (sessione successiva): una simulazione mobile via iframe iniettato (nuova
tecnica di test in questo ambiente, dato che `resize_window` non altera il viewport reale) ha
trovato e corretto 3 bug di visualizzazione (Storico collassabile, ordine campo/bottone nel form
identità, nomi trofeo troncati) — rilasciata insieme al fit tattico/agenti come v0.10.0. Nella
stessa giornata (sessione successiva): una sessione parallela (Cursor) ha committato direttamente
su `origin/main` un **pass di game-feel sul motore** — infortuni/salvataggio/calendario trofei
nazionale/normalizzazione per-stagione corretti perché "mentivano" al giocatore, offerte di
trasferimento "curate" (non più uniformi casuali), pesi di categoria come conseguenza dello stato
del giocatore, e 3 meccaniche nuove (partita decisiva di campionato, riconversione di ruolo da
declino fisico, relazioni NPC leggere mister/agente/rivale) — trovato e documentato in memoria
(mai scritto dall'autore originale) durante una sessione di rilascio, poi pubblicato come
**v0.11.0**. Nessuna delle nuove meccaniche verificata dal vivo nel browser in questa sessione.
Vedi [[decisions]], [[sprint]] e [[tech-debt]].

## File memoria (carica su richiesta)
> `@file.md` = import Claude · `[[file]]` = wikilink Obsidian (graph). Tieni entrambi.
- @decisions.md — [[decisions]] — scelte tecniche con motivazioni (dal 2026-08-11 in poi)
- decisions-archive.md — [[decisions-archive]] — **eccezione: nessun `@`, non auto-caricato.** Decisioni 2026-08-04→2026-08-10, spostate qui il 2026-08-12 perché `decisions.md` aveva superato i 160KB (oltre la soglia di 100KB del tool Read). Leggere on-demand (Grep poi Read offset+limit) quando serve contesto storico.
- @domain.md — [[domain]] — glossario, entità, regole di business
- @sprint.md — [[sprint]] — task correnti e obiettivi
- @conventions.md — [[conventions]] — pattern specifici del progetto
- @tech-debt.md — [[tech-debt]] — debito tecnico con priorità
- @backlog.md — [[backlog]] — funzionalità e idee lungo termine
- @adr.md — [[adr]] — ADR formali

## Segnalibri critici
- **Classifica globale (2026-08-13/14) su un progetto Supabase CONDIVISO con un'altra
  applicazione dell'utente** (`https://jltfsljuysbipihnjkpn.supabase.co`) — qualunque futura
  modifica allo schema deve usare il prefisso `myroad_` e non toccare mai oggetti senza quel
  prefisso. `supabase/schema.sql` è il riferimento canonico ma **non va rieseguito per intero**
  su un DB che ce l'ha già in parte (fallirebbe su `create table`) — solo blocchi incrementali
  mirati, come fatto 3 volte in questa sessione. `device_id` (identità anonima per-dispositivo)
  **non deve mai essere esposto in lettura pubblica** — vive solo nella tabella base, mai nella
  vista `myroad_leaderboard_public`. **Attenzione se si crea una nuova vista pubblica su Supabase**:
  concedere solo `grant select` non basta, serve sempre anche `revoke insert, update, delete ...
  from anon` esplicito — Supabase concede privilegi ampi di default su ogni nuovo oggetto, e una
  vista senza `security_invoker` bypassa la RLS della tabella sottostante anche in scrittura, non
  solo in lettura (vulnerabilità reale trovata e corretta in questa sessione, vedi [[decisions]]).
- **Rinominato "Carriera" → "My Road - L'Ascesa" (2026-08-07)**: repo GitHub `Gioixxx/Carriera` → `Gioixxx/MyRoad` (con redirect automatico di GitHub), launcher .NET `launcher/MyRoadLauncher/` (era `CarrieraLauncher`), eseguibile `dist/MyRoad.exe` (era `Carriera.exe`), `package.json` name `my-road`, titolo browser/wordmark in-game "My Road - L'Ascesa" — vedi [[decisions]] per l'elenco completo dei file toccati. **La cartella locale resta `C:\Dev\Carriera`** (non rinominata sul filesystem).
- **Repo pubblica dal 2026-08-05** (era privata) — da qui in poi ogni nuovo asset/scelta (immagini, exe in `dist/`, licenze) va valutato assumendo visibilità pubblica, non più "solo io la vedo".
- Il piano di implementazione dettagliato vive FUORI dal repo, in `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md` — leggerlo prima di riprendere lo sviluppo, contiene le meccaniche osservate su 10+ carriere giocate sul sito originale.
- Nell'originale gli award individuali (Pallone d'Oro) e le probabilità di nazionale/coppa continentale sono praticamente irraggiungibili anche in carriere-record — il clone li implementa con soglie deliberatamente più generose (vedi [[decisions]]).
- Stemmi club/competizioni: hotlink TheSportsDB (mai download), integrati nella UI (`Club.crestUrl`, `COMPETITION_BADGES`) — vedi [[decisions]]. Dal 2026-08-08 anche `COMPETITION_TROPHIES` (campo `strTrophy`, il trofeo fisico reale) mostrato accanto al badge **solo** nell'overlay celebrativo `MomentOverlay.tsx` — vedi [[decisions]]. Premi individuali (Pallone d'Oro/Player of the Season/capocannoniere): dal 2026-08-08 ciascuno ha un'immagine propria (`src/data/award-images.ts`), non più l'unica icona Twemoji generica identica per tutti e tre del 2026-08-05 — l'utente ha scelto esplicitamente immagini reali accettando il rischio di trademark non mitigato da una fonte "as is" come TheSportsDB; **due candidati scartati in corsa** per problemi scoperti solo visivamente (foto Golden Boot con logo sponsor "Barclays", icona "player of the season" che riproduceva la sagoma della Coppa del Mondo) — vedi [[decisions]] per il dettaglio, principio utile per qualunque futura ricerca immagini: verificare sempre visivamente il contenuto reale di un asset "reale" trovato, non solo la licenza testuale.
- Eseguibile Windows: `dist/MyRoad.exe` (rinominato da `Carriera.exe` il 2026-08-07), **non più committato nel repo** dal 2026-08-05 (solo `.gitignore`d, distribuito via GitHub Release) — vedi [[decisions]] per la scelta tecnica (.NET/WebView2) e per la decisione di rimuoverlo dal tracking git, e `launcher/README.md` per come rigenerarlo.
- Momenti celebrativi (trofeo/premio/convocazione nazionale) mostrati come overlay modale animato (`MomentOverlay.tsx`) con confetti, rispettando sempre `prefers-reduced-motion` — vedi [[decisions]].
- Il launcher desktop ha un auto-updater (`UpdateChecker.cs`/`UpdateInstaller.cs`): controlla GitHub Releases all'avvio e si autosostituisce su conferma. **Chi taglia una release deve far combaciare il tag git (`vX.Y.Z`) con `package.json.version`**, altrimenti il check non funziona — vedi [[decisions]] e `launcher/README.md`.
- Sistema "satisfaction" (`lib/career/satisfaction.ts`, 2026-08-06): Hall of Fame sull'archivio multi-carriera, record personali, milestone OVR, titoli di stagione — **non ancora verificato end-to-end nel browser**, vedi [[tech-debt]].
- Campi per-ruolo su `StatLine`/`PersonalRecords` (es. `goalsAgainst`/`cleanSheets` per i portieri, 2026-08-06): **sempre opzionali e additivi**, mai un discriminated union — per non rompere le fixture di test esistenti che costruiscono oggetti letterali. Seguire lo stesso pattern per qualunque futura statistica specifica di ruolo. Vedi [[decisions]].
- `Country` (`data/countries.ts`) ha ora un campo `confederation` (UEFA/CONMEBOL/CONCACAF/CAF/AFC) usato da `rollNationalTrophies` (plurale dal 2026-08-06, era `rollNationalTrophy`) per il nome reale del trofeo continentale — usare `getCountry(name)` per il lookup invece di un `.find()` inline.
- Harness di simulazione statistica (`lib/career/simulation.ts`, 2026-08-06): `npm run simulate` gira migliaia di carriere con RNG reale e stampa le frequenze osservate di trofei/award/callup/infortuni/ritiro/categoria — usarlo per ritarare qualunque formula di probabilità prima/dopo, non fissarne una alla cieca. Gira su una config vitest separata (`vitest.simulate.config.mts`) perché non è un file `*.test.ts` — vedi [[decisions]]. Il giocatore simulato sceglie a caso tra le opzioni (`pickUniformOption`), quindi sottostima le frequenze che richiedono OVR alto (award, convocazione) o scelte direzionalmente consistenti (archetipo) rispetto a un giocatore reale — vedi [[tech-debt]].
- Anti-ripetizione ora esiste su due livelli in `lib/career/loop.ts` (2026-08-06): categoria (`recentCategories`, preesistente) e singolo evento dentro club-crisis/lifestyle/narrative (`LoopContext.recentDecisionIds?`, nuovo) — `pickNextDecision` ora ritorna anche il `context` aggiornato, i call site in `useCareerGame.ts`/`simulation.ts` devono salvarlo per far persistere la finestra tra un ciclo e l'altro.
- `STORAGE_VERSION` è 5 dal 2026-08-06 (era 4) — `Player.traits`/`shadow`/`shadowFlags` (Traits/archetipo + Shadow, vedi sotto), migrati da `migratePlayerV4`.
- Traits/archetipo + Shadow (`lib/career/traits.ts`/`shadow.ts`, 2026-08-06): `Player.traits` (5 vettori 0-100) deriva un `ArchetypeId | null` a runtime (`deriveArchetype`, mai salvato), `Player.shadow` (debito morale 0-100) scatena scandalo forzato (categoria `"scandal"`) sopra soglia 50 e blocca la convocazione in nazionale sopra 75 — **soglie/formule di `shadow.ts` sono valori espliciti dati dall'utente, non tarati**, a differenza delle soglie archetipo in `traits.ts` che sono state tarate con l'harness. Solo la parte "scrittura" (scelte→delta) è implementata; la parte "lettura" (offerte/eventi pesati per archetipo) è backlog — vedi [[decisions]] e [[backlog]]. **Non ancora verificato end-to-end nel browser**, vedi [[tech-debt]].
- `data/clubs.ts` copre ora 24 paesi/220 club (2026-08-06, era 10 paesi/124 club) — `Confederation` unificato a 5 valori (import da `@/data/countries`), `League.cup` **ora opzionale** (il Messico non ha coppa nazionale attiva). Arabia Saudita e Qatar restano senza club (ricerca interrotta su richiesta esplicita — vedi [[backlog]]). Nuovo `npm run sync-rosters` (`scripts/sync-league-rosters.ts`) per diagnosticare scostamenti dai roster reali nel tempo — vedi [[decisions]] per i limiti noti dell'API gratuita TheSportsDB scoperti costruendolo.
- Nuova categoria di decisione `"cup-upset"` ("Giant Killer", 2026-08-06): un club di prestigio ≤1 sfida una corazzata in coppa nazionale, stesso mini-gioco `PenaltyShootout` della finale continentale — vedi [[decisions]].
- Identità dell'ultimo giocatore creato persistita in `carriera:last-identity` (`src/lib/last-identity.ts`, 2026-08-08): `IdentityForm` si precompila con cognome/numero/piede/nazionalità/ruolo dell'ultima carriera iniziata (salvata in `startCareer`, non al ritiro) — chiave localStorage dedicata, nessun bump di `STORAGE_VERSION`.
- `CareerTable` ("Storico") è ora una terza colonna a destra durante la partita (2026-08-08, `CareerGame.tsx`), non più impilata sotto il pannello decisioni — nuovo prop `compact` forza il layout a lista (era solo mobile) anche in questa colonna stretta a schermi larghi. Corpo pagina allargato su tutti gli step nella stessa sessione — vedi [[decisions]].
- **Bilanciamento generale su 7 fasi** (`lib/career/loop.ts`/`shadow.ts`/`traits.ts`/`trophies.ts`/`playstyles.ts`/`decisions.ts`, 2026-08-10): fix di un bug reale (loop prestiti, `LoopContext.loanReturnBounces`), `SHADOW_SCANDAL_THRESHOLD` 50→28, `CLUB_TROPHY_PRESTIGE_WEIGHT` 0.08→0.03, soglie PlayStyle non più piatte (per-stile, `playstyles.ts`), diverse magnitudini `traitsDelta`/`shadowDelta` alzate in `decisions.ts` — **scoperto un vincolo strutturale di "frequenza di tocco"**: per Shadow/scandalo e archetipi, sotto ~11 cicli/carriera un giocatore incontra troppo poche scelte rilevanti per queste meccaniche perché alzare magnitudini/abbassare soglie crei una separazione netta tra scelta pulita e scelta diretta (satura empiricamente a ~2.5-3x) — vedi [[decisions]] e [[tech-debt]] prima di provare a ritarare ulteriormente questi due sistemi, altrimenti si rischia di ripetere la stessa esplorazione. `simulation.ts` ha ora picker "diretti" riusabili (`pickRiskSeekingOption`/`makeTrainingFocusPicker`/`makeTraitDirectedPicker`) per misurare la raggiungibilità reale, non solo il pavimento di `pickUniformOption`.
- **GitHub Pages live dal 2026-08-11**: `https://gioixxx.github.io/MyRoad/`, deploy automatico ad ogni push a `main` via `.github/workflows/deploy-pages.yml` (fallisce/non pubblica se i test non passano). **Ribalta la precedente decisione "mai online"** (2026-08-10, packaging Android) — se in futuro si rivaluta TWA/Bubblewrap per Android, il prerequisito di hosting pubblico ora esiste. `next.config.ts` applica `basePath="/MyRoad"` solo con `GITHUB_PAGES=true` in ambiente — build exe/APK restano root-relative, invariate. Qualunque nuovo riferimento hardcoded a un file in `public/` (pattern già visto 2 volte: audio, sprite maglia) **deve** usare `withBasePath()` (`lib/utils.ts`), altrimenti 404 su Pages — vedi [[decisions]].
- **Bug ricorrente da tenere a mente per qualunque futuro layout mobile (2026-08-11)**: un `min-h-0` Tailwind **non condizionato da breakpoint**, su un item flex/grid dentro un contenitore la cui altezza disponibile può essere inferiore al contenuto reale, azzera l'"automatic minimum size" dell'item — la riga/colonna può essere compressa arbitrariamente sotto il proprio bisogno reale (fino a un floor esplicito se c'è un `min-h-[...]`, altrimenti verso zero). Con `overflow:visible` il contenuto trabocca visivamente ma la riga *successiva* nella griglia parte comunque dal box nominale (compresso), causando sovrapposizioni; con `overflow:hidden` il contenuto in eccesso sparisce del tutto. Verificare `git grep 'min-h-0'` su qualunque nuovo componente di layout mobile — vedi [[decisions]] per il caso reale che ha rivelato il meccanismo (`CareerGame.tsx`/`PositionPicker.tsx`, release v0.7.1). Metodo di verifica mobile efficace: debug USB Android + Chrome DevTools Protocol (ispezione diretta di `getBoundingClientRect()`/`scrollHeight` via `Runtime.evaluate` su WebSocket) invece di soli screenshot.
