---
type: sprint
tags: [memory, sprint]
updated: [2026-08-10]
---
> Aggiornato da /sprint — sessione 2026-08-06: espansione mondo (12 nuovi paesi, 96 club reali su
> CONCACAF/CAF/AFC) + nuova meccanica "Giant Killer" (sorpresa di coppa) + strumento diagnostico
> `sync-league-rosters.ts`, committato e rilasciato come v0.4.0. Arabia Saudita e Qatar interrotti
> su richiesta esplicita dell'utente, vedi [[backlog]]. **Sessione successiva stesso giorno:**
> Traits/archetipo di carriera + Shadow (debito morale), committata come 3965789, poi un refactor
> di layout/styling (005d674) subito dopo — vedi voci dedicate più sotto. **Sessione 2026-08-07:**
> rename completo "Carriera" → "My Road - L'Ascesa" (repo GitHub, launcher/exe, UI) — vedi
> [[decisions]] per il dettaglio completo. **Sessione 2026-08-08:** persistenza dell'ultima identità
> giocatore tra una carriera e l'altra (commit 43d892a); immagini reali dei trofei club/nazionale +
> premi individuali differenziati per tipo + layout storico/corpo pagina (commit 3ab2020, 1c865ab)
> — vedi [[decisions]] per il dettaglio completo di entrambe. **Sessione 2026-08-10:** leggibilità
> label "kicker" corrette in tutta l'app (commit 1b718f3) + packaging Android via Capacitor con
> icona coerente all'exe, verificato end-to-end su tablet reale via ADB (commit 4fbb899) — vedi
> [[decisions]] per il dettaglio completo di entrambe. **Sessione 2026-08-10 (stesso giorno,
> sessione successiva):** 3 delle 6 meccaniche gestionali proposte dall'utente — Potenziale
> dinamico, Attributi granulari + Focus allenamento + Cambio ruolo funzionale, PlayStyles —
> committate come f45c6cf (Scouting/Staff/Match Sharpness escluse, vedi [[backlog]]). Bug di
> bilanciamento trovato e corretto con `npm run simulate` (OVR di picco medio crollato 82→64,
> causa matematica identificata e risolta) — vedi [[decisions]] per il dettaglio completo.
> **Sessione 2026-08-10 (stesso giorno, terza sessione):** bilanciamento generale su 7 fasi per
> rigiocabilità/divertimento — fix di un bug strutturale nel loop prestiti (~29% dei cicli di
> gioco intrappolati), Shadow/scandalo reso raggiungibile (era 0%), trofeo di club ridotto
> (94%→84%), soglie PlayStyle riequilibrate per stile, archetipi di personalità resi più
> raggiungibili — vedi [[decisions]] per il dettaglio completo di tutte e 7 le fasi.
> **Sessione 2026-08-11 (deploy Pages, poi sessione successiva):** ottimizzazione layout per
> schermi di telefono piccoli — 5 fix (scroll schermata di gioco, tap target, safe-area Android,
> compressione CSS Grid con `min-h-0` non condizionato, pausa musica in background), verificati
> per la prima volta su un dispositivo Android reale via debug USB + Chrome DevTools remoto invece
> di soli screenshot. Rilasciato come v0.7.1 (commit c8c3f88). Vedi [[decisions]] per il dettaglio
> completo, in particolare il meccanismo di compressione CSS Grid scoperto (rilevante per
> qualunque futuro layout mobile).

# Sprint Corrente
Stato lavoro in corso. Aggiornato con /sprint. Backlog in [[backlog]], debito in [[tech-debt]].

## Sprint attivo
- **Nome/Numero:** Simulatore di carriera calcistica — build iniziale
- **Periodo:** 2026-08-04 → (in corso)
- **Obiettivo:** completare le 8 fasi del piano in `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md`, arrivare a una carriera giocabile end-to-end nel browser

## Task
- [x] Fase 1 — Scaffold Next.js 16 + TS + Tailwind v4, dark mode, cn(), design tokens
- [x] Fase 2 — Dominio puro: types/career.ts, engine.ts, progression.ts, market.ts (76 test)
- [x] Fase 3 — Dati: clubs.ts (84 club, 4 paesi/8 leghe), countries.ts (41 nazionalità)
- [x] Fase 4 — decisions.ts: pool completo decisioni, generatori club-dipendenti, eventi condizionati dal contesto
- [x] Fase 5 — UI creazione personaggio: IdentityForm, SpeedSelect, design "Cartellino del giocatore" (verde campo/pergamena/oro)
- [x] Fase 6 — UI loop di gioco: lib/career/loop.ts (orchestrazione ciclo, contesto prestiti), trophies.ts (trofei club/nazionale/award), hooks/useCareerGame.ts (stato + autosave/resume localStorage), PlayerCard/CareerTable/OfferPanel/DecisionPanel/PenaltyShootout — verificato end-to-end nel browser (academy offer → transfer → loan → loan-return → sign permanente → eventi lifestyle probabilistici → refresh con persistenza corretta)
- [x] Fase 7 — Fine carriera: `lib/career/summary.ts` (dominio puro: `summarizeClubHistory` accorpa `clubHistory` per club sommando le statistiche di cicli separati, `peakOvr`), `CareerSummary.tsx` vero al posto del placeholder (stats OVR max/presenze/gol/assist, tabella club aggregata, sezione nazionale, lista trofei+premi con label italiane per `AwardType`, bottone "Gioca ancora"), 6 nuovi test in `summary.test.ts` — verificato end-to-end nel browser (carriera giocata fino a "Ritirati" in end-of-cycle, riepilogo con aggregazione multi-club/multi-ciclo corretta, "Gioca ancora" resetta al passo 1)
- [x] Fase 8 — Polish: `ThemeToggle` (next-themes, Sun/Moon lucide, guard `mounted` per evitare mismatch di hydration) inserito in `CareerGame.tsx` su ogni schermata; focus-visible mancante aggiunto alle opzioni della dropdown `NationalitySelect`; empty state "vetrina vuota" (`EmptyShowcase`, box tratteggiato + icona trofeo attenuata) per le sezioni Nazionale/Trofei-premi mai raggiunte in `CareerSummary.tsx` — verificato end-to-end nel browser in light e dark mode (carriera giocata fino al ritiro automatico a 40 anni con 1 trofeo e nazionale mai convocata, per vedere sia lo stato pieno sia quello vuoto); `npm run build` di produzione verificata. Responsive non verificabile visivamente in questa sessione: `resize_window` del tool browser non altera il viewport di rendering effettivo in questo ambiente (limite già documentato nel piano, "Esplorazione aggiuntiva 3, punto 0") — verificato invece via audit delle classi Tailwind responsive già presenti in ogni componente (grid che si impila sotto i breakpoint, tabelle con scroll orizzontale)
- [x] Commit iniziale (60ce3b1) — fasi 1-5
- [x] Commit fase 6 (f73f0a1)
- [x] Redesign visivo del loop di gioco — su richiesta esplicita dell'utente ("tutto visibile e stilisticamente accattivante"): layout a due colonne su desktop (PlayerCard sticky + contenuto), PlayerCard ridisegnata in stile "cartellino" (perforato, JerseyBadge condiviso con la schermata di creazione, conteggio trofei/premi sempre visibile), stelle di prestigio come icone lucide invece di testo, hover/elevazione sulle card decisione, sfondo con atmosfera texture-campo (`field-atmosphere` in globals.css) per non lasciare vuoto lo spazio ai lati su schermi larghi

## Ricerca completata (agenti background)
- 3 sezioni "Esplorazione aggiuntiva" nel piano da carriere giocate sul sito originale (13+ carriere totali) — l'ultima (3) ha confermato ritiro automatico esattamente a 40 anni (3 osservazioni concordanti) e Express = 3 stagioni/ciclo (già implementato correttamente)
- Ricerca URL hotlink per stemmi club/competizioni completata in `.claude/research/team-crests.md` — nomi reali confermati, integrazione nella UI non ancora decisa (solo testuale per ora) → vedi [[backlog]]

- [x] **Integrazione immagini club/competizioni/premi** (2026-08-05, dopo che la repo è diventata pubblica): `Club.crestUrl` (84/84, TheSportsDB) + `data/competition-badges.ts` (`COMPETITION_BADGES`, 14 club + Mondiale/Europei) + `AwardBadge.tsx` (icona Twemoji generica per i 3 `AwardType`, non foto reale — vedi [[decisions]]). Componenti nuovi `ClubCrest`/`CompetitionBadge`/`AwardBadge` (stesso pattern `onError` → fallback), wired in `PlayerCard`/`OfferPanel`/`CareerTable`/`CareerSummary`. `next.config.ts` passato a `output: "export"` (già fatto per il launcher .exe, riusato qui). Verificato end-to-end nel browser: stemmi visibili su offerte/club corrente/storico, badge reali Serie A + Premier League nella lista trofei del summary, URL Twemoji verificato via rete (200, image/svg+xml). 129 test (era 124, +5 su `clubs.ts`/`competition-badges.ts`), lint/typecheck/build puliti. `dist/Carriera.exe` rigenerato con la nuova build.

- [x] **Bandiere nazionali via hotlink flagcdn.com** (2026-08-05): nuovo `CountryFlag.tsx` (stesso pattern `onError` di `ClubCrest`), sostituisce l'emoji diretta in `JerseyBadge`/`JerseyCard`/`NationalitySelect`/`IdentityForm`/`PlayerCard` (prop `flag?: string` → `country?: Country`) — vedi [[decisions]] per il perché (emoji bandiera inaffidabile su Windows, incluse le nazionali britanniche). Verificato end-to-end nel browser: dropdown nazionalità con bandiere reali (incluse Inghilterra/Scozia/Galles), bandiera sul cartellino in creazione personaggio e sulla PlayerCard in partita. 129 test invariati, typecheck/lint puliti sui file toccati.

- [x] **Momenti di carriera celebrativi + timeline + animazioni** (2026-08-05, 3 commit: ba0083c, 41b9a01, c882a44 — non registrati in memoria al momento del commit, recuperati in questa sessione): `MomentOverlay.tsx` (overlay modale con focus trap + confetti CSS per trofeo/premio/convocazione nazionale, coda di `buildCareerMoments` gestita da `CareerGame.tsx`), `CareerTimeline.tsx` (barra di progresso 16→40 anni con marker trofei/premi), `hooks/useMotion.ts` (`usePrefersReducedMotion` + `useCountUp`, usato per animare le statistiche in `PlayerCard`), `SetupStepDots` per la navigazione nella creazione personaggio, `lib/career/award-labels.ts` (label italiane `AwardType` estratte per riuso). Vedi [[decisions]] per il ragionamento su overlay modale vs toast e sul rispetto di `prefers-reduced-motion`. Non ancora verificato end-to-end nel browser in questa sessione di recupero — solo letto il codice per documentarlo.

- [x] **Auto-updater del launcher desktop** (2026-08-05, commit 0d56d8a): `UpdateChecker.cs`/`UpdateInstaller.cs` (nuovi) confrontano l'`AssemblyVersion` corrente con l'ultima release GitHub all'avvio (`MainForm.OnLoad`, fire-and-forget) e, su conferma dell'utente, scaricano+applicano l'update via script `.bat` self-replace (necessario perché l'exe è self-contained single-file, non può sovrascrivere se stesso in esecuzione). `scripts/build-launcher.ps1` ora stampa l'`AssemblyVersion` da `package.json.version` invece di duplicarla nel `.csproj`. Vedi [[decisions]] per il design completo. Verificato: `dotnet build` pulito (solo warning preesistente WebView2/WindowsBase), build completo via `build-launcher.ps1` con `dist/Carriera.exe` FileVersion=0.1.0.0 confermato, avvio dell'exe senza crash (5s). **Non verificato visivamente**: il dialog "aggiornamento disponibile" e il flusso download→self-replace→relaunch (richiede abbassare temporaneamente `package.json.version` per forzare il percorso positivo, vedi step 4 del piano — non ancora eseguito).

- [x] **4 nuove feature di gameplay** (2026-08-05, commit 4ddb366, piano approvato in
  `C:\Users\Gioix\.claude\plans\dobbiamo-trovare-delle-idee-cryptic-blossom.md`): **infortuni
  persistenti** (`lib/career/injuries.ts`, stato su `Player.injury`, badge in `PlayerCard`, righe
  dedicate nell'`OutcomeBanner`, outcome lifestyle "Doppie sedute"/"Ritiro speciale" ora
  infortunano davvero invece di essere solo testo); **asse economico-reputazionale**
  (`lib/career/wallet.ts`: stipendio/patrimonio/popolarità, nuova categoria di decisioni
  "sponsor", `PopularityMeter.tsx`, patrimonio/popolarità visibili su `PlayerCard`/
  `CareerSummary`); **hardening trofeo continentale** (`DecisionOutcome.continentalWin`
  esplicito al posto del match sulla stringa "Gol!" in `resultText` — la feature esisteva già,
  solo il rilevamento era fragile); **archivio multi-carriera** (`CareerArchive.tsx`, nuova
  schermata "Le mie carriere", chiave localStorage separata `carriera:archive` con cap FIFO 100
  voci, archiviazione al ritiro). Migrazione storage `STORAGE_VERSION` 1→2 che arricchisce i
  save v1 esistenti con i default dei nuovi campi invece di scartarli. 167 test (era 129),
  lint/typecheck/build puliti, verificato end-to-end nel browser (migrazione save v1, infortuni,
  stipendio/patrimonio/popolarità, trofeo continentale, archivio).

- [x] **Icona custom + sfondo di caricamento per il launcher** (2026-08-05, commit 52e70ac, su
  richiesta esplicita dell'utente con immagini fornite in `img/icona.png`/`img/sfondo.png`, poi
  rimossa dopo la copia — vedi sotto): `assets/app.ico` (multi-risoluzione, generato dall'icona
  fornita) impostato come `ApplicationIcon` nel `.csproj`; `MainForm.cs` lo estrae a runtime
  dall'exe (`Icon.ExtractAssociatedIcon`) per l'icona della finestra. `assets/sfondo.png`
  (embedded resource) mostrato a tutto schermo dietro al `WebView2` finché la pagina non ha
  finito di caricare.

- [x] **Finestra massimizzata all'avvio + durata minima sfondo caricamento** (2026-08-05, commit
  a60e456, su richiesta esplicita): `WindowState = Maximized` invece della dimensione fissa
  1280×860; sfondo di caricamento mostrato per almeno 1,5s prima di lasciare spazio al
  `WebView2` (il caricamento da server locale è troppo rapido perché si veda altrimenti). Rimossa
  la cartella `img/` con gli originali (duplicati in `launcher/CarrieraLauncher/assets/`).

- [x] **Prima release versionata pubblicata: v0.2.0** (2026-08-05, commit b308736 + tag v0.2.0,
  su richiesta esplicita dell'utente): bump `package.json`/`package-lock.json` 0.1.0→0.2.0
  (il vecchio tag `v0.1.0` puntava a un commit ormai superato — bump necessario perché
  l'auto-updater del launcher confronta le versioni), `dist/Carriera.exe` rigenerato
  (FileVersion 0.2.0.0 verificato) e allegato alla [release GitHub
  v0.2.0](https://github.com/Gioixxx/Carriera/releases/tag/v0.2.0) con note di rilascio.

- [x] **2 fix di tech-debt da confronto originale-vs-clone** (2026-08-05, non ancora committati a
  inizio di questa voce): **Champions vs Europa League** (`continentalCompetition` in
  `data/clubs.ts`, soglia `prestige >= 2`, badge Europa League nuovo) e **copertura club estesa a
  5 nuovi paesi** (Portogallo/Francia/Germania/Paesi Bassi/Argentina, 40 club reali, 84→124
  totali, crest TheSportsDB verificati uno per uno) — vedi [[decisions]] per il ragionamento
  completo, [[tech-debt]] per gli item ora archiviati. 170 test (era 168), `tsc`/eslint puliti sui
  file toccati. Non verificato manualmente nel browser il caso raro (finale continentale, 15% di
  probabilità); verificato invece via test dedicati (mappatura prestige→trofeo,
  `generateAcademyOffer`/`isReturnHomeEligible` per un giocatore portoghese). Restano in
  tech-debt.md 4 item dei 6 trovati dal confronto: eventi narrativi mancanti, percentuali su
  `DecisionPanel`, evento cambio-nazionalità, anti-ripetizione lifestyle.

- [x] **Sistema "satisfaction": Hall of Fame, record personali, milestone OVR, titoli di stagione**
  (2026-08-06, commit 46f180a): nuovo `lib/career/satisfaction.ts` (402 righe + 266 di test) —
  milestone OVR (60/70/80/85/90), record personali (`PersonalRecords`: miglior stagione
  gol/assist/presenze, picco valore di mercato, età prima convocazione), 8 titoli di stagione
  (`SeasonTitleId`, con rank di priorità e cap 12 in lista), Hall of Fame calcolata sull'archivio
  multi-carriera (OVR più alto/più trofei/più ricco/più popolare, badge "HoF" in
  `CareerArchive.tsx`). `CareerSummary` mostra il miglior titolo di carriera + eventuali vittorie
  Hall of Fame. Nuovo campo `DecisionOption.hint` (sottotitolo testuale sul trade-off, non un
  peso numerico) wired in `DecisionPanel`/`OfferPanel`/`PenaltyShootout`. Vedi [[decisions]] per
  il ragionamento completo. **Non ancora verificato end-to-end nel browser** — vedi [[tech-debt]].

- [x] **Record infranti spostati da overlay modale a banner persistente** (2026-08-06, commit
  b13fac9): rimosso `{ kind: "record" }` da `MomentOverlay`/`buildCareerMoments` (mostrava solo
  il primo record infranto del ciclo); `OutcomeBanner` in `CareerGame.tsx` ora mostra la lista
  completa di `outcome.brokenRecords` come righe di testo sempre visibili, non più nella coda di
  overlay modali. `PlayerCard` evidenzia con stile condizionale le statistiche che hanno appena
  battuto un record. Vedi [[decisions]] per il perché (un ciclo può rompere più record insieme,
  l'overlay "solo il primo" ne nascondeva altri).

- [x] **Release v0.3.0 pubblicata** (2026-08-06, commit aa218f7 + tag v0.3.0): bump
  `package.json`/`package-lock.json` 0.2.0→0.3.0 (minor, dato il volume di feature accumulate
  dalla v0.2.0: motore su 4 assi, sistema satisfaction/Hall of Fame, statistiche portiere,
  percentuali decisione, trofei per confederazione, Champions/Europa League, estensione a 124
  club, menu principale + musica). 274 test verdi prima del tag. `dist/Carriera.exe` rigenerato
  via `scripts/build-launcher.ps1` (FileVersion 0.3.0.0 verificato) e allegato alla [release
  GitHub v0.3.0](https://github.com/Gioixxx/Carriera/releases/tag/v0.3.0) con note che
  riassumono tutte le novità dalla v0.2.0.

## Ricerca completata (agenti background, 2026-08-05)
- **Esplorazione aggiuntiva 4** sul sito originale (scritta in `piped-bouncing-cocke.md`, fuori dal repo): catene di prestito ancora mai osservate (0/47 cicli aggiuntivi, conclusione: probabilmente non serve modellarle); esito di "Look for a way out" chiarito (trasferimento immediato deterministico, stesso pattern di un'offerta normale accettata); **correzione importante**: l'originale usa sempre nomi di trofeo reali (World Cup, Copa América, Champions League, Europa League, Copa Libertadores, Copa Argentina) mai un placeholder generico "Eurocup" come assunto prima — rilevante per [[backlog]] (nomi confederazione-specifici per trofei nazionale); awards individuali confermati vuoti in 14/14 carriere cumulative anche nel caso più estremo osservato finora (OVR 90, Mondiale + 3x Copa América, 9 trofei di club)
- **Ricerca immagini premi + coppe nazionali** (estende `.claude/research/team-crests.md`, sezioni 5-6): badge TheSportsDB per 6 tornei di confederazione (Mondiale/Europei/Copa América/Asian Cup/Africa Cup of Nations/Gold Cup) trovati e verificati, non ancora cablati in `COMPETITION_BADGES` (serve prima la logica di confederazione, vedi [[backlog]]); valutazione premi individuali con raccomandazione icona generica (Twemoji) invece di foto reale del trofeo Ballon d'Or — già implementata, vedi sopra e [[decisions]]

- [x] **Chiusura tech-debt "codificabile": statistiche portiere, percentuali decisione, eventi
  narrativi, trofei confederazione** (2026-08-06, non ancora committato a fine di questa voce):
  su richiesta esplicita dell'utente ("crea piano per i tech debt", scope limitato ai soli item
  con codice da scrivere, non verifiche browser). **Statistiche portiere**: `StatLine` guadagna
  `goalsAgainst?`/`cleanSheets?` opzionali (estensione additiva, non discriminated union — per
  non toccare le fixture di test esistenti), nuova formula `projectGoalkeeperExtras` in
  `progression.ts`, nuovo titolo di stagione "Muro invalicabile" (`ironWall`) e record
  `bestSeasonCleanSheets` in `satisfaction.ts`, UI `PlayerCard`/`CareerTable`/`CareerSummary`
  aggiornate per `player.position === "GK"`. **Percentuali decisione**: `favorableOutcomeWeight()`
  generalizza in `DecisionPanel`/`OfferPanel` il pattern già introdotto ad-hoc in
  `PenaltyShootout.tsx`. **6 eventi narrativi mancanti**: Club priority/Controversial post
  (`club-crisis`), Unexpected prospect/Triumphant return (`narrative`, età-gated), Finish high
  school/Honesty test (pool `lifestyle`). **Trofei di nazionale per confederazione**: nuovo campo
  `confederation` su `Country`, `rollNationalTrophy` sceglie il torneo reale in base alla
  confederazione invece del fisso Mondiale/Europei. Vedi [[decisions]] per il ragionamento
  completo. 222 test (era 170), lint/typecheck/build puliti (4 warning `react-hooks/set-state-in-
  effect` pre-esistenti in `CareerGame.tsx`/`useMotion.ts`, non toccati in questa sessione).
  **Non verificato manualmente nel browser** (fuori scope per scelta esplicita dell'utente,
  limitato al codice) — verificato invece via test dedicati in `decisions.test.ts`/
  `loop.test.ts`/`progression.test.ts`/`wallet.test.ts`/`satisfaction.test.ts`/`countries.test.ts`.

- [x] **Miglioria del motore di gioco su 4 assi** (2026-08-06): su richiesta esplicita dell'utente
  ("rendere il motore di gioco migliore sotto ogni aspetto possibile"), 4 aree scelte via
  `AskUserQuestion` tra quelle proposte dopo un'analisi con agenti di ricerca in background.
  **Harness di simulazione** (`lib/career/simulation.ts`, `scripts/simulate-careers.ts` →
  `npm run simulate`, `simulation.test.ts`): gira migliaia di carriere con RNG reale/seedato e
  misura le frequenze empiriche di trofei/award/callup/infortuni/ritiro — baseline catturato
  prima e dopo le modifiche (trofeo di club ~78→80%, convocazione ~1.8→1.5%, `narrative` come
  frequenza di categoria raddoppiata da ~4.3% a ~8.7% dopo il ribilanciamento pesi, nessuna
  frequenza crollata a zero). **Meccaniche mancanti**: Mondiale e coppa continentale ora trofei
  indipendenti (`rollNationalTrophies`, non più coin-flip alternativo); nuova promozione/
  retrocessione di campionato (`lib/career/club-progression.ts`, costruita da zero — verificato
  che non esisteva già nonostante un commento la desse per scontata); nuovo evento cambio
  nazionalità ("nonno di un altro paese"), eleggibile solo prima della prima convocazione
  (`STORAGE_VERSION` 3→4). **Varietà eventi**: 3 template per la finale continentale (prima solo
  il rigore), 2 nuovi contratti sponsor, anti-ripetizione anche a livello di singolo evento (non
  solo di categoria) dentro club-crisis/lifestyle/narrative. **Pulizia tecnica**: magic number
  centralizzati in costanti nominate, JSDoc duplicato e riferimenti a un `decisions.md` mai
  esistito sistemati, copertura test rinforzata su `market.ts`/`wallet.ts`/`injuries.ts`. Vedi
  [[decisions]] per il ragionamento completo. 269 test (era 250), `tsc`/eslint puliti sui file
  toccati. **Non verificato manualmente nel browser** (sessione focalizzata sul motore, coerente
  con le sessioni "codice puro" precedenti) — verificato invece via test dedicati e via
  `npm run simulate` prima/dopo per confermare che nessuna frequenza sia collassata a zero.

- [x] **Menu principale + musica di sottofondo con volume regolabile** (2026-08-06, non ancora
  committato a fine di questa voce): nuovo step `"menu"` (default, prima di `"speed"`) con 4
  voci — Giocatore singolo, Multiplayer (disabilitato, "In fase di sviluppo"), Impostazioni
  (nuovo `SettingsPanel.tsx`: slider volume + mute), Chiudi (`window.close()`, intercettato lato
  launcher desktop via `CoreWebView2.WindowCloseRequested` in `MainForm.cs`). Musica di
  sottofondo fornita dall'utente committata come asset statico in
  `public/audio/passaggio-di-spogliatoio.mp3`, riprodotta in loop da un `<audio>` persistente
  gestito da `hooks/useBackgroundMusic.ts` (volume/mute salvati in `localStorage` via nuovo
  `lib/audio-settings.ts`). Vedi [[decisions]] per il ragionamento completo. 274 test (era 269),
  `tsc`/eslint puliti. Verificato end-to-end nel browser via dev server (menu → impostazioni →
  slider volume live sull'elemento audio + persistenza in localStorage dopo reload → toggle mute
  → "Giocatore singolo" → flusso esistente invariato). **Non verificato nell'eseguibile
  desktop** (exe non rigenerato in questa sessione) — vedi [[tech-debt]].

- [x] **Ricalibrata curva OVR e soglie "grande momento"** (2026-08-06, non ancora committato a
  fine di questa voce): su segnalazione diretta dell'utente dopo diverse partite giocate (OVR
  quasi mai sopra 80, mai in nazionale, mai vinto un trofeo/coppa continentale), diagnosticato
  che la curva di crescita OVR (`progression.ts`) produceva un tetto naturale troppo basso
  rispetto alle soglie che sbloccano convocazione/trofeo nazionale/award/offerte dai top club
  (tarate nella sessione 2026-08-04 assumendo un tetto più alto). Interpellato l'utente
  (`AskUserQuestion`), che ha scelto di intervenire su **entrambi** gli assi: curva OVR riscalata
  (fasi di crescita/plateau, non il declino) + soglie ritarate in 3 giri di misurazione con
  `npm run simulate` (harness esistente, non a tavolino — il picco OVR *reale* misurato,~81.9,
  è ~4 punti sotto quello teorico per via di infortuni/eventi negativi). Risultato (2000 carriere
  simulate): convocazione 1.5%→~22%, trofeo di nazionale 0.1%→~5%, award 0%→~7% (Ballon d'Or
  ~0.3%, resta il più raro). Aggiunta diagnostica permanente `peakOvr` all'harness
  (`simulation.ts`/`scripts/simulate-careers.ts`) e corretto lo script `npm run simulate`
  (reporter rotto). Vedi [[decisions]] per il dettaglio numerico completo. 274 test invariati (3
  asserzioni aggiornate ai nuovi valori), `tsc`/eslint/build puliti. **Non verificato manualmente
  nel browser** (sessione di bilanciamento numerico, verificata via test + harness) — vedi
  [[tech-debt]]. Effetto collaterale non richiesto: trofeo di club salito a ~91% (era ~78-80%),
  registrato come nuovo item di tech-debt a priorità bassa, non corretto in questa sessione
  perché fuori dallo scope segnalato dall'utente.

- [x] **Fix auto-updater launcher + release v0.3.1 pubblicata** (2026-08-06, commit b775cf5,
  ae2f1b4, b572f1b, 20eabe7 + tag v0.3.1): su segnalazione diretta dell'utente ("non funziona
  l'aggiornamento, spunta l'alert ma anche confermando si avvia la vecchia versione, nemmeno
  riavviandolo"), diagnosticato che `UpdateInstaller.cs` generava uno script `.bat` con un
  singolo `move /y` senza gestione errori: un lock transitorio (Defender che scansiona il file
  appena scaricato, Controlled Folder Access) faceva fallire il move in silenzio, lo script
  rilanciava comunque il vecchio exe invariato e si autocancellava senza lasciare traccia. Fix:
  retry fino a ~15s con log in `%TEMP%\CarrieraUpdate\update-log.txt`, controllo di sanità sulla
  dimensione del download prima di sostituire l'exe installato, `MessageBox` esplicito se il
  download fallisce (il controllo periodico di versione resta silenzioso by design). Bundle nello
  stesso rilascio: bump `package.json`/`package-lock.json` 0.3.0→0.3.1 (patch, fix+ribilanciamento
  non nuove feature), `dist/Carriera.exe` rigenerato (FileVersion 0.3.1.0 verificato) e allegato
  alla [release GitHub v0.3.1](https://github.com/Gioixxx/Carriera/releases/tag/v0.3.1). 274 test
  verdi, `tsc` pulito. **Il flusso di aggiornamento non è stato riverificato end-to-end** (serve
  installare la v0.3.0 e testare l'update verso questa v0.3.1 dal vivo) — vedi [[tech-debt]].

- [x] **Trovata la vera causa dell'auto-updater rotto (HTTP/2) + release v0.3.2** (2026-08-06,
  commit 57437a0, 8caf9ae + tag v0.3.2): l'utente ha confermato che l'update continuava a non
  funzionare anche dopo il fix precedente. Diagnosticato ispezionando `%TEMP%\CarrieraUpdate\`
  sulla sua macchina: `Carriera.new.exe` troncato a ~4.9 MB (di ~58 MB attesi), nessun
  `update-log.txt` — il fallimento avveniva nel download stesso, prima dello script. Un download
  diretto dello stesso URL via `Invoke-WebRequest` completava regolarmente, isolando il problema a
  `HttpClient`: la CDN dei release GitHub parla HTTP/2 e lo stream si interrompeva a metà senza
  eccezione .NET su questa configurazione. Fix: download forzato su HTTP/1.1
  (`HttpVersion.Version11`/`RequestVersionExact`), controllo integrità confrontato col
  `Content-Length` del server. Rilasciato come v0.3.2 (l'asset v0.3.1 aveva già il primo fix ma non
  questo). **Verificato dall'utente end-to-end**: exe di test pinnato a v0.1.0 → rilevato v0.3.2 →
  scaricato e applicato con successo (FileVersion 0.3.2.0 confermato post-update). Prima verifica
  live del flusso di auto-update da quando esiste. Vedi [[decisions]] per il dettaglio completo.

- [x] **Musica di sottofondo avviata insieme al menu invece che al primo click** (2026-08-06,
  commit 32f317c, non ancora rilasciato a fine di questa voce): segnalazione utente — la musica
  partiva solo dopo un click su una voce del menu, non insieme alla schermata iniziale. Causa:
  autoplay policy del motore Chromium (anche dentro WebView2), che blocca `audio.play()` prima di
  un gesto reale; con la sola schermata menu cliccabile il "primo gesto" coincideva per forza con
  un click sul menu. Fix: `MainForm.cs` avvia l'ambiente WebView2 con
  `--autoplay-policy=no-user-gesture-required` (sicuro: è la nostra unica finestra dedicata, non
  una pagina web pubblica); `useBackgroundMusic.ts` tenta `play()` subito al mount invece di
  aspettare solo un gesto, con fallback al comportamento precedente per il browser normale (dove
  quel flag non esiste). 274 test invariati, `tsc`/`dotnet build` puliti. **Verificato dall'utente**
  eseguendo l'exe rigenerato: musica avviata da sola col menu, senza click.

- [x] **Download update ancora inaffidabile dopo v0.3.2/v0.3.3, retry automatico + release
  v0.3.4** (2026-08-06, commit eb7718d, 7693194 + tag v0.3.4): l'utente ha aggiornato dalla v0.3.2
  ma "oltre all'alert non spunta nulla" — verificato ispezionando di nuovo `%TEMP%\CarrieraUpdate\`
  sulla sua macchina: `Carriera.new.exe` troncato a **~36.6 MB (63.7%)** dei ~58 MB attesi, punto di
  troncamento diverso dal precedente episodio (~8%, v0.3.1→v0.3.2) — non un bug di protocollo fisso
  come l'HTTP/2 risolto in v0.3.2, ma un'interferenza di rete/sicurezza che interrompe lo stream in
  modo non deterministico a seconda del tentativo. Fix: il download intero (non solo il "move"
  finale, già con retry) viene ritentato automaticamente fino a 5 volte con backoff crescente
  prima di arrendersi; ogni tentativo (successo/fallimento + motivo) è loggato fin da subito in
  `%TEMP%\CarrieraUpdate\update-log.txt`, non solo se si arriva allo script di sostituzione.
  **Limite noto e comunicato all'utente**: il fix vive nel downloader della versione *già
  installata* — un'installazione v0.3.2/v0.3.3 (senza retry) continuerà a fare un solo tentativo
  per ogni check periodico, quindi potrebbe comunque riuscire solo "per fortuna" quando il
  tentativo singolo non viene interrotto. Solo da v0.3.4 in poi gli aggiornamenti *successivi*
  saranno automaticamente resilienti. Per sbloccare l'installazione bloccata su questa stessa
  macchina, `dist/Carriera.exe` è stato rigenerato localmente e consegnato per l'esecuzione diretta
  (bypassa del tutto il download flaky, dato che siamo sulla stessa macchina). 274 test invariati,
  `tsc`/`dotnet build` puliti. **Aggiornamento — verificato in diretta nella stessa sessione**: il
  retry ha funzionato davvero: i primi due tentativi dell'utente sono stati interrotti a metà (lui
  ha chiuso l'app pensando fosse bloccata, non un fallimento del retry), il terzo tentativo è
  arrivato in fondo al primo giro (nessun retry necessario quella volta), script di sostituzione
  eseguito con successo, app riavviata da sola come v0.3.4 — log completo ispezionato in tempo
  reale (`update-log.txt`, crescita byte di `Carriera.new.exe` campionata ogni 2s). Item di
  tech-debt corrispondente archiviato.

- [x] **Indicatore di caricamento durante l'update del launcher** (2026-08-06, commit 14f93fd, non
  ancora rilasciato a fine di questa voce): causa diretta della chiusura prematura osservata sopra
  — durante il download non c'era alcun feedback visivo, quindi con i retry automatici (fino a un
  paio di minuti su rete instabile) sembrava che l'app fosse bloccata. Nuovo
  `UpdateProgressForm.cs`: finestra non modale con barra di progresso reale (percentuale + MB
  scaricati/attesi + numero tentativo), testo dedicato per la fase finale ("Applico
  l'aggiornamento..."), nessun pulsante di chiusura (l'utente ha già confermato). `UpdateInstaller`
  ora legge il download a blocchi (invece di `CopyToAsync` in un colpo solo) per riportare i byte
  ricevuti in tempo reale via `IProgress<UpdateProgress>`. Due iterazioni di rifinitura su feedback
  diretto dell'utente: (1) il menu sotto (WebView2) restava cliccabile durante l'update — fix:
  `MainForm.Enabled = false` per tutta la durata; (2) finestra troppo piccola e non centrata sullo
  schermo — ingrandita 360×78→460×140, `CenterParent`→`CenterScreen`. **Verificato dall'utente** con
  un exe di test pinnato a v0.1.0: barra di progresso visibile e funzionante, menu non
  interagibile durante l'update.

- [x] **Ricerca su larga scala sull'originale: 23 carriere, 3 agenti browser paralleli**
  (2026-08-06, solo ricerca — nessuna modifica al codice del clone): su richiesta esplicita
  dell'utente di raccogliere più dati sul bilanciamento (crescita OVR, premi, trofei), 3 agenti
  hanno giocato Copero con strategie diverse (OVR massimizzato, scelte varie, verifica mirata
  promozione/retrocessione/infortuni/portiere/Mondiale-coppa continentale). Confermato: award
  individuale 0/18 anche nel caso più estremo, trofeo di nazionale aggregato ~5.6% (vicino al ~5%
  ricalibrato), statistiche portiere presenti ovunque nell'originale. **Corretta una nota di
  memoria sbagliata**: le card decisione dell'originale MOSTRANO percentuali esplicite per gli
  eventi lifestyle/allenamento a esito probabilistico (es. "Train hard": 65%/35%), non le
  nascondono sempre come concluso in precedenza da un singolo playtest. Aperti 2 item di
  tech-debt a bassa priorità (finestra di ritiro probabilistico forse più ampia di 34-40,
  promozione mai osservata in UI nell'originale) e 2 idee di backlog (evento doping "Sostanza
  misteriosa", evento "Fan backlash" da ricercare meglio). Dettaglio completo in [[decisions]] e
  nel piano esterno `piped-bouncing-cocke.md`, sezione "Esplorazione aggiuntiva 5".

- [x] **Follow-up dalla ricerca: evento doping + finestra di ritiro allargata** (2026-08-06, non
  ancora committato a fine di questa voce; piano in `wondrous-popping-knuth.md`): implementato
  l'evento lifestyle `mysterious-substance` ("Sostanza misteriosa") e allargata
  `RETIREMENT_RISK_START_AGE` da 34 a 31 in `engine.ts`, con la formula di `checkRetirement`
  passata da quadratica a cubica dopo verifica con `npm run simulate` (l'esponente invariato
  spostava troppo peso verso i ritiri anticipati). 275 test verdi (era 274), `tsc`/eslint puliti.
  Vedi [[decisions]] per il dettaglio numerico prima/dopo harness. **Resta da fare**: un giro di
  ricerca browser mirato per il testo esatto di "Fan backlash" e la verifica UI della promozione
  di campionato (Step 4 del piano — lanciato e poi fermato su richiesta dell'utente, da rilanciare
  in futuro se serve).

- [x] **Release v0.3.6 pubblicata** (2026-08-06, commit 36fc27d/9a52e29/ee7ab30 + tag v0.3.6):
  bump `package.json`/`package-lock.json` 0.3.5→0.3.6 (patch: nuovo evento + ricalibrazione,
  non un bundle di feature grande). `dist/Carriera.exe` rigenerato via `scripts/build-launcher.ps1`
  (FileVersion 0.3.6.0 verificato) e allegato alla [release GitHub
  v0.3.6](https://github.com/Gioixxx/Carriera/releases/tag/v0.3.6). 275 test verdi.

- [x] **Espansione mondo (12 nuovi paesi, 96 club) + meccanica "Giant Killer" + sync-rosters**
  (2026-08-06, commit b96d085/86736a1): su richiesta esplicita dell'utente di
  brainstormare nuove meccaniche, scelta la direzione "espansione mondo" tra 4 proposte. Messico/
  USA/Canada (CONCACAF), Marocco/Senegal/Nigeria/Ghana/Egitto/Costa d'Avorio (CAF), Giappone/Corea
  del Sud/Australia (AFC) — 12 dei 14 paesi pianificati, ricerca delegata a 3 agenti in background
  (uno per confederazione), Arabia Saudita e Qatar interrotti a metà su richiesta esplicita
  dell'utente (dati parziali/non verificati, non trascritti — vedi [[backlog]]). Nuova meccanica
  "Giant Killer" (sorpresa di coppa, categoria `"cup-upset"`): un club di prestigio ≤1 sfida una
  corazzata in coppa nazionale, stesso mini-gioco `PenaltyShootout` della finale continentale ma
  win rate sempre sotto il 50%. Nuovo strumento diagnostico `scripts/sync-league-rosters.ts`
  (`npm run sync-rosters`) per confrontare periodicamente i roster reali con `clubs.ts` — ha
  richiesto 2 iterazioni di design dopo aver scoperto in pratica limiti non documentati dell'API
  gratuita TheSportsDB (troncamento a 10 squadre/lega, scoperta dinamica del nome lega spesso
  inaffidabile). Vedi [[decisions]] per il dettaglio completo. 297 test verdi (era 275), `tsc`/
  eslint/`npm run build` puliti, ogni URL nuovo (stemmi/badge) verificato con una richiesta HTTP
  diretta prima di committarlo. **Non verificato manualmente nel browser** (sessione di codice/
  dati) — vedi [[tech-debt]].

- [x] **Release v0.4.0 pubblicata** (2026-08-06, commit 941e140 + tag v0.4.0): bump
  `package.json`/`package-lock.json` 0.3.6→0.4.0 (minor, dato il volume della feature: 96 nuovi
  club/12 paesi + nuova meccanica di gioco, stesso criterio già usato per la v0.3.0). Verificato
  prima del commit: 297 test verdi, `tsc`/`npm run build` puliti, lint con solo i 4 errori
  `react-hooks/set-state-in-effect` pre-esistenti (confermato via `git diff` che i file coinvolti
  in questa sessione non li hanno introdotti). `dist/Carriera.exe` rigenerato via
  `scripts/build-launcher.ps1` (FileVersion 0.4.0.0 verificato) e allegato alla [release GitHub
  v0.4.0](https://github.com/Gioixxx/Carriera/releases/tag/v0.4.0). **Non verificato
  manualmente nel browser** (stesso gap ereditato dalla voce sopra) — vedi [[tech-debt]].

- [x] **Traits/archetipo di carriera + Shadow (debito morale)** (2026-08-06, commit 3965789):
  su proposta dell'utente in 3 parti (§1 archetipo, §2
  relazioni NPC, §3 debito morale), implementati §3+§1 in un'unica sessione seguendo l'ordine
  suggerito dall'utente stesso; §2 (relazioni NPC) resta interamente fuori scope, vedi
  [[backlog]]. Nuovi `traits.ts`/`shadow.ts`, retrofit di `traitsDelta`/`shadowDelta` su
  transfer/club-crisis/controversial-post-statement/tax-trouble/sponsor/4 eventi lifestyle
  esistenti, nuovo scandalo forzato (categoria `"scandal"`, stesso trigger pattern di
  continental-final/cup-upset) + evento di redenzione, moltiplicatore shadow su award/callup,
  migrazione storage v4→v5, chip UI su `PlayerCard`/`CareerSummary`/`CareerArchive`. **Harness
  esteso e usato per tarare**: la prima misurazione mostrava 5 archetipi su 6 sostanzialmente
  irraggiungibili sotto scelta casuale (stesso pattern già visto con l'OVR) — diagnosticato un
  touchpoint mancante (leadership↔convocazione, già previsto dall'utente ma non cablato) più
  soglie troppo alte; dopo il fix tutti e 6 gli archetipi e lo scandalo/redenzione risultano
  non nulli su 2000 carriere simulate. Vedi [[decisions]] per il dettaglio completo. 342 test
  verdi (era 297), `tsc`/eslint (solo i 4 errori pre-esistenti)/`npm run build` puliti. **Non
  verificato manualmente nel browser** (sessione di dominio/harness) — vedi [[tech-debt]].

- [x] **Refactor layout/styling componenti carriera** (2026-08-07, commit 005d674, non
  registrato in memoria al momento del commit — recuperato in questa sessione): grid columns
  in `CareerGame.tsx`/`CareerTable.tsx` per responsività migliore, spaziature/padding in
  `PlayerCard.tsx`, età aggiunta a `CareerTimeline.tsx`, colonne extra per le opzioni in
  `DecisionPanel.tsx`/`OfferPanel.tsx`. Nessuna nota di decisione dedicata: modifiche di
  rifinitura visiva senza cambi di logica di dominio.

- [x] **Rename completo "Carriera" → "My Road - L'Ascesa"** (2026-08-07, commit c6da2bc):
  su richiesta esplicita dell'utente, rinominato repo GitHub (`Gioixxx/Carriera` →
  `Gioixxx/MyRoad`, via `gh repo rename` + `git remote set-url`), cartella/progetto
  launcher .NET (`launcher/CarrieraLauncher/` → `launcher/MyRoadLauncher/`, namespace/
  `AssemblyName`/testi UI in tutti i `.cs`), URL API GitHub e nome asset nell'auto-updater
  (`Carriera.exe` → `MyRoad.exe`), `scripts/build-launcher.ps1`, `package.json`, titolo
  browser (`layout.tsx`) e wordmark in-game (`CareerGame.tsx`), `README.md`/`launcher/
  README.md`/`.gitignore`/`workspace.json`/`CLAUDE.md`. Decisa esplicitamente con l'utente
  prima di procedere: sì al rename del repo GitHub, forma tecnica corta `MyRoad` (titolo
  UI completo resta "My Road - L'Ascesa"). Non toccate le occorrenze della parola italiana
  generica "carriera" nel testo di gioco (es. "Carriera conclusa"). Vedi [[decisions]] per
  il dettaglio completo. Verificato `npm test` (342 verdi), `tsc --noEmit` pulito, `dotnet
  build` sul progetto rinominato (0 errori, solo il warning MSB3277 preesistente).

- [x] **Release v0.5.0 pubblicata** (2026-08-07, commit ca2196f + tag v0.5.0): bump
  `package.json`/`package-lock.json` 0.4.0→0.5.0 (minor, coerente col criterio già usato per
  cambi ad ampio raggio — qui il rename tocca repo/launcher/auto-updater, non solo codice di
  gioco), corretto anche il numero di versione stale nel badge di `README.md` (mostrava
  ancora "v0.2.0"). `dist/MyRoad.exe` rigenerato via `scripts/build-launcher.ps1`
  (FileVersion 0.5.0.0 verificato) e allegato alla [release GitHub
  v0.5.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.5.0), con note che segnalano
  esplicitamente a chi ha installato il vecchio `Carriera.exe` di scaricare `MyRoad.exe` a
  mano una volta (vedi [[tech-debt]], l'auto-updater della vecchia versione punta a un
  URL/asset che non esistono più). 342 test verdi, `tsc` pulito prima del tag.

- [x] **Verifica end-to-end nel browser: fix layout card/tabella + overlay momenti + ricalibrazione OVR**
  (2026-08-07): il fix di layout della sessione precedente (card giocatore troppo piccola, tabella
  stagioni non completamente visibile — session-log 2026-08-06, mai formalizzato come voce di
  sprint/decisione a parte) è stato verificato giocando una carriera di test dal vivo (dev server,
  6 cicli, 16→28 anni). Confermato: `PlayerCard` mostra tutte le info senza tagli; `CareerTable`
  ("Storico") con più di 4 stagioni eccede la viewport ma **nessuna riga viene tagliata** — il
  contenuto resta raggiungibile tramite lo scroll naturale della pagina (non uno scroll interno al
  componente), verificato sia scrollando sia via `read_page`/`scroll_to` che tutte le righe esistono
  nel DOM e sono raggiungibili. Verificato anche in tema chiaro, nessuna regressione. Bonus emerso
  dallo stesso giro di test, rilevante per due item aperti in [[tech-debt]]: l'overlay di
  `MomentOverlay` per i traguardi OVR (60, 70) e il banner "record infranti" post-refactor
  (2026-08-06, vedi [[decisions]]) funzionano entrambi correttamente come renderizzati; la
  ricalibrazione OVR/soglie (vedi [[decisions]]) ha prodotto in game un'offerta reale dal Tottenham
  Hotspur (Premier League) a OVR 74 dopo soli 6 cicli — prima conferma **in gameplay reale**, non
  solo da harness/test, che le soglie ritarate producono offerte da top club raggiungibili. Non
  verificato in questo giro: overlay trofeo/premio/convocazione nazionale, focus-trap, comportamento
  con `prefers-reduced-motion` — vedi [[tech-debt]] per lo stato aggiornato.

- [x] **Offerte club: 4 invece di 3 + esclusione campionati emergenti per giocatori affermati**
  (2026-08-07, commit aada39e): su segnalazione dell'utente, offerte bump 3→4 in tutti e 5 i
  flussi (settore giovanile/finestra di mercato/prestito/rientro prestito/fine ciclo) e nuova
  esclusione dei 12 paesi dell'espansione mondo 2026-08-06 dal pool di `eligibleClubs` quando il
  giocatore punta a prestige ≥2 (OVR ≥84) — vedi [[decisions]] per il dettaglio completo. 342 test
  verdi (1 asserzione aggiornata su `generateAcademyOffer`), `tsc` pulito, `npm run simulate` con
  frequenze stabili rispetto al baseline.

- [x] **Verifica end-to-end nel browser: offerte 4x + esclusione campionati emergenti**
  (2026-08-07): due carriere di test giocate dal vivo. Sotto OVR 84 confermato che i 12 campionati
  emergenti (Ghana, Costa d'Avorio, Canada, Giappone, Marocco, Messico osservati) compaiono
  regolarmente nelle offerte, comportamento invariato e corretto. Sopra OVR 84 — raggiunto forzando
  `ovr`/`age` nel salvataggio via `localStorage` con `javascript_tool` del browser, dato che la
  crescita naturale nel playtest si fermava a OVR 83 prima della fase di declino — il "Rientro dal
  prestito" a OVR 88 ha mostrato **solo** club dai campionati big (Racing Club/Argentina,
  Girona/Spagna, Manchester City/Inghilterra, Mönchengladbach/Germania), zero campionati emergenti:
  conferma diretta in UI che l'esclusione funziona esattamente al confine previsto. Confermate anche
  4 offerte in ogni flusso (settore giovanile, prestito, rientro, finestra di mercato, fine ciclo).
  Bonus dallo stesso giro di playtest: overlay trofeo/convocazione nazionale/premio individuale e
  chip archetipo "Stile: Leader" osservati funzionanti per la prima volta — vedi [[tech-debt]] per
  l'aggiornamento delle voci correlate (nessuna archiviata, restano aspetti minori da verificare).

- [x] **Release v0.5.1 pubblicata** (2026-08-07, commit be89329 + tag v0.5.1): bump
  `package.json`/`package-lock.json` 0.5.0→0.5.1 (patch, coerente col criterio già usato per
  fix/ribilanciamenti mirati — qui offerte 3→4 + esclusione campionati emergenti, non una feature
  ad ampio raggio). `dist/MyRoad.exe` rigenerato via `scripts/build-launcher.ps1` (FileVersion
  0.5.1.0 verificata) e allegato alla [release GitHub
  v0.5.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.5.1), con note che ripetono
  l'avviso già dato in v0.5.0 per chi ha ancora il vecchio `Carriera.exe`.

- [x] **Immagini reali dei trofei (club/nazionale) + premi individuali differenziati + layout
  storico/corpo pagina** (2026-08-08, commit 3ab2020 + 1c865ab, non ancora rilasciato/taggato a
  fine di questa voce): su richiesta esplicita dell'utente, nuovo `TrophyImage.tsx` +
  `COMPETITION_TROPHIES` (campo `strTrophy` di TheSportsDB, 33 competizioni coperte) mostrato
  accanto al badge già esistente **solo** nell'overlay celebrativo `MomentOverlay.tsx`; `AwardBadge`
  ora mostra un'immagine diversa per Pallone d'Oro/Player of the Season/capocannoniere (invertendo
  la scelta "icona generica unica" del 2026-08-05, su decisione informata dell'utente che ha
  accettato il rischio di marchio). Due problemi scoperti in corsa durante l'implementazione (foto
  Golden Boot con logo "Barclays" visibile, icona "player of the season" che riproduceva la sagoma
  della Coppa del Mondo) hanno cambiato la scelta finale delle immagini — vedi [[decisions]] per il
  dettaglio completo. `MomentOverlay` ingrandito su richiesta dell'utente dopo aver visto la prima
  versione. Nella stessa sessione, richiesta separata dell'utente: `CareerTable` ("Storico") spostato
  da sotto il pannello decisioni a una terza colonna a destra (nuovo prop `compact`), corpo pagina
  allargato su tutti gli step. 356 test (era 342), `tsc` pulito. **Verificato nel browser**: overlay
  traguardo OVR con le nuove dimensioni, layout storico/corpo pagina su una viewport di 1568px.
  **Non verificato dal vivo un vero overlay di trofeo/premio vinto** (RNG-gated) — vedi [[tech-debt]].

- [x] **Release v0.6.0 pubblicata** (2026-08-09, commit b654676 + tag v0.6.0): bump
  `package.json`/`package-lock.json` 0.5.1→0.6.0 (minor: persistenza ultima identità + immagini
  reali trofei/premi + layout storico/corpo pagina, feature già committate l'8/8 ma mai
  rilasciate). Durante la rigenerazione dell'exe, scoperto e risolto un fix necessario:
  `npm run build` falliva con un panic Turbopack causato dal symlink tracciato `.claude/libs`
  (punta fuori dalla repo) attraversato dalla scansione automatica dei source di Tailwind v4 —
  risolto con `@source not "../../.claude";` in `globals.css`, vedi [[decisions]] per il
  dettaglio completo. `dist/MyRoad.exe` rigenerato (FileVersion 0.6.0.0 verificata) e allegato
  alla [release GitHub v0.6.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.6.0). 356 test
  verdi, `tsc` pulito prima del tag.

- [x] **Bilanciamento generale su 7 fasi per rigiocabilità/divertimento** (2026-08-10, non ancora
  committato a fine di questa voce): su richiesta esplicita dell'utente, audit completo (3 agenti
  Explore paralleli + run fresco dell'harness) ha trovato un bug strutturale nel loop prestiti
  (loan+loan-return consumavano ~29% di tutti i cicli simulati) oltre a diversi sbilanciamenti
  già noti (Shadow/scandalo mai raggiunto, PlayStyle molto sbilanciati, archetipo quasi mai
  assegnato, trofeo di club quasi garantito). Eseguito in 8 fasi (0-7): infrastruttura harness con
  picker "diretti" (rischio/focus allenamento/tratto), fix del prestito, Shadow/scandalo
  ricalibrato, trofeo di club ridotto (94.8%→84.4%, target utente 75-85%), soglie PlayStyle per
  stile (sprinter 1%→44%, targetman 8%→40%), archetipi più raggiungibili ("nessuno" 81%→64%),
  pesi categoria confermati/puliti (rimossa `"callup"` morta da `DecisionCategory`). Vedi
  [[decisions]] per il dettaglio numerico completo di ogni fase, inclusa la scoperta di un
  vincolo strutturale di "frequenza di tocco" che limita la separazione raggiungibile tra scelta
  pulita/rischiosa per Shadow e archetipi (~2.5-3x, sotto l'obiettivo indicativo iniziale). 386
  test (era 384), `tsc`/lint puliti (solo i 4 warning pre-esistenti). **Verificato sul tablet
  Android reale**: build rigenerata (`npm run build` → `cap sync` → `gradle assembleDebug`) e
  installata via ADB, app avviata senza crash.

- [x] **Release v0.7.0 pubblicata** (2026-08-10, commit 99fbcf8+6e8b531 + tag v0.7.0): bump
  `package.json`/`package-lock.json` 0.6.0→0.7.0 (minor, coerente col criterio già usato per
  bundle di feature/rebalancing ad ampio raggio — qui un bug reale + 5 meccaniche ricalibrate).
  `dist/MyRoad.exe` rigenerato via `scripts/build-launcher.ps1` e allegato alla [release GitHub
  v0.7.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.7.0). 386 test verdi, `tsc` pulito
  prima del tag. APK Android rigenerato nella stessa sessione (`npm run build` → `cap sync
  android` → `gradle assembleDebug`) e installato via ADB sul tablet di test dell'utente per il
  playtest — **non allegato alla release** (nessuna decisione ancora presa su firma/canale di
  distribuzione pubblica dell'APK, vedi [[backlog]]), solo consegnato localmente.

- [x] **Storico invertito (ciclo più recente in cima)** (2026-08-11, commit e8523d9, release v0.7.2):
  su richiesta esplicita dell'utente dopo aver testato il fix layout mobile — `CareerTable.tsx`
  ora mappa `[...player.clubHistory].reverse()` invece di `player.clubHistory` diretto, sia nella
  vista a lista (mobile/colonna stretta) sia nella tabella desktop; la riga placeholder del ciclo
  in corso (`pendingLabel`) spostata in cima invece che in fondo, coerente con l'ordine invertito.
  Nessun test dedicato esistente (`CareerTable` non ha `.test.tsx`), 386 test invariati.

- [x] **Overlay celebrativo per l'obiettivo di ciclo + traguardi OVR distinti + auto-dismiss**
  (2026-08-11, commit ebdb750/d52c245/0678d41 + tag v0.9.0): su segnalazione dell'utente che il
  raggiungimento di un obiettivo era poco chiaro visivamente, nuovo moment `"objective"`
  nell'overlay celebrativo (icona Target verde, in coda alla sequenza), traguardi OVR con copy
  specifica per soglia + badge OVR riusato da `OvrBadge` (nuova size `"lg"`) al posto della stella
  generica, auto-dismiss (6s, pausa su hover/cambio finestra, disattivato con
  `prefers-reduced-motion`) esteso a **tutti** i moment overlay esistenti e nuovi. Vedi
  [[decisions]] per il dettaglio completo. 397 test (era 386, +11 nuovi in `MomentOverlay.test.ts`/
  `.test.tsx`), `tsc`/lint puliti. **Verificato dal vivo nel browser** per traguardo OVR e trofeo
  (badge/copy/barra di progresso/pausa hover); il nuovo overlay obiettivo solo via test automatico
  — vedi [[tech-debt]] se si vuole chiudere anche quel punto in una sessione futura. Rilasciato
  come **v0.9.0**, `dist/MyRoad.exe`/`dist/MyRoad.apk` rigenerati e allegati alla [release GitHub
  v0.9.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.9.0).

- [x] **Fix APK v0.9.0 stantio + overlay obiettivo mostrato una sola volta per carriera**
  (2026-08-12, commit 62443ed/71de856 + tag v0.9.1): l'utente ha segnalato che l'APK non si
  aggiornava — diagnosticato che l'asset allegato alla release v0.9.0 era in realtà una build
  vecchia (0.8.0) rimasta in `dist/`, causa un `2>&1` in PowerShell che trasformava un warning
  innocuo di Gradle in un errore terminante prima della copia dell'APK. Ricostruito e ricaricato
  l'asset corretto sulla release esistente. Nella stessa sessione, richiesta separata dell'utente:
  l'overlay celebrativo "Obiettivo raggiunto" (v0.9.0) si accodava ad ogni ciclo in cui l'obiettivo
  veniva centrato — ora compare solo la prima volta per carriera (`Player.objectiveMomentShown`,
  `STORAGE_VERSION` 8→9). Vedi [[decisions]] per il dettaglio completo di entrambi, inclusa la
  nota di processo sul falso allarme di debug legato al doppio-invoke di React Strict Mode sugli
  updater di `setState`. 399 test (era 397), `tsc`/lint puliti. **Verificato dal vivo nel
  browser** (prima volta con overlay, seconda volta senza) e sul tablet fisico via ADB. Rilasciato
  come **v0.9.1**, con verifica esplicita di versionCode/FileVersion prima della pubblicazione per
  non ripetere l'incidente della release precedente.

- [x] **Overlay obiettivo per-tipo + ribilanciamento convocazione/trofeo club/Pallone d'Oro**
  (2026-08-12, commit 55983e1/81c4396/... + tag v0.9.2): l'utente ha corretto v0.9.1 — l'overlay
  "Obiettivo raggiunto" doveva essere una volta per tipo di obiettivo, non una volta per l'intera
  carriera (`Player.objectiveKindsCelebrated: CycleObjectiveKind[]`, `STORAGE_VERSION` 9→10).
  Nella stessa release, incluso anche un ribilanciamento fatto in una sessione parallela
  (confronto plausibilità gioco-vs-realtà con un Artifact dedicato): convocazione in nazionale
  ~37%→~28%, trofeo di club ~84%→~72%, Pallone d'Oro dimezzato. Vedi [[decisions]] per il
  dettaglio completo di entrambe. 403 test (era 399), `tsc`/lint puliti. **Verificato dal vivo nel
  browser** (prima volta per tipo mostra overlay, ripetizione stesso tipo no, tipo diverso sì) e
  sul tablet fisico via ADB. Rilasciato come **v0.9.2**.

- [x] **Fit tattico col club + contratti/potere degli agenti** (2026-08-12, non ancora
  committato/rilasciato a fine di questa voce): su richiesta dell'utente di analizzare 7 dinamiche
  reali della carriera di un calciatore e capire cosa inserire, implementate le 2 dinamiche scelte
  come priorità — le altre 3 rimandate a [[backlog]]. Nuovo `lib/career/tactics.ts` (sistema
  tattico per club derivato da hash FNV-1a sull'id, nessun nuovo dato — bug di clustering
  dell'hash trovato e corretto durante la verifica nel browser, non rilevabile dall'harness
  aggregato), moltiplicatore fit applicato alle proiezioni statistiche, chip UI su offerte/
  cartellino. Nuovo `Player.releaseClauseEur` (clausola rescissoria, `STORAGE_VERSION` 10→11),
  bonus alla firma su nuovo club, categoria "agent" (negoziazione clausola) e categoria forzata
  "clause-activation" (rivale attiva la clausola, stesso pattern architetturale di scandalo/
  finale continentale). Vedi [[decisions]] per il dettaglio completo. 446 test (era 403), `tsc`/
  lint puliti, `npm run simulate` verificato (fit tattico non degenere, frequenza clause-activation
  in linea con gli altri eventi forzati esistenti). **Verificato dal vivo nel browser** in una
  sessione di playtest fortunata: entrambe le nuove categorie ("agent" e "clause-activation")
  scattate naturalmente senza bisogno di forzare lo stato via localStorage, tutti i percorsi
  osservati direttamente (chip fit tattico, clausola+bonus sul cartellino, accetta/rifiuta
  l'attivazione della clausola, negoziazione clausola più alta verificata all'esatto moltiplicatore
  atteso).

## Note tecniche emerse in fase 6
- jsdom 30 + Node 22+ non espone `window.localStorage` di default (ExperimentalWarning nativa) — polyfill minimale in `vitest.setup.ts`, non è un problema di codice applicativo
- `ClubStint` ora ha un campo `ovr` (OVR del giocatore alla fine di quel ciclo) — necessario per la CareerTable, che deve mostrare l'OVR storico per riga, non quello attuale

## Storico
- [sprint completati archiviati qui]
