---
type: decisions
tags: [memory, architecture]
updated: [2026-08-10]
---

# Decisioni Architetturali
Registro scelte tecniche con motivazioni.

## Template
### [Titolo breve]
- **Data:** [YYYY-MM-DD]
- **Decisione:** [scelta fatta]
- **Perché:** [motivazione e trade-off]
- **Alternative:** [scartate e perché]
- **Impatto:** [moduli coinvolti] — entità in [[domain]], se formalizzata vedi [[adr]]

---

### Nomi reali di club/leghe/nazionali, no dataset fittizio
- **Data:** 2026-08-04
- **Decisione:** usare nomi reali di club, campionati, coppe e nazionalità (84 club su 4 paesi/8 leghe in `data/clubs.ts`), invece di un mondo fittizio inventato.
- **Perché:** richiesta esplicita dell'utente. Mitigazione del rischio: solo testo, nessun logo/stemma incorporato nel repo — gli stemmi (se usati) sono hotlink a URL esterni, mai file scaricati.
- **Alternative:** mondo fittizio (nomi inventati) — scartato per preferenza utente.
- **Impatto:** `data/clubs.ts`, `data/countries.ts`, tutta la UI mostra nomi reali.

### Solo locale, nessun backend
- **Data:** 2026-08-04
- **Decisione:** nessun account/autenticazione/DB — salvataggio su `localStorage` del browser.
- **Perché:** richiesta esplicita dell'utente, riduce drasticamente la complessità (niente auth, niente hosting DB, niente API).
- **Impatto:** `lib/career/storage.ts` (fase 6, non ancora scritto), nessuna route API prevista.

### Soglie award/nazionale/coppa continentale deliberatamente più generose dell'originale
- **Data:** 2026-08-04
- **Decisione:** nel gioco originale (Copero), Pallone d'Oro e simili sono risultati **irraggiungibili in 10+ carriere complete** anche a OVR 88 con carriera leggendaria; convocazione in nazionale e coppa continentale sono scattate solo 1-2 volte su altrettanti tentativi. Nel nostro clone queste meccaniche sono implementate con soglie di probabilità **volutamente più generose** (es. `nationalCallupChance` parte da OVR 75 invece che restare praticamente muta fino a OVR 85+).
- **Perché:** richiesta esplicita dell'utente ("dobbiamo prevedere tutte queste situazioni che possono accadere") — una feature visibile solo nell'interfaccia ma mai raggiungibile in pratica è un difetto, non fedeltà all'originale.
- **Alternative:** replicare esattamente le probabilità osservate — scartata perché produrrebbe lo stesso difetto nel clone.
- **Impatto:** `lib/career/decisions.ts` (`nationalCallupChance`, `penaltyScoreChance`), award individuali ancora da implementare in fase 6/7.

### Palette "Cartellino del giocatore" — verde campo fisso, non legato al tema
- **Data:** 2026-08-04
- **Decisione:** design distintivo ispirato al tesseramento ufficiale di un calciatore (verde campo, pergamena, oro/medaglia, font condensato Bebas Neue per i titoli), invece del solito dark-mode-con-accento-neon. Il verde del campo da calcio (`--color-pitch`) è un token **separato** da `--color-primary`: resta sempre verde sia in light che dark mode, mentre `--color-primary` cambia (verde in light, oro in dark) per bottoni/accenti.
- **Perché:** un campo da calcio che diventa color oro in dark mode (bug riscontrato e corretto durante lo sviluppo) rompe la metafora visiva — un campo è sempre verde indipendentemente dal tema.
- **Impatto:** `constants/design-tokens.ts`, `app/globals.css`, `JerseyCard.tsx`, `PositionPicker.tsx`.

### Immagini club/competizioni via hotlink reale, ma icona generica (non foto reale) per i premi individuali
- **Data:** 2026-08-05
- **Decisione:** stemmi club (`Club.crestUrl`, 84/84) e badge di campionati/coppe/coppe continentali/Mondiale/Europei (`data/competition-badges.ts`, `COMPETITION_BADGES`) usano hotlink a TheSportsDB, dati sportivi fattuali coperti dai termini d'uso per progetti hobbistici (vedi `.claude/research/team-crests.md`). I 3 `AwardType` individuali (Pallone d'Oro/Giocatore della stagione/Capocannoniere) invece usano un'icona trofeo generica stilizzata (Twemoji via CDN jsdelivr, licenza CC BY 4.0) invece di una foto/icona del vero trofeo Ballon d'Or.
- **Perché:** il nostro `"ballon-dor"` ha soglie/meccaniche tutte nostre (deliberatamente più generose, vedi voce sopra su "Soglie award...irraggiungibili"), non è il vero premio su licenza di France Football/L'Équipe — un'immagine che imita il trofeo reale rischierebbe di implicare un'associazione che non esiste. A differenza degli stemmi club (TheSportsDB dichiara esplicitamente badge "as is" per marchi registrati, quindi il rischio è documentato/mitigato dalla fonte), nessuna fonte controllata per il Ballon d'Or offriva un disclaimer di trademark equivalente — il rischio lì non è mitigato dalla fonte stessa, va evitato a monte con un'icona generica.
- **Alternative:** foto reali del trofeo Ballon d'Or con licenza CC0/CC-BY-SA su Wikimedia Commons (trovate e verificate, es. `Ballon_d'Or.png` CC0) — scartate: la licenza copre la foto/illustrazione in sé, non il diritto di rappresentare con quel design un premio proprio con meccaniche diverse dall'originale.
- **Impatto:** `types/career.ts` (`Club.crestUrl` obbligatorio), `data/clubs.ts`, `data/competition-badges.ts` (nuovo), `components/features/career/ClubCrest.tsx`/`CompetitionBadge.tsx`/`AwardBadge.tsx` (nuovi, stesso pattern: `<img>` con `onError` che nasconde/ripiega su icona lucide invece di lasciare un buco), wired in `PlayerCard`/`OfferPanel`/`CareerTable`/`CareerSummary`. Copertura confederazione-specifica per i trofei di nazionale (Copa América, Asian Cup, ecc.) rimandata — vedi [[backlog]].
- **Conferma 2026-08-06:** playtest dal vivo dell'utente sull'originale ha confermato indipendentemente questa scelta — il riepilogo finale di Copero mostra per gli award individuali un'icona 3D stilizzata "pallone dorato su piedistallo", non una foto/logo realistico del vero trofeo Ballon d'Or. Stile grafico diverso dal nostro Twemoji flat, ma stesso principio (icona generica, non un'immagine che imiti il premio reale).

### Launcher desktop: export statico Next.js + host .NET/WebView2, non Electron/Tauri
- **Data:** 2026-08-05
- **Decisione:** per l'eseguibile `.exe` richiesto dall'utente (vedi [[backlog]]), `next.config.ts` ora usa `output: "export"` (il gioco è interamente client-side, nessuna API route) e un piccolo progetto .NET WinForms (`launcher/CarrieraLauncher/`) incorpora l'export statico come embedded resource, lo serve su `127.0.0.1` via `HttpListener` e lo mostra in una finestra `WebView2` nativa. Pubblicato come singolo file self-contained per `win-x64` (~50 MB) e committato in `dist/Carriera.exe`.
- **Perché:** Windows 11 (target primario dell'utente) include già il runtime WebView2 di serie, quindi non serve imbarcare un intero Chromium come farebbe Electron (~150-250 MB) — il costo residuo è solo il runtime .NET self-contained. `.NET SDK` era già installato sulla macchina, mentre Tauri avrebbe richiesto l'installazione di Rust+toolchain MSVC assente. La build è riproducibile con uno script (`scripts/build-launcher.ps1`), non un artefatto costruito a mano.
- **Alternative:** Electron (scartato: troppo pesante da committare in git permanentemente); Tauri (scartato: nessun toolchain Rust disponibile su questa macchina); Node.js Single Executable Application (scartato: il solo `node.exe` da imbarcare è grande quanto/superiore al runtime .NET, nessun vantaggio di dimensione).
- **Impatto:** `next.config.ts`, `launcher/CarrieraLauncher/**`, `scripts/build-launcher.ps1`, `dist/Carriera.exe` (unico artefatto binario committato — `wwwroot`/`bin`/`obj`/`publish` sono gitignored, rigenerati ad ogni build). Nota tecnica: WebView2 salva profilo/cache in `%LOCALAPPDATA%\Carriera\WebView2` (esplicitamente configurato in `MainForm.cs`) e non accanto all'exe, per non sporcare la cartella del repo.

### Bandiere nazionali via hotlink flagcdn.com, non solo emoji
- **Data:** 2026-08-05
- **Decisione:** nuovo componente `CountryFlag.tsx` (stesso pattern `onError` di `ClubCrest`/`CompetitionBadge`) che mostra la bandiera reale in hotlink da `https://flagcdn.com/{code}.svg` (SVG, per codice ISO 3166-1 alpha-2 — inclusi i codici regione `gb-eng`/`gb-sct`/`gb-wls` per le nazionali britanniche, verificati 200 su flagcdn). Ripiega sull'emoji bandiera già presente in `Country.flag` solo se l'host esterno non risponde. Sostituisce l'uso diretto dell'emoji in `JerseyBadge`/`NationalitySelect` (che ora passano un `Country` invece di una stringa emoji).
- **Perché:** Windows non ha supporto nativo affidabile per le emoji bandiera — mostra il codice ISO in un riquadro invece del vessillo, e le sequenze tag delle nazionali britanniche (Inghilterra/Scozia/Galles) non renderizzano quasi ovunque tranne Apple. Dato che l'app gira anche come `.exe` Windows via WebView2/Edge (vedi launcher sotto), l'emoji da sola non era affidabile per l'utente target.
- **Alternative:** libreria di bandiere SVG locali (es. `flag-icons` via npm) — scartata per coerenza con il pattern già stabilito nel progetto (hotlink, mai asset scaricati/committati, vedi stemmi club/badge competizioni).
- **Impatto:** `src/components/features/career/CountryFlag.tsx` (nuovo), `JerseyBadge.tsx`/`JerseyCard.tsx`/`NationalitySelect.tsx`/`IdentityForm.tsx`/`PlayerCard.tsx` (prop `flag?: string` → `country?: Country`). `Country.flag` (emoji) resta nel dominio solo come fallback.

### Piano di implementazione vive fuori dal repo
- **Data:** 2026-08-04
- **Decisione:** il piano dettagliato (meccaniche osservate, modello dati, fasi) è in `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md`, non in un file dentro il repo del progetto.
- **Perché:** conseguenza del workflow standard di planning di Claude Code (EnterPlanMode scrive lì di default), non una scelta deliberata di design del progetto — da tenere a mente perché non è discoverable solo esplorando il repo.
- **Impatto:** chiunque riprenda lo sviluppo deve sapere di leggere quel file esterno per il contesto completo delle meccaniche di gioco originali.

### `dist/Carriera.exe` non più committato — solo GitHub Release
- **Data:** 2026-08-05
- **Decisione:** rimosso `dist/Carriera.exe` dal tracking git (`git rm --cached`, file locale conservato) e aggiunto `/dist/*.exe` a `.gitignore`. Sostituisce la parte "committato in `dist/Carriera.exe`" della decisione sul launcher desktop sopra — il resto di quella decisione (host .NET/WebView2, `output: "export"`, script di build) resta valido invariato.
- **Perché:** richiesta esplicita dell'utente. Un binario da ~50 MB che cambia ad ogni rigenerazione gonfia la history git indefinitamente (ogni rebuild è un nuovo blob completo, nessun delta utile su un eseguibile compilato); la GitHub Release resta l'unico canale di distribuzione, già documentata come modo "più semplice" in `launcher/README.md`.
- **Alternative:** Git LFS per l'exe — non valutata, scartata implicitamente a favore della soluzione più semplice (solo Release, nessun tracking).
- **Impatto:** `.gitignore` (nuova riga `/dist/*.exe`), `launcher/README.md` (rimossi i riferimenti a "committato nel repo" e alla repo privata, ormai pubblica dal 2026-08-05). Chi rigenera l'exe con `scripts/build-launcher.ps1` deve allegarlo a mano a una GitHub Release — non basta più un commit.

### Momenti di carriera celebrativi (trofei/premi/convocazione) come overlay modale animato
- **Data:** 2026-08-05
- **Decisione:** nuovo `MomentOverlay.tsx` mostra un overlay modale (focus trap, `Escape`/click "Continua" per chiudere, `aria-modal`) con confetti CSS e badge/icona quando il giocatore vince un trofeo, un premio individuale o riceve la convocazione in nazionale (`buildCareerMoments` in `CareerGame.tsx` costruisce la coda di momenti da mostrare in sequenza dopo ogni ciclo). Accanto, `CareerTimeline.tsx` visualizza l'intera carriera (16→40 anni) come barra di progresso con marker per ogni trofeo/premio. Tutte le animazioni (confetti, count-up delle statistiche in `PlayerCard` via `useCountUp`, transizioni) rispettano `prefers-reduced-motion` tramite l'hook condiviso `usePrefersReducedMotion` (`hooks/useMotion.ts`), disabilitandosi invece di degradare.
- **Perché:** richiesta implicita di rendere tangibili i momenti salienti della carriera invece di lasciarli annegati in una tabella/riepilogo — coerente con l'obiettivo già registrato di rendere trofei/premi/nazionale "raggiungibili e sentiti", non solo statisticamente più probabili (vedi soglie generose sopra). Il rispetto di `prefers-reduced-motion` è stato incluso da subito per accessibilità, non aggiunto dopo.
- **Alternative:** toast/notifica non bloccante invece di overlay modale — scartata implicitamente: un trofeo/premio è un momento raro e va celebrato con un'interruzione intenzionale, non un badge che scompare in un angolo.
- **Impatto:** `MomentOverlay.tsx`, `CareerTimeline.tsx`, `hooks/useMotion.ts` (nuovi), `CareerGame.tsx` (+251/+244/+133 righe nette sui tre commit di questa sessione: gestione stato dei momenti in coda, `SetupStepDots` per la navigazione nella creazione personaggio), `PlayerCard.tsx` (count-up sulle statistiche), `globals.css` (keyframe `confetti-fall`, `moment-in`, `step-in`), `lib/career/award-labels.ts` (nuovo, estrae le label italiane di `AwardType` già inline in `CareerSummary` per riuso in `MomentOverlay`).

### Auto-updater del launcher desktop: self-replace via script .bat, versione da package.json
- **Data:** 2026-08-05
- **Decisione:** `MainForm.OnLoad` lancia in background `UpdateChecker.CheckAsync()` (nuovo), che confronta l'`AssemblyVersion` corrente con il tag (`vX.Y.Z`) dell'ultima release su `api.github.com/repos/Gioixxx/Carriera/releases/latest`. Se c'è una versione più recente con asset `Carriera.exe` allegato, un `MessageBox` Sì/No propone l'update; su conferma, `UpdateInstaller.DownloadAndApplyAsync()` (nuovo) scarica il nuovo exe, scrive uno script `.bat` che aspetta la chiusura del processo corrente (poll `tasklist` sul PID), sposta il nuovo exe sopra quello vecchio e lo rilancia, poi la app chiama `Application.Exit()`. `scripts/build-launcher.ps1` passa `-p:Version=$(package.json.version)` a `dotnet publish` invece di duplicare il numero nel `.csproj`, così l'`AssemblyVersion` embeddata segue sempre `package.json.version` senza un secondo numero da tenere sincronizzato a mano.
- **Perché:** un exe self-contained single-file (vedi decisione sul launcher sopra) non può sovrascrivere se stesso mentre è in esecuzione — lo script esterno con poll sul PID è il pattern standard per aggirarlo su Windows senza un secondo processo "updater" permanente da distribuire e mantenere a parte. Qualsiasi errore nel check/download (nessuna connessione, rate limit GitHub, asset mancante) viene inghiottito in silenzio: l'aggiornamento è best-effort e non deve mai bloccare l'avvio del gioco.
- **Alternative:** un eseguibile "updater" separato distribuito insieme al gioco — scartato: più pezzi da costruire/mantenere per lo stesso risultato che uno script `.bat` generato al volo ottiene in poche righe. Automazione CI (GitHub Actions) per pubblicare le release — non affrontata in questo giro: il taglio di una release resta manuale (bump `package.json.version` → `build-launcher.ps1` → `git tag vX.Y.Z` → `gh release create` con l'exe allegato), il tag deve combaciare con la versione buildata perché è quello che il client confronta.
- **Impatto:** `launcher/CarrieraLauncher/UpdateChecker.cs`, `UpdateInstaller.cs` (nuovi), `MainForm.cs` (chiamata fire-and-forget dopo la `Navigate` esistente), `scripts/build-launcher.ps1` (stampa la versione letta da `package.json`), `launcher/README.md` (sezione "Aggiornamento automatico" + checklist di release aggiornata). Nessun controllo manuale a menu — solo check automatico all'avvio.

### Champions League vs Europa League: soglia di prestige, non un nuovo campo dati
- **Data:** 2026-08-05
- **Decisione:** i club UEFA di tier 1 assegnano "Champions League" se `prestige >= 2`, "Europa League" altrimenti (funzione `continentalCompetition(league, prestige)` in `data/clubs.ts`, sostituisce l'uso diretto di `CONTINENTAL_CUP[confederation]` nella factory `club(...)`). CONMEBOL resta invariato (sempre "Copa Libertadores"). Nuovo badge Europa League in `competition-badges.ts` (TheSportsDB id lega 4481).
- **Perché:** un agente di confronto originale-vs-clone (vedi [[tech-debt]], item ora archiviato) ha rilevato che l'originale tratta le due coppe come trofei distinti, mentre il clone assegnava sempre "Champions League". Il campo `prestige` (0-3) già esistente su ogni `Club` era sufficiente come discriminante senza introdurre un nuovo campo nel modello dati — nessun club UEFA tier 1 ha prestige 0, quindi la soglia `>= 2` produce una distribuzione realistica (23 club Champions League, 9 Europa League sui dati originali; il rapporto resta simile dopo l'estensione della Fase 2).
- **Alternative:** un campo esplicito `continentalTier` su `Club` — scartato: ridondante rispetto a `prestige`, che già misura esattamente la stessa cosa (forza del club).
- **Impatto:** `data/clubs.ts` (`continentalCompetition`, `UEFA_EUROPA_LEAGUE`), `data/competition-badges.ts`, `data/clubs.test.ts` (nuovo test sulla mappatura). Nessuna modifica a `lib/career/trophies.ts`/`loop.ts`: il trofeo continentale è assegnato dal mini-gioco "rigore decisivo" già parametrizzato su stringa libera.

### Estensione club/campionati: 5 nuovi paesi, un solo tier ciascuno, prestige bilanciato per garantire offerte locali
- **Data:** 2026-08-05
- **Decisione:** aggiunti a `data/clubs.ts` 40 club reali (8 per paese) per Portogallo (Primeira Liga), Francia (Ligue 1), Germania (Bundesliga), Paesi Bassi (Eredivisie) — UEFA — e Argentina (Liga Profesional) — CONMEBOL. Prestige distribuito 3/3/2/2/1/1/0/0 per ciascun paese: garantisce sia la varietà Champions/Europa League (vedi decisione sopra) sia almeno 4 club con `prestige <= 1` per paese, necessari perché `generateAcademyOffer` ripiega sul pool globale se un paese ne ha meno di 3 (`clubsByCountry(nationality).filter(prestige <= 1)`). Crest URL TheSportsDB verificati individualmente (HTTP 200) prima di committarli, stesso metodo/chiave pubblica `123` già documentato in `.claude/research/team-crests.md`. 10 nuovi badge campionato/coppa nazionale in `competition-badges.ts`.
- **Perché:** lo stesso agente di confronto ha osservato che un giocatore con nazionalità fuori da Italia/Inghilterra/Spagna/Brasile riceveva offerte del settore giovanile "casuali" per nazionalità (es. un portoghese offerto a club italiani/spagnoli), pur avendo `countries.ts` 41 nazionalità selezionabili — la logica di filtro era già corretta, mancavano solo i dati. Un solo tier per paese (invece di 2-3 come Italia/Inghilterra/Spagna) è stato giudicato sufficiente per la copertura minima: l'obiettivo era eliminare il fallback indesiderato, non replicare la profondità di lega dei 4 paesi originali.
- **Alternative:** aggiungere più tier per paese (come i 4 paesi esistenti) — scartato per ora: più lavoro di ricerca badge/crest senza un gap funzionale aggiuntivo da risolvere (nessun evento del dominio richiede oggi una seconda divisione per questi paesi, a differenza delle promozioni/retrocessioni già gestite sui 4 paesi originali).
- **Impatto:** `data/clubs.ts` (5 nuove `League`, 40 nuovi `club(...)`, 84→124 club totali), `data/competition-badges.ts`, `data/clubs.test.ts`/`decisions.test.ts` (nuovi test: mappatura prestige→trofeo estesa, `generateAcademyOffer`/`isReturnHomeEligible` verificati per un giocatore portoghese).

### Sistema "satisfaction": Hall of Fame, record personali, milestone OVR e titoli di stagione in un unico nuovo modulo
- **Data:** 2026-08-06
- **Decisione:** nuovo `lib/career/satisfaction.ts` (402 righe + test) centralizza 4 meccaniche correlate ma distinte: **milestone OVR** (soglie 60/70/80/85/90, `detectOvrMilestones`/`OvrMilestone[]` su `Player.milestonesReached`), **record personali** (`PersonalRecords`: miglior stagione per gol/assist/presenze, picco valore di mercato, età prima convocazione — aggiornati ciclo per ciclo), **titoli di stagione** (`SeasonTitleId` con 8 varianti — "Campione"/"Stagione da Pallone"/"Eroe nazionale"/ecc. —, rank di priorità per scegliere il "miglior titolo" quando più si applicano nello stesso ciclo, cap `SEASON_TITLES_CAP=12` sulla lista mantenuta su `Player.seasonTitles`), **Hall of Fame** (`computeHallOfFame` su `ArchivedCareer[]`: OVR più alto/più trofei/più ricco/più popolare, mostrato in `CareerArchive.tsx` con badge "HoF" sulle carriere vincitrici). In aggiunta, nuovo campo opzionale `DecisionOption.hint` (stringa libera, non un peso numerico) mostrato come sottotitolo in `DecisionPanel`/`OfferPanel`/`PenaltyShootout`, e `CycleObjective` (obiettivo del ciclo corrente mostrato sul cartellino, valutato a fine ciclo).
- **Perché:** stessa direzione già presa con le soglie award/nazionale generose (vedi voce sopra) — rendere la progressione del giocatore tangibile e memorabile invece che solo numeri che salgono. L'Hall of Fame in particolare dà un senso di continuità tra carriere multiple (usa l'archivio già esistente, vedi feature "archivio multi-carriera"). Un modulo dominio puro unico (`satisfaction.ts`) invece di spargere le 4 meccaniche in `engine.ts`/`loop.ts`/`trophies.ts` perché sono tutte "greche" di soddisfazione/riconoscimento del giocatore, non meccaniche di simulazione della carriera in sé — stessa logica di separazione già usata per `wallet.ts` (economia) vs `engine.ts` (progressione OVR).
- **Alternative:** `hint` come percentuale numerica esplicita sull'opzione — scartato qui, resta un gap distinto verso l'originale (vedi [[tech-debt]], "Card di decisione probabilistica senza percentuali visibili"): `hint` è un suggerimento testuale sul trade-off, non i pesi reali dell'outcome.
- **Impatto:** `types/career.ts` (+56 righe: `OvrMilestone`, `PersonalRecords`, `SeasonTitleId`/`SeasonTitleEntry`, `CycleObjectiveKind`/`CycleObjective`, `DecisionOutcome.hint`, `ArchivedCareer.careerTitle`), `lib/career/satisfaction.ts` (nuovo) + `satisfaction.test.ts` (266 righe), `lib/career/loop.ts`/`engine.ts`/`decisions.ts`/`storage.ts` (wiring), `CareerArchive.tsx` (sezione Hall of Fame + badge "HoF"), `CareerSummary.tsx` (miglior titolo + vittorie Hall of Fame), `PlayerCard.tsx`/`CareerGame.tsx`/`CareerTimeline.tsx`/`MomentOverlay.tsx`/`useCareerGame.ts` (wiring stato). Non ancora verificato end-to-end nel browser — vedi [[tech-debt]].

### Record personali infranti spostati da overlay modale a banner persistente non bloccante
- **Data:** 2026-08-06
- **Decisione:** `MomentOverlay`/`buildCareerMoments` (introdotti per trofei/premi/nazionale, vedi decisione sopra sui "Momenti di carriera celebrativi") avevano guadagnato anche un `{ kind: "record" }` che mostrava **solo il primo** record infranto nel ciclo (`input.brokenRecords?.[0]`). Rimosso dall'overlay: ora `DecisionOutcome.brokenRecords` (array completo) è renderizzato come lista testuale sempre visibile in `OutcomeBanner` (dentro `CareerGame.tsx`), non più nella coda di overlay modali.
- **Perché:** un ciclo può rompere più record contemporaneamente (es. miglior stagione per gol *e* nuovo picco di valore di mercato); l'overlay modale forza una scelta "solo il primo" che nasconde gli altri, mentre un ciclo può realisticamente produrre 2-3 record insieme — un banner in lista non ha questo limite e non aggiunge un'interruzione modale per un evento che (a differenza di trofeo/premio/convocazione) può capitare quasi ogni ciclo nelle fasi di crescita del giocatore.
- **Alternative:** accodare un momento modale per ogni record infranto — scartato: troppo intrusivo per un evento frequente, romperebbe il ritmo pensato per l'overlay (riservato a eventi rari: trofeo, premio, convocazione).
- **Impatto:** `MomentOverlay.tsx` (rimosso `kind: "record"`, rimosso import `TrophyIcon` non più usato), `CareerGame.tsx` (`OutcomeBanner` ora legge `outcome.brokenRecords` direttamente, rimosso il campo `brokenRecords` dal builder dei moments).

### Chiusura tech-debt "codificabile": statistiche portiere, percentuali decisione, eventi narrativi, trofei confederazione
- **Data:** 2026-08-06
- **Decisione:** 4 voci di tech-debt/backlog risolte in un'unica sessione, tutte con lo stesso principio di fondo — estendere additivamente invece di riprogettare:
  1. **Statistiche portiere**: `StatLine` guadagna `goalsAgainst?`/`cleanSheets?` **opzionali** (non un discriminated union `OutfieldStats | GoalkeeperStats`), valorizzati solo per `Position === "GK"` in `progression.ts` (`projectGoalkeeperExtras`, formula: gol subiti ∝ livello avversario e ∝ (1 − OVR), clean sheet ∝ OVR). `sumStats`/`popularityDeltaForCycle` sommano i campi extra solo se presenti (`?? 0`), zero fixture di test esistenti toccate. Nuovo titolo di stagione `ironWall` ("Muro invalicabile", soglia 15+ clean sheet/ciclo) e record `bestSeasonCleanSheets` in `satisfaction.ts`.
  2. **Percentuali sulle card decisione**: `favorableOutcomeWeight(option)` in `decisions.ts` generalizza il pattern già introdotto ad-hoc in `PenaltyShootout.tsx` (commit f509fc1) — per un'opzione con 2+ outcome, mostra il peso di quello "favorevole" (euristica: `ovrDelta` più alto, poi assenza di infortunio, poi `savingsDelta+popularityDelta` più alti). Le opzioni deterministiche (1 outcome) non mostrano nulla — l'`hint` testuale resta per il trade-off qualitativo, il numero è un'informazione aggiuntiva non sostitutiva.
  3. **Eventi narrativi mancanti**: 6 nuovi generatori in `decisions.ts` (Club priority/Controversial post → `club-crisis`; Unexpected prospect/Triumphant return → `narrative`, età-gated; Finish high school/Honesty test → pool statico `lifestyle`). "Finish high school" è l'unico evento del pool lifestyle con un gate d'età (≤17) — gestito con un filtro speciale in `pickStaticDecision` invece di generalizzare l'intero pool a supportare eleggibilità, perché è l'unico caso che ne ha bisogno.
  4. **Trofei di nazionale per confederazione**: nuovo campo `confederation` su `Country` (5 valori: UEFA/CONMEBOL/CONCACAF/CAF/AFC), `rollNationalTrophy` sceglie tra "Mondiale" (50%) e il torneo di confederazione corretto invece del fisso "Mondiale"/"Europei".
- **Perché:** l'approccio additivo (campi opzionali, non union type) è stato scelto esplicitamente per **non toccare le fixture di test esistenti** in `progression.test.ts`/`satisfaction.test.ts`/`storage.test.ts`/ecc. che costruiscono `StatLine` letterali `{apps, goals, assists}` — un discriminated union le avrebbe rotte tutte. Idem per `rollNationalTrophy`: parametro `confederation` con default `"UEFA"` per non rompere i call site esistenti che non lo passano.
- **Alternative:** discriminated union per `StatLine` — scartata (vedi sopra); eleggibilità generalizzata per tutto il pool `LIFESTYLE_DECISIONS` — scartata per "Finish high school" essendo l'unico caso, avrebbe aggiunto un'astrazione (campo eleggibilità per-decisione) usata da un solo elemento su 8.
- **Impatto:** `types/career.ts` (`StatLine`, `PersonalRecords`, `SeasonTitleId` +`ironWall`), `lib/career/progression.ts`, `engine.ts`/`summary.ts` (`sumStats`), `wallet.ts`, `satisfaction.ts`, `trophies.ts`, `decisions.ts` (+`favorableOutcomeWeight`, +6 generatori), `loop.ts` (wiring dispatch + eleggibilità), `data/countries.ts` (+`confederation`, +`getCountry`), `data/competition-badges.ts` (+4 badge), UI `PlayerCard`/`CareerTable`/`CareerSummary`/`DecisionPanel`/`OfferPanel`. Bug scoperto e corretto durante l'implementazione: la prima formula di `goalsAgainst` (coefficiente OVR 0.8) produceva un quasi-invariante rispetto a OVR perché l'aumento di presenze con l'OVR compensava quasi esattamente la riduzione per-presenza — corretto aumentando il coefficiente a 1.3, scoperto da un test che confrontava un portiere OVR 90 vs 55 (48 vs 48 gol subiti, arrotondamento coincidente).

### Miglioria motore su 4 assi: harness statistico, meccaniche mancanti, varietà eventi, pulizia tecnica
- **Data:** 2026-08-06
- **Decisione:** su richiesta esplicita dell'utente ("rendere il motore di gioco migliore sotto ogni aspetto possibile"), un'unica sessione ha coperto 4 aree scelte dall'utente tra quelle proposte:
  1. **Harness di simulazione** (`lib/career/simulation.ts`): `simulateCareer()` gioca una carriera intera dal debutto al ritiro con `pickUniformOption` (sceglie a caso tra le opzioni, **escludendo "Ritirati" dal pool casuale** a meno che non sia l'unica scelta — senza questa esclusione un giocatore simulato smetteva volontariamente a ~20 anni ogni volta che capitava per puro caso su un'opzione di ritiro, svuotando di senso ogni statistica misurata). `scripts/simulate-careers.ts` (`npm run simulate`) gira 2000 carriere con `Math.random` reale e stampa frequenze empiriche (trofei/award/callup/infortuni/età di ritiro/frequenza per categoria); gira su una **config vitest separata** (`vitest.simulate.config.mts`, `include: ["scripts/simulate-careers.ts"]`) perché il file non è un `*.test.ts` e quindi non entra nel glob di default di `npm test` — scelta necessaria dopo aver verificato che vitest non esegue file espliciti fuori dal proprio `include`. `simulation.test.ts` (parte di `npm test`) è invece uno smoke test deterministico con un PRNG seedato (mulberry32) su ~400 carriere: asserzioni larghe ("almeno una carriera vince un trofeo/subisce un infortunio/riceve una convocazione", "ogni ritiro cade in 34-40 anni") per intercettare regressioni a zero senza fissare frequenze esatte (fragili in CI).
  2. **Mondiale e coppa continentale indipendenti**: `rollNationalTrophy` (un solo trofeo, coin-flip 50/50 tra i due) sostituita da `rollNationalTrophies` (plurale, `Trophy[]`, due tiri indipendenti contro la stessa `nationalTournamentWinChance`) — replica la scoperta del piano di ricerca esterno che i due trofei non sono mai stati osservati come alternativi nell'originale.
  3. **Promozione/retrocessione di campionato** (`lib/career/club-progression.ts`, nuovo): verificato che la retrocessione **non esisteva già nel codice** nonostante un commento su `Club.tier` la desse per scontata — costruita da zero, simmetrica. Promozione deterministica se il campionato del tier corrente è appena stato vinto; retrocessione probabilistica (`relegationChance`, pesata sul prestigio, valori provvisori 0.18 base / -0.05 per stella) solo nei cicli senza vittoria di campionato. `data/clubs.ts` guadagna `leagueForTier()` ed espone `continentalCompetition()` (prima privata) per ricostruire `competitions` del club nel nuovo tier — no-op silenzioso per i 6 paesi a tier singolo.
  4. **Evento cambio nazionalità** ("nonno di un altro paese", chiudeva un item di tech-debt): eleggibile **solo prima della prima convocazione** (`!player.nationalTeam.called`, età 18-26) — scelta esplicita dell'utente tra le opzioni proposte, evita del tutto la domanda "cosa succede a trofei/statistiche nazionali già accumulati" perché a quel punto non ce n'è ancora nessuno (coerente con le regole FIFA reali: una volta convocato non si può più cambiare). `STORAGE_VERSION` 3→4 con `migratePlayerV3` (default `hasSwitchedNationality: false`).
  5. **Varietà eventi**: finale continentale ora ha 3 template narrativi (rigore/colpo di testa/ultimo rigore della serie) — gli `id` delle opzioni restano sempre `"left"`/`"right"` perché `PenaltyShootout.tsx` li usa per l'animazione, quindi zero modifiche UI necessarie; 2 nuovi contratti sponsor; pesi di categoria ribilanciati (`narrative` 5→12, `lifestyle` 20→18, verificato con l'harness: frequenza osservata di `narrative` raddoppiata da ~4.3% a ~8.7% dei cicli); nuova anti-ripetizione **a livello di singolo evento** dentro club-crisis/lifestyle/narrative (non solo di categoria come già esisteva) — `LoopContext.recentDecisionIds?` traccia gli ultimi "kind" scelti, penalizzati (non esclusi) con lo stesso principio già usato per `recentCategories`/`REPEAT_PENALTY`.
  6. **Pulizia tecnica**: decine di magic number centralizzati in costanti nominate in `market.ts`/`wallet.ts`/`injuries.ts`/`trophies.ts`/`engine.ts` (criterio: solo leve di bilanciamento probabili da rivedere, non bound ovvi come `clamp(x,0,100)`); JSDoc duplicato su `checkRetirement` unificato; commenti che citavano un `decisions.md` mai esistito nel repo sostituiti con la motivazione inline; copertura test rinforzata su `market.test.ts`/`wallet.test.ts`/`injuries.test.ts` con edge case ai breakpoint (soglie età, arrotondamento, severità infortunio).
- **Perché:** richiesta esplicita di migliorare il motore "sotto ogni aspetto possibile" — dato lo scope enorme, prima di procedere sono state proposte 4 aree via `AskUserQuestion` e l'utente le ha selezionate tutte. La sequenza di build (harness prima, poi le feature che toccano formule di probabilità) è stata scelta apposta: qualunque ritaratura di costanti aveva bisogno di uno strumento per misurarne l'effetto empirico prima di cambiare i numeri alla cieca.
- **Alternative:** test statistico con soglie esatte fissate in CI — scartato, fragile e non necessario dato che l'obiettivo è solo intercettare regressioni a zero, non fissare un bilanciamento "corretto" (quello resta materia di giudizio umano sul report stampato da `npm run simulate`). Nazionalità cambiabile anche dopo la prima convocazione — scartata dall'utente per evitare la domanda aperta sulla retroattività di trofei/statistiche già accumulati.
- **Impatto:** `lib/career/simulation.ts` + `simulation.test.ts` (nuovi), `scripts/simulate-careers.ts` + `vitest.simulate.config.mts` (nuovi, `npm run simulate`), `lib/career/club-progression.ts` + test (nuovo), `lib/career/trophies.ts` (`rollNationalTrophies`), `lib/career/decisions.ts` (+`generateNationalitySwitch`/`isNationalitySwitchEligible`, +3 template finale continentale, +2 sponsor, pesi categoria, +costanti nominate), `lib/career/loop.ts` (wiring promozione/retrocessione + cambio nazionalità + anti-ripetizione per evento, `NextDecision`/`LoopContext` estesi), `lib/career/engine.ts` (+`switchNationality`, +costanti ritiro), `lib/career/market.ts`/`wallet.ts`/`injuries.ts` (+costanti nominate), `types/career.ts` (+`Player.hasSwitchedNationality?`, +`DecisionOption.newNationality?`), `storage.ts` (v3→v4), `data/clubs.ts` (+`leagueForTier`, `continentalCompetition` esportata), `hooks/useCareerGame.ts` (2 call site aggiornati per `pickNextDecision` che ora ritorna anche `context`). 269 test (era 250 a inizio sessione), `tsc`/eslint puliti sui file toccati (i 4 warning `react-hooks/set-state-in-effect` pre-esistenti in `CareerGame.tsx`/`useMotion.ts` restano non toccati). **Non verificato manualmente nel browser** (sessione focalizzata sul motore, coerente con le sessioni precedenti di questo tipo) — verificato via test dedicati e via `npm run simulate` prima/dopo le modifiche per confermare nessuna frequenza crollata a zero.

### Menu principale come nuovo step iniziale + musica di sottofondo via asset locale committato (non hotlink)
- **Data:** 2026-08-06
- **Decisione:** su richiesta esplicita dell'utente, nuovo step `"menu"` (default in `CareerGame.tsx`, prima dello step `"speed"` che era l'ingresso implicito) con 4 voci (`MainMenu.tsx`): "Giocatore singolo" (→ step `"speed"`, flusso invariato), "Multiplayer" (disabilitato, badge "In fase di sviluppo", nessun handler), "Impostazioni" (→ nuovo step `"settings"`, `SettingsPanel.tsx`: slider volume 0-100 + toggle mute), "Chiudi" (`window.close()`). Musica di sottofondo (`Passaggio di Spogliatoio.mp3`, fornita dall'utente) committata come asset statico in `public/audio/passaggio-di-spogliatoio.mp3` — **non hotlink**, a differenza di stemmi/badge/bandiere (vedi decisioni sopra): è un file fornito direttamente dall'utente, non contenuto sportivo fattuale di terzi, stesso trattamento already riservato a `public/jersey/`. Riproduzione gestita da `useBackgroundMusic.ts` (hook): un solo `<audio loop>` persistente montato una volta in `CareerGame.tsx` (mai smontato tra gli step, quindi la musica non si riavvia cambiando schermata), volume/muted persistiti in `localStorage` via `lib/audio-settings.ts` (`carriera:audio-settings`, pattern load/save identico a `storage.ts`). Avvio riproduzione demandato al primo gesto utente (`pointerdown`/`keydown` globale, rimosso dopo il primo tentativo riuscito) perché i browser bloccano `play()` con audio prima di un'interazione — verificato end-to-end nel browser che `play()` viene rifiutato silenziosamente se il gesto non è "trusted" ma funziona al primo click reale.
- **Perché:** l'utente ha chiesto esplicitamente un menu con queste 4 voci esatte e un controllo volume nelle impostazioni. Un `<audio>` singolo persistente (invece che uno per step) evita interruzioni percepibili della musica ad ogni cambio schermata — la stessa istanza sopravvive perché `CareerGame` non si smonta mai tra gli step, solo lo step interno cambia. Il bottone "Chiudi" è pensato principalmente per il launcher desktop (vedi sotto): in una tab browser normale `window.close()` è un no-op silenzioso (i browser lo ignorano se la finestra non è stata aperta da script), comportamento accettato perché il target primario è l'eseguibile `.exe`.
- **Alternative:** avviare la musica automaticamente al mount (senza attendere un gesto) — scartata, bloccata dalle autoplay policy dei browser moderni comunque, quindi inutile. Un `<audio>` per-step — scartata, avrebbe fatto ripartire la traccia da zero ad ogni navigazione.
- **Impatto:** `public/audio/passaggio-di-spogliatoio.mp3` (nuovo, 4.7 MB, asset committato), `lib/audio-settings.ts` + test (nuovo), `hooks/useBackgroundMusic.ts` (nuovo), `components/features/career/MainMenu.tsx`/`SettingsPanel.tsx` (nuovi), `CareerGame.tsx` (`Step` esteso con `"menu"`/`"settings"`, default step, header con bottone "← Menu" quando non su `"menu"`, `<audio>` persistente). Lato launcher desktop: `MainForm.cs` sottoscrive `CoreWebView2.WindowCloseRequested` (evento apposito di WebView2 per intercettare `window.close()` chiamato da script, cosa che i browser normali ignorano) e chiama `Close()` sulla finestra — **non ricompilato/verificato in questa sessione** (solo verificato nel browser via dev server), vedi [[tech-debt]] per il rebuild dell'exe ancora da fare prima della prossima release.

### Ricalibrata la curva OVR e le soglie "grande momento" (convocazione/trofeo nazionale/premi/top club)
- **Data:** 2026-08-06
- **Decisione:** su segnalazione diretta dell'utente dopo diverse partite giocate ("OVR quasi mai sopra 80, offerte dai top club rare, mai in nazionale, mai vinto un trofeo di nazionale"), diagnosticata la causa: la curva di crescita OVR (`ovrDeltaForAge`/`GROWTH_STAGES`, `progression.ts`) è puramente basata sull'età (nessun "potenziale"/talento — stessa curva per tutti) e produceva un picco medio teorico di ~74.6 (partendo da OVR 50 a 16 anni), mentre le soglie che sbloccano i grandi momenti erano state tarate nella sessione 2026-08-04 assumendo un tetto raggiungibile più alto (`nationalCallupChance` baseline 75, `awardChance` baseline 85 — quest'ultima di fatto irraggiungibile). Interpellato su come intervenire (`AskUserQuestion`: solo soglie / solo curva / via di mezzo / pity-timer indipendente), **l'utente ha scelto esplicitamente di agire su entrambi gli assi**, non un compromesso minimo. Modifiche: curva OVR riscalata solo nelle fasi di crescita/plateau (`≤21`: 2.5→3.5, `22-27`: 1.4→2.0, `28-31`: 0.3→0.8; fasi di declino invariate) — nuovo picco medio *teorico* ~86.2, ma l'harness (`npm run simulate`) misura un picco medio *reale* di ~81.9 (il gap di ~4-5 punti viene da infortuni/eventi a esito negativo scelti casualmente, non da un bug). Soglie ritarate in due giri di misurazione con l'harness (non a tavolino): `nationalCallupChance` baseline 75→**79**, divisore 40→**35**, cap 0.9→**0.45** (nome delle costanti estratto, prima erano literal inline); `nationalTournamentWinChance` baseline 78→**80**, divisore 150→**70**; `awardChance` baseline 85→**84**, divisore 30→**20**; `targetPrestige` (offerte club) prestige-3 85→**92**, prestige-2 75→**84**, prestige-1 60→**68**. `BALLON_DOR_OVR_THRESHOLD=90` lasciato invariato.
- **Perché:** il roll di convocazione/trofeo-nazionale/award avviene **ad ogni ciclo** (non una tantum, tranne la convocazione che poi resta permanente), quindi anche una soglia "leggermente" più bassa produce un effetto composto enorme su una carriera di 15-20 cicli — il primo giro di taratura (baseline 83, calcolato "a tavolino" sul picco *teorico* 86.2) ha prodotto solo 3.1% di convocazioni, molto sotto l'obiettivo, perché il picco *reale* misurato dall'harness (81.9) è ~4 punti più basso del teorico. Il secondo giro (baseline 79, ricalibrato sul dato reale) ha dato 22.5% convocazioni/5.1% trofei nazionali — dentro le fasce obiettivo. Il primo giro sugli award (baseline 82/divisore 18) ha sovrastimato al 19%+ (soprattutto `player-of-the-season`); un terzo giro (baseline 84/divisore 20) ha riportato il totale al 5-10% con Ballon d'Or sotto l'1%. Conferma pratica del principio già in uso nel progetto ("harness prima, poi ritara") — impossibile prevedere con certezza l'effetto di una soglia senza misurarlo, per via del roll-per-ciclo composto.
- **Alternative:** sistema di "colpi di fortuna garantiti" (pity-timer indipendente dall'OVR) — scartato esplicitamente dall'utente, che ha preferito intervenire sui numeri reali del motore piuttosto che aggiungere un meccanismo parallelo. Ritarare `clubTrophyChance` per contenere l'effetto collaterale (78%→91% con la nuova curva) — scartato: l'utente non ha segnalato i trofei di club come un problema (li vinceva già), e il piano aveva delimitato esplicitamente quella formula fuori scope; l'aumento resta un effetto collaterale monitorato, non un problema da correggere in questa sessione.
- **Impatto:** `lib/career/progression.ts` (curva), `lib/career/decisions.ts` (`nationalCallupChance` con costanti nominate, `targetPrestige`), `lib/career/trophies.ts` (`nationalTournamentWinChance`, `awardChance`), `lib/career/progression.test.ts`/`decisions.test.ts`/`trophies.test.ts` (asserzioni aggiornate ai nuovi valori). Aggiunta diagnostica permanente all'harness: `SimulatedCareerResult.peakOvr` (`lib/career/simulation.ts`) e relativa distribuzione a bucket stampata da `scripts/simulate-careers.ts` — utile per qualunque futura sessione di bilanciamento, non solo per questa. Corretto anche `package.json`'s script `"simulate"` (usava `--reporter=basic`, che fallisce con `ERR_LOAD_URL` su questa versione di vitest — cambiato a `--reporter=verbose`), bug preesistente scoperto durante la verifica, non introdotto da questa modifica. Baseline harness prima/dopo (2000 carriere): trofeo di club 78%→91%, trofeo di nazionale 0.1%→~5%, convocazione 1.5%→~22%, award 0%→~7% (Ballon d'Or ~0.3%). **Non verificato manualmente nel browser** (sessione di bilanciamento numerico, verificata via test + harness) — vedi [[tech-debt]].

### Auto-updater rotto: causa reale HTTP/2 (non il move), diagnosticata sulla macchina dell'utente
- **Data:** 2026-08-06
- **Decisione:** dopo il primo fix (retry sul `move` + log, rilasciato come v0.3.1) l'utente ha riportato che l'update falliva ancora. Ispezionando direttamente `%TEMP%\CarrieraUpdate\` sulla sua macchina è emerso un `Carriera.new.exe` da ~4.9 MB invece dei ~58 MB attesi, senza alcun `update-log.txt` — il fallimento avveniva quindi *prima* dello script, durante il download stesso, senza sollevare un'eccezione .NET. Un download diretto dello stesso URL via `Invoke-WebRequest` (PowerShell) è completato regolarmente in ~40s alla dimensione esatta, isolando il problema a `HttpClient`. Causa: la CDN dei release asset GitHub parla HTTP/2, che `HttpClient` negozia di default; su questa configurazione lo stream HTTP/2 si interrompeva a metà senza errore visibile. Fix (v0.3.2): la richiesta di download fissa esplicitamente `HttpVersion.Version11` + `HttpVersionPolicy.RequestVersionExact`; il controllo di integrità post-download confronta la dimensione scaricata col `Content-Length` dichiarato dal server (quando presente) invece della sola soglia minima di 5 MB.
- **Perché:** l'unico modo per trovare la causa reale è stato ispezionare i file di diagnostica lasciati dal fix precedente sulla macchina dell'utente (il log/percorso temp introdotti proprio per questo) — senza quel primo giro di logging, il secondo bug (HTTP/2) sarebbe rimasto altrettanto invisibile del primo.
- **Alternative:** nessuna: una volta isolata la causa (download troncato, non move fallito), forzare HTTP/1.1 è il fix diretto, non un compromesso tra alternative.
- **Impatto:** `launcher/CarrieraLauncher/UpdateInstaller.cs`. **Verificato end-to-end dall'utente**: un exe di test pinnato a v0.1.0 ha rilevato v0.3.2 come aggiornamento, scaricato per intero e applicato con successo (FileVersion 0.3.2.0 confermato dopo l'update) — la prima verifica live del flusso di auto-update da quando esiste (vedi [[tech-debt]], voce ora archiviata). Nota per il futuro: il fix vive nel codice del *client* che scarica l'update, quindi un'installazione precedente alla v0.3.2 userà ancora il proprio downloader (potenzialmente rotto) per scaricare l'aggiornamento — un'installazione manuale una tantum risolve il problema in modo definitivo per quell'installazione.

### Musica di sottofondo: avvio immediato nel launcher via autoplay-policy WebView2, non più legato al primo click
- **Data:** 2026-08-06
- **Decisione:** segnalazione utente: la musica partiva solo dopo aver cliccato una voce del menu, non insieme alla schermata iniziale. Causa: qualunque motore Chromium (incluso quello dentro WebView2) blocca `audio.play()` finché non arriva un gesto reale dell'utente — con la sola schermata menu cliccabile, il "primo gesto" coincideva per forza con un click su una voce. Fix in due parti: (1) `MainForm.cs` crea l'ambiente WebView2 con `AdditionalBrowserArguments = "--autoplay-policy=no-user-gesture-required"`; (2) `useBackgroundMusic.ts` tenta `play()` subito al mount invece di aspettare solo un gesto — nel launcher (col flag) riesce subito, in un browser normale senza quel flag fallisce silenziosamente e resta il comportamento precedente (parte al primo click) come fallback.
- **Perché:** disattivare l'autoplay policy è sicuro qui perché WebView2 nel launcher non è una pagina web pubblica ma la nostra unica finestra dedicata che esegue solo il nostro gioco — non è un flag che si potrebbe (né vorrebbe) applicare al browser normale dell'utente, per questo il fallback lato browser resta invariato.
- **Alternative:** nessuna considerata — la causa (autoplay policy) ammette un solo fix diretto una volta identificata.
- **Impatto:** `launcher/CarrieraLauncher/MainForm.cs`, `src/hooks/useBackgroundMusic.ts`. Verificato dall'utente eseguendo l'exe rigenerato: la musica parte da sola con la schermata del menu, senza click.

### Download update ancora troncato dopo il fix HTTP/1.1: retry automatico dell'intero download
- **Data:** 2026-08-06
- **Decisione:** dopo il rilascio v0.3.2 (fix HTTP/1.1), l'utente ha aggiornato da v0.3.2 ma il flusso non ha prodotto alcun effetto visibile oltre l'alert iniziale. Ispezionando di nuovo `%TEMP%\CarrieraUpdate\` sulla sua macchina: `Carriera.new.exe` troncato a **~36.6 MB su ~58 MB attesi (63.7%)** — un punto di troncamento diverso dal precedente episodio (~8%), a conferma che non è un bug di protocollo fisso (quello era già risolto forzando HTTP/1.1) ma un'interferenza di rete/sicurezza che interrompe lo stream in modo non deterministico, a punti diversi a seconda del tentativo. Fix: l'intero download (non solo il "move" finale, già con retry dal fix precedente) viene ora ritentato automaticamente fino a 5 volte con backoff crescente (2s, 4s, 6s, 8s, 10s) prima di arrendersi, con ogni tentativo loggato in `update-log.txt` fin da subito (non solo se si arriva allo script di sostituzione).
- **Perché:** un client basato su WinHTTP (`Invoke-WebRequest`, usato per diagnosticare) completava il download regolarmente sulla stessa rete, a differenza di `HttpClient`/`SocketsHttpHandler` che non ha resilienza/retry integrata su un reset di connessione a metà stream — la differenza sta nella resilienza del client, non nell'URL o nel protocollo. L'utente ha chiesto esplicitamente che il flusso sia "tutto automatico": un singolo tentativo fragile su una rete/ambiente che intermittentemente interrompe connessioni lunghe non è accettabile per un aggiornamento che deve "semplicemente funzionare".
- **Alternative:** diagnosticare e rimuovere la causa dell'interferenza di rete stessa (es. individuare quale software di sicurezza interrompe la connessione) — scartato per ora: non c'è visibilità diretta sul perché la connessione si interrompe (i log di Windows Defender non mostrano eventi di blocco in quella finestra), e un retry applicativo risolve il sintomo in modo affidabile indipendentemente dalla causa esatta.
- **Impatto:** `launcher/CarrieraLauncher/UpdateInstaller.cs` (`DownloadOnceAsync` estratto, loop di retry, `LogAsync`), `MainForm.cs` (messaggio di errore finale più esplicito, menziona i tentativi automatici e il percorso del log). Rilasciato come v0.3.4. **Limite noto**: il fix vive nel downloader della versione *già installata* — un'installazione v0.3.2/v0.3.3 continuerà a fare un solo tentativo per check, riuscendo solo quando quel singolo tentativo non viene interrotto; solo dalla v0.3.4 in poi gli aggiornamenti *successivi* beneficiano del retry automatico. Per la macchina di sviluppo (stessa macchina dell'utente), `dist/Carriera.exe` è stato rigenerato e consegnato per esecuzione diretta, bypassando il download flaky. **Non ancora riverificato dall'utente con un nuovo tentativo di update reale** — vedi [[tech-debt]].

### Indicatore di caricamento durante l'update del launcher, con menu disabilitato
- **Data:** 2026-08-06
- **Decisione:** l'assenza di qualunque feedback visivo durante il download dell'aggiornamento (v0.3.4, con retry automatici fino a un paio di minuti su rete instabile) ha causato in diretta due tentativi interrotti dall'utente stesso, che ha chiuso l'app pensando fosse bloccata — verificato ispezionando `update-log.txt` in tempo reale nella stessa sessione: nessun fallimento del retry, solo chiusure premature per mancanza di segnale. Nuovo `UpdateProgressForm.cs` (finestra non modale, senza pulsante di chiusura dato che l'utente ha già confermato l'update) mostra percentuale, MB scaricati/attesi e numero di tentativo in tempo reale, aggiornato via `IProgress<UpdateProgress>` collegato a una lettura del download a blocchi (`DownloadOnceAsync` non usa più `CopyToAsync` in un colpo solo). Due iterazioni di rifinitura su feedback diretto dell'utente dopo la prima verifica: (1) `MainForm.Enabled = false` per tutta la durata dell'update — il menu sotto (WebView2) restava altrimenti cliccabile mentre l'exe in uso stava per essere sostituito; (2) finestra ingrandita (360×78→460×140) e centrata sullo schermo fisico (`CenterScreen` invece di `CenterParent`, per evitare dipendenze dai bound della finestra proprietaria).
- **Perché:** un'operazione che può richiedere fino a 1-2 minuti senza alcun segnale visivo invita l'utente a intervenire pensando sia bloccata, vanificando il lavoro di resilienza già fatto (retry automatico) — il problema reale non era il retry (che ha funzionato), ma la percezione di blocco che portava a interromperlo manualmente.
- **Alternative:** nessuna considerata — un indicatore di progresso è la soluzione diretta al problema diagnosticato (mancanza di feedback), non un compromesso tra alternative.
- **Impatto:** `launcher/CarrieraLauncher/UpdateProgressForm.cs` (nuovo), `UpdateInstaller.cs` (`UpdateProgress`/`UpdatePhase`, lettura a blocchi con report periodico), `MainForm.cs` (`Enabled = false`/`true` attorno all'update, form di progresso wired). Verificato dall'utente con un exe di test pinnato a v0.1.0: barra di progresso visibile e funzionante, menu non interagibile durante l'update.

### Ricerca su larga scala (23 carriere, 3 agenti browser paralleli) sull'originale: nessun cambio di codice, solo correzione di una nota errata
- **Data:** 2026-08-06
- **Decisione:** su richiesta esplicita dell'utente di raccogliere più dati sul bilanciamento dell'originale ("crescita, premi ecc."), 3 agenti con controllo browser hanno giocato **23 carriere complete** su Copero (obiettivo 20-30, ridotto per instabilità del browser durante una delle sessioni) con strategie diverse: crescita OVR massimizzata, scelte varie "giocatore medio", verifica mirata di promozione/retrocessione/infortuni/portiere/Mondiale-coppa continentale. Dettaglio completo nel piano esterno `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md`, sezione "Esplorazione aggiuntiva 5". Nessuna modifica al codice del clone in questa sessione: i risultati **confermano** la maggior parte delle scelte già fatte (award individuale 0/18 anche nel caso più estremo osservato finora, conferma diretta della decisione di renderli deliberatamente più raggiungibili nel clone; trofeo di nazionale aggregato ~5.6% molto vicino al ~5% ricalibrato; statistiche portiere confermate presenti ovunque nell'originale) e **correggono** una nota di memoria rivelatasi sbagliata (vedi sotto), oltre ad aprire 2 item di tech-debt a bassa priorità (finestra di ritiro probabilistico, promozione mai osservata in UI) e 2 idee di backlog (evento doping "Sostanza misteriosa", evento "Fan backlash" da ricercare meglio).
- **Perché:** un campione singolo/piccolo (come i playtest precedenti, spesso 1-5 carriere per sessione) può produrre conclusioni false-negative su meccaniche a bassa probabilità (percentuali mostrate solo su una sottocategoria di eventi, osservabile solo se capita quel tipo specifico di evento) — un campione di 23 carriere con strategie deliberatamente diverse (ottimizzata/casuale/mirata) riduce il rischio di generalizzare da un caso non rappresentativo.
- **Alternative:** nessuna — la richiesta era esplicitamente di ricerca, non di implementazione; eventuali azioni sui nuovi tech-debt/backlog restano a discrezione di una sessione futura.
- **Impatto:** `.claude/memory/tech-debt.md` (corretta la nota sull'item archiviato "Card di decisione probabilistica senza percentuali visibili" — le percentuali esistono per gli eventi lifestyle/allenamento a esito probabilistico, non sono assenti; aggiunta cross-validazione all'item "Ricalibrazione OVR/soglie... non verificata"; 2 nuovi item aperti), `.claude/memory/backlog.md` (2 nuovi eventi), piano esterno (nuova sezione "Esplorazione aggiuntiva 5", 7 sottosezioni numerate). **Correzione importante da ricordare**: la nota precedente "l'originale non mostra MAI percentuali sulle card decisione" (decisa il 2026-08-06 nella stessa giornata, poche ore prima, su un singolo playtest) era **sbagliata** — le percentuali compaiono per rischi fisici/salute a due vie (allenamento, doping, dieta), non per bivi deterministici o offerte di trasferimento.

### Follow-up dalla ricerca: nuovo evento doping + finestra di ritiro allargata a 31 anni (cubica, non quadratica)
- **Data:** 2026-08-06
- **Decisione:** su un piano concordato con l'utente per agire su 2 dei 4 item aperti dalla ricerca (Esplorazione aggiuntiva 5): (1) nuovo evento lifestyle `mysterious-substance` ("Sostanza misteriosa", doping) in `LIFESTYLE_DECISIONS` — "Prendilo" 75%/+5 OVR vs 25%/squalifica (modellata come `injuryOutcome`, 2 cicli/malus 4, valori scelti per coerenza con gli eventi lifestyle affini già calibrati, dato che l'originale non specifica un numero per la squalifica) vs "Rifiuta" deterministico; (2) `RETIREMENT_RISK_START_AGE` in `engine.ts` da 34 a **31** (osservati ritiri probabilistici già a 31-34 anni sull'originale), MA la formula di `checkRetirement` passa da quadratica a **cubica** (`progress ** 3` invece di `progress ** 2`) dopo aver misurato con `npm run simulate` che il solo allargamento con l'esponente invariato spostava troppo peso verso i ritiri anticipati (età 40/auto-cap scendeva da 49.5% a 22.2%, mentre la ricerca sull'originale suggerisce che l'auto-cap/età alta resti la maggioranza, ~50-60% nei campioni aggregati). Con l'esponente cubico l'auto-cap torna al 43.8% (vicino al 49.5% originale) con solo una coda minoritaria di ritiri a 32-34 anni (3.5%+0.1%), coerente con le "2 osservazioni su 18" della ricerca.
- **Perché:** stesso principio già stabilito nel progetto — mai tarare "a tavolino": il primo tentativo (esponente invariato) sembrava ragionevole sulla carta ma l'harness ha mostrato un effetto collaterale non ovvio (il denominatore più grande della finestra, 9 anni invece di 6, alza anche la probabilità nella vecchia fascia 34-40 a parità di esponente, non solo aggiunge rischio nella nuova fascia 31-33) — misurato e corretto prima di considerare la modifica conclusa.
- **Alternative:** tenere l'esponente quadratico e accettare la distribuzione spostata — scartato perché si allontanava dal segnale osservato (auto-cap che smette di essere la modalità dominante); un pity-timer o una curva a tratti — non necessario, il cubo con lo stesso stile di formula già in uso risolve senza nuova complessità.
- **Impatto:** `lib/career/decisions.ts` (+`mysterious-substance`), `lib/career/decisions.test.ts` (+1 test), `lib/career/engine.ts` (`RETIREMENT_RISK_START_AGE` 34→31, formula cubica, commenti aggiornati), `lib/career/engine.test.ts`/`simulation.test.ts` (asserzioni aggiornate alla nuova soglia/finestra). 275 test verdi (era 274), `tsc`/eslint puliti. Baseline harness prima/dopo (2000 carriere, esponente cubico): età di ritiro 40 anni 49.5%→43.8%, 38 anni 38.9%→36.3%, 36 anni 11.7%→16.3%, 34 anni 0%→3.5%, 32 anni 0%→0.1%; nessun'altra frequenza (trofeo/convocazione/award) si è mossa in modo significativo. **Non verificato manualmente nel browser** (evento additivo + una costante, stesso standard di verifica già usato per modifiche simili — test + harness).

### Espansione mondo (12 nuovi paesi, 96 club) + meccanica "Giant Killer" + strumento di sync roster
- **Data:** 2026-08-06
- **Decisione:** su richiesta esplicita dell'utente ("ideiamo nuove meccaniche di gioco"), tra 4 direzioni proposte (rivalità/relazioni, pressione al club, vita fuori dal campo, espansione mondo) l'utente ha scelto **espansione mondo**. Piano approvato in `C:\Users\Gioix\.claude\plans\ideiamo-nuove-meccaniche-di-buzzing-pearl.md`, eseguito in più parti:
  1. **Unificazione `Confederation`**: `data/clubs.ts` importa ora `Confederation` da `@/data/countries` (5 valori) invece di ridefinirlo localmente a 2 (UEFA/CONMEBOL). `CONTINENTAL_CUP` esteso con CONCACAF ("CONCACAF Champions Cup"), CAF ("CAF Champions League"), AFC ("AFC Champions League Elite") — nomi verificati via web search, non dati per scontati dalla memoria di training (CONCACAF ha rinominato la propria coppa da "Champions League" a "Champions Cup" nel 2023/24, AFC si è ristrutturata in "Elite" nel 2024/25). `continentalCompetition()` non ha richiesto modifiche al corpo — il ramo non-UEFA già ritornava `CONTINENTAL_CUP[confederation]` senza split di prestigio.
  2. **12 nuovi paesi con club reali** (dei 14 pianificati — Arabia Saudita e Qatar interrotti a metà ricerca su richiesta dell'utente, vedi sotto e [[backlog]]): Messico/USA/Canada (CONCACAF), Marocco/Senegal/Nigeria/Ghana/Egitto/Costa d'Avorio (CAF), Giappone/Corea del Sud/Australia (AFC). Ricerca delegata a 3 agenti in background (uno per confederazione, con `WebFetch`/chiamate dirette a TheSportsDB chiave `123`), ognuno ha appeso le proprie tabelle a `.claude/research/team-crests.md` senza toccare `clubs.ts` direttamente (per evitare collisioni id in merge paralleli) — una singola passata di trascrizione ha poi consolidato tutto, con un controllo esplicito di unicità id (0 collisioni su 96+124 club) e una verifica HTTP diretta a campione (non solo fidandosi del report degli agenti) su badge lega/coppa e su un campione di crest club per confederazione, prima di committare. 12 nuove `League` (una per paese, tier singolo, stesso pattern del 2026-08-05), 96 nuovi `club(...)`, prestige distribuito 3/3/2/2/1/1/0/0 per ciascun paese (stessa motivazione già stabilita: garantisce almeno 4 club a basso prestigio per paese per `generateAcademyOffer`).
  3. **`League.cup` diventato opzionale** (`string?` invece di `string`): il Messico non ha una coppa nazionale attiva (Copa MX sospesa dal 2019-20, confermato sia da ricerca web sia dall'assenza in `search_all_leagues.php?c=Mexico` su TheSportsDB) — nessun valore reale esisteva da assegnare senza inventarlo. `ClubCompetitions.cup` in `types/career.ts` era già opzionale, quindi la propagazione attraverso `club()` non ha richiesto modifiche; l'unico punto che assumeva "ogni club ha sempre una coppa" era la nuova meccanica Giant Killer (vedi sotto), corretto per controllare l'esistenza prima di innescarsi (mirror di come la finale continentale già controlla `competitions.continental`).
  4. **Meccanica "Giant Killer" (sorpresa di coppa)**: nuova categoria `"cup-upset"`, stesso schema UX della finale continentale esistente (riuso di `PenaltyShootout.tsx`, mini-gioco del rigore) ma per club di prestigio ≤1 contro un avversario di prestigio ≥+2 dello stesso paese (`pickCupUpsetOpponent`, fallback su pool globale). Probabilità di vittoria (`cupUpsetWinChance`) deliberatamente sempre sotto il 50% — è per definizione un evento improbabile, a differenza del rigore della finale continentale che resta vicino alla parità. Vittoria assegna un vero `Trophy` (la coppa nazionale del club), sconfitta dà solo un piccolo bonus di popolarità di consolazione — nessuna nuova UI per la sconfitta, riusa `OutcomeBanner` esistente. Nuovo titolo di stagione `"giantKiller"` ("Ammazzagigante"), con precedenza esplicita su `"champion"` in `pickSeasonTitleId`/`TITLE_RANK` (altrimenti la sorpresa di coppa sarebbe sempre assorbita nel generico "Campione"). `npm run simulate` (2000 carriere): trigger 7.1% dei cicli, vinta nel 23.7% dei cicli innescati — un evento raro ma non trascurabile, win rate sempre ben sotto il 50% come da design.
  5. **Nuovo strumento diagnostico** `scripts/sync-league-rosters.ts` (`npm run sync-rosters`, sola lettura, non scrive mai su `clubs.ts`) per confrontare periodicamente i roster reali con i dati del gioco — richiesto esplicitamente dall'utente a metà sessione ("dobbiamo trovare il modo anche di avere i campionati sempre aggiornati"). Prima versione ingenua (query per paese) si è rivelata inutilizzabile: `search_all_teams.php?c=<paese>` restituisce migliaia di club dilettantistici in un'unica lista troncata, i grandi club noti restano fuori dalla risposta. Riprogettato in due passi per lega: `search_all_leagues.php?c=<paese>` per scoprire il nome esatto TheSportsDB, poi `search_all_teams.php?l=<nome risolto>` per il roster — stesso metodo già usato dalla ricerca manuale. Anche questo endpoint di scoperta si è rivelato troncato (~5 risultati, spesso senza includere la lega di massima serie tra quei pochi) per diversi paesi (Inghilterra/Brasile/Portogallo/Paesi Bassi) — risolto con una mappa `TSDB_LEAGUE_NAME_OVERRIDES` di nomi verificati a mano per le leghe dove la scoperta dinamica fallisce sistematicamente, con fallback dinamico per le leghe non ancora mappate. **Limite confermato e documentato nel codice**: `search_all_teams.php` tronca comunque a 10 squadre per risposta anche per leghe reali da 18-20 club — la lista "in clubs.ts ma non nel roster live" dello script resta quindi strutturalmente rumorosa, un'assenza da quella lista non è prova di retrocessione/rinomina.
  6. **Arabia Saudita e Qatar interrotti**: a metà ricerca l'utente ha chiesto esplicitamente di sospendere questi 2 paesi e chiudere la sessione. Stato: Arabia Saudita 4/8 club verificati (mancano i big Al-Hilal/Al-Ittihad/Al-Ahli/Al-Shabab), Qatar 7/8 club trovati ma **nessun crestUrl verificato live** — nessun dato per questi 2 paesi è stato trascritto in `clubs.ts`, solo documentato come follow-up in [[backlog]].
- **Perché:** l'espansione mondo colma un gap reale già identificato in ricerca (14 delle 41 nazionalità selezionabili non avevano nessun club — un giocatore di quella nazionalità non aveva praticamente dove giocare "in casa"). La ricerca a 3 agenti paralleli per confederazione è stata scelta per contenere il tempo di una ricerca altrimenti enorme (96 club × verifica individuale) mantenendo comunque lo stesso standard di verifica HTTP diretta già stabilito nel progetto — mai fidarsi di un URL "sembra giusto" senza una richiesta reale. Il rendere `League.cup` opzionale invece di inventare un nome per la Copa MX rispetta lo stesso principio "mai fabbricare dati sportivi" già alla base di tutta la ricerca crest del progetto. Interrompere Arabia Saudita/Qatar su richiesta dell'utente ha avuto priorità su completare la copertura pianificata — meglio 12 paesi con dati verificati che 14 con 2 incompleti/non verificati.
- **Alternative:** una ricerca curata di 6-7 campionati principali invece della copertura completa — proposta e scartata dall'utente, che ha scelto la copertura completa. Un unico agente sequenziale per tutti e 14 i paesi — scartato per tempo (agenti paralleli per confederazione hanno permesso di lavorare su CONCACAF/CAF/AFC contemporaneamente). Fabbricare un nome/prestige per la Copa MX o per gli stemmi Qatar non verificati — scartato, viola il principio fondante della ricerca crest del progetto.
- **Impatto:** `src/data/clubs.ts` (+96 club, +12 `League`, `Confederation` unificato, `League.cup` opzionale), `src/data/competition-badges.ts` (+21 badge lega/coppa/coppa continentale, nuovo `CUP_BADGES_KNOWN_GAP` per le 6 coppe CAF senza badge TSDB), `src/types/career.ts` (+`DecisionCategory` `"cup-upset"`, +`DecisionOutcome.cupUpsetWin`, +`SeasonTitleId` `"giantKiller"`), `src/lib/career/decisions.ts` (+`pickCupUpsetOpponent`, +`cupUpsetWinChance`, +`generateCupUpsetDecision`), `src/lib/career/loop.ts` (+`shouldTriggerCupUpset`, wiring trigger/trofeo), `src/lib/career/satisfaction.ts` (+`giantKiller`, `TITLE_RANK` riordinato), `src/lib/career/simulation.ts`/`scripts/simulate-careers.ts` (+tracciamento `cupUpsetWinCount`), `src/components/features/career/CareerGame.tsx`/`PenaltyShootout.tsx` (wiring UI), `scripts/sync-league-rosters.ts` + `vitest.sync-rosters.config.mts` (nuovi), `.claude/research/team-crests.md` (+3 sezioni paese). 297 test verdi (era 275), `tsc`/eslint/`npm run build` puliti. **Non verificato manualmente nel browser** (sessione di codice/dati, verificata via test + harness + verifica HTTP diretta degli URL) — vedi [[tech-debt]].

### Traits/archetipo + Shadow (debito morale): due meccaniche costruite insieme, Relazioni NPC rimandate
- **Data:** 2026-08-06
- **Decisione:** su una proposta dell'utente in 3 parti (§1 archetipo di stile da vettori di personalità nascosti, §2 relazioni NPC persistenti, §3 debito morale "shadow" con scandali forzati), implementate **§3 + §1 insieme** in un'unica sessione (piano approvato in `C:\Users\Gioix\.claude\plans\whimsical-strolling-minsky.md`), seguendo l'ordine di implementazione indicato dallo stesso utente ("Shadow → Traits → Relazioni", perché scrivono sugli stessi outcome). **§2 (Relazioni NPC) resta interamente fuori scope**, non specificato a sufficienza e esplicitamente "dopo che i delta esistono" nelle parole dell'utente.
  - **Modello dati** (`types/career.ts`): `Traits` (5 vettori 0-100: loyalty/ambition/showmanship/discipline/leadership, default neutro 50), `ArchetypeId` (6 valori — uso `ArchetypeId | null` invece del letterale `"undefined"` proposto dall'utente, per non collidere col keyword JS), `ShadowFlags` (4 flag narrativi utente + 2 di bookkeeping interno `scandalOccurred`/`redeemed` per l'eleggibilità alla redenzione). `Player.traits`/`shadow`/`shadowFlags`, `PlayerDelta.traitsDelta`/`shadowDelta`/`shadowFlags` (stesso pattern additivo di `popularityDelta`). Nuova categoria forzata `"scandal"` in `DecisionCategory`. `ArchivedCareer.archetypeId`/`shadowTitle` come snapshot al ritiro.
  - **Nuovi moduli puri** (pattern `wallet.ts`): `lib/career/traits.ts` (`applyTraitsDelta`, `deriveArchetype` — priorità `problem` > `mercenary` > vettore singolo più alto quando più condizioni sono vere insieme) e `lib/career/shadow.ts` (soglie 25/50/75/90 e formula moltiplicatore `1 - shadow/200`, tutte **date esplicitamente dall'utente**, non tarate).
  - **Retrofit su generatori esistenti**: `outcome()`/`signOption()` in `decisions.ts` estesi con un parametro opzionale `extra?: Partial<PlayerDelta>` (backward-compatible, ~40 call site invariati) per aggiungere `traitsDelta`/`shadowDelta` a transfer/club-crisis/controversial-post-statement/tax-trouble/sponsor/lifestyle risky senza toccare la loro logica esistente.
  - **Scandalo forzato**: nuova categoria `"scandal"`, generata da `shouldTriggerScandal` (shadow≥50, non ripetuto se già nei `recentCategories`) esattamente con lo stesso schema di trigger forzato già usato da `shouldTriggerContinentalFinal`/`shouldTriggerCupUpset` in `pickNextDecision` — nessuna nuova architettura, riuso diretto di un pattern consolidato. Redenzione (`isRedemptionEligible`) aggiunta come sesto generatore eleggibile nel pool `narrative` esistente, stesso schema delle altre 5 eligibility gate.
  - **Award/callup**: `rollNationalCallup`/`rollAward` moltiplicati per `shadowMultiplier(shadow)` e bloccati sopra `SHADOW_BAN_THRESHOLD` (75) — un fattore in più su formule già esistenti, non nuove pool.
  - **Migrazione**: `STORAGE_VERSION` 4→5, `migratePlayerV4` (default neutri).
  - **UI**: chip "Stile: X" su `PlayerCard` (pattern uppercase tinto, stesso stile del badge infortunio), mostrato solo da `clubHistory.length >= 4` — l'utente aveva chiesto esplicitamente "non subito, dopo 3-4 cicli"; chip "Rumors" a shadow≥25, **mai il numero esplicito** (richiesta esplicita dell'utente: "non mostrare il numero"). Archetipo/titolo shadow-derivato aggiunti come testo accanto al miglior titolo di stagione in `CareerSummary`, tag compatto in `CareerArchive` — tenuti **deliberatamente separati** dal sistema `SeasonTitleId`/`pickBestCareerTitle` esistente perché l'archetipo è un tratto di carriera continuo, non un titolo per-ciclo.
  - **Harness e taratura**: `simulation.ts`/`scripts/simulate-careers.ts` estesi con distribuzione archetipo finale, bucket shadow, tasso scandalo/redenzione. **Prima misurazione**: tutti e 6 gli archetipi sostanzialmente irraggiungibili sotto scelta uniforme casuale (99.8% "nessuno", `pro`/`leader`/`flagbearer` a 0.0%) — stesso identico pattern già visto con la ricalibrazione OVR (soglie stimate "a tavolino" risultano quasi sempre troppo severe). Diagnosticato: `loyalty`/`ambition`/`showmanship` hanno più punti di contatto per carriera (transfer ~2x/carriera, controversial-post/statement che alzano showmanship su **entrambe** le opzioni senza diluizione dalla scelta) mentre `discipline`/`leadership` avevano solo touchpoint rari e diluiti al 50% dalla scelta casuale. Fix in due tempi: (1) soglie `ARCHETYPE_DOMINANT_THRESHOLD`/`ARCHETYPE_LOW_THRESHOLD` abbassate 65/40 → 58/45; (2) individuata una fonte di leadership esplicitamente citata dall'utente ma non ancora cablata ("capitano, difesa compagni, **nazionale**") — aggiunto un bonus leadership alla prima convocazione in `loop.ts` (`NATIONAL_CALLUP_LEADERSHIP_BONUS`), più un raddoppio dei delta discipline sui touchpoint lifestyle esistenti. Risultato dopo il secondo giro: tutti e 6 gli archetipi non nulli (flagbearer 3.0%, mercenary 4.7%, showman 9.3%, pro 2.0%, leader 3.1%, problem 0.1%), scandalo/redenzione shadow anch'essi non nulli. **Le soglie/formule di `shadow.ts` non sono state toccate** in nessun giro di taratura, essendo valori espliciti dell'utente, non stime di prima approssimazione.
- **Perché:** stesso principio già consolidato nel progetto ("harness prima, poi ritara", vedi ricalibrazione OVR) — la prima stima delle soglie archetipo era quasi impossibile da raggiungere sotto scelta casuale, esattamente come già successo con OVR/award/callup. La differenza rispetto a quell'episodio: qui la causa non erano solo soglie sbagliate ma un vero e proprio touchpoint mancante (leadership↔convocazione) che l'utente aveva già scritto nella sua proposta ma che il primo giro di implementazione aveva omesso — la misurazione empirica lo ha reso visibile, non solo "quanto" ma "cosa mancava". La separazione scrittura/lettura (vedi Contesto del piano) ha tenuto lo scope proporzionato: la parte "lettura" (pool di offerte/eventi pesati per archetipo, "sponsor discutibili" più facili con shadow medio) avrebbe introdotto object-level architettura nuova mai vista nel codice, e viene rimandata a una sessione dedicata con dati reali di partenza.
- **Alternative:** implementare anche §2 (Relazioni NPC) nella stessa sessione — scartato, il contenuto necessario (copy per 4 relazioni × più eventi ciascuna) è sproporzionato rispetto al resto e l'utente stesso lo ha messo per ultimo nel suo ordine di implementazione. Un ritiro forzato a shadow≥90/squalifica multi-ciclo (l'ultima riga della tabella soglie di shadow) — scartato per questa sessione, il pezzo più raro e rischioso da bilanciare, sproporzionato rispetto all'effort "piccola-media" stimato dall'utente per il resto del sistema shadow.
- **Impatto:** `src/types/career.ts` (+`Traits`/`ArchetypeId`/`ShadowFlags`, `Player`/`PlayerDelta`/`ArchivedCareer`/`DecisionCategory` estesi), `src/lib/career/traits.ts` + `traits.test.ts` (nuovi), `src/lib/career/shadow.ts` + `shadow.test.ts` (nuovi), `src/lib/career/engine.ts` (`applyDelta`/`createPlayer`), `src/lib/career/decisions.ts` (+`generateScandalDecision`/`generateRedemptionDecision`, retrofit di `generateTransferWindow`/`generateClubCrisis`/`generateControversialStatement`/`generateControversialPost`/`generateTaxTrouble`/`generateSponsorDeal`/4 eventi `LIFESTYLE_DECISIONS`, `rollNationalCallup` con moltiplicatore/ban), `src/lib/career/trophies.ts` (`rollAward` con moltiplicatore), `src/lib/career/loop.ts` (trigger scandalo forzato, redenzione nel pool narrative, bonus leadership su convocazione), `src/lib/career/storage.ts` (`STORAGE_VERSION` 5, `migratePlayerV4`, `buildArchiveEntry`), `src/lib/career/simulation.ts`/`scripts/simulate-careers.ts` (tracciamento archetipo/shadow), `PlayerCard.tsx`/`CareerSummary.tsx`/`CareerArchive.tsx` (UI). 342 test verdi (era 297), `tsc`/eslint (solo i 4 errori pre-esistenti)/`npm run build` puliti. **Non verificato manualmente nel browser** (sessione di dominio/harness, come le sessioni di bilanciamento precedenti) — vedi [[tech-debt]].

### Rename completo "Carriera" → "My Road - L'Ascesa" (repo, launcher/exe, UI)
- **Data:** 2026-08-07
- **Decisione:** su richiesta esplicita dell'utente, rinominato il progetto da "Carriera" a "**My Road - L'Ascesa**". Prima di toccare il codice, chiarite con l'utente (`AskUserQuestion`) due decisioni ad alto impatto/difficili da annullare: (1) rinominare anche il **repository GitHub** `Gioixxx/Carriera` → `Gioixxx/MyRoad` (scelto: sì, via `gh repo rename`, che lascia un redirect automatico lato GitHub — poi `git remote set-url origin` aggiornato in locale); (2) forma tecnica corta per file/cartelle/namespace senza spazi/apostrofi (scelto: **`MyRoad`**, il titolo mostrato in UI resta "My Road - L'Ascesa" per intero). Cambiati in un'unica sessione, coerenti tra loro:
  - **Repo GitHub**: `gh repo rename MyRoad`, `git remote set-url origin https://github.com/Gioixxx/MyRoad.git`.
  - **Launcher .NET**: cartella `launcher/CarrieraLauncher/` → `launcher/MyRoadLauncher/` (`git mv`), `CarrieraLauncher.csproj` → `MyRoadLauncher.csproj` (`AssemblyName` → `MyRoad`, `RootNamespace` → `MyRoadLauncher`), namespace `CarrieraLauncher` → `MyRoadLauncher` in tutti i `.cs` (`Program.cs`/`MainForm.cs`/`UpdateChecker.cs`/`UpdateInstaller.cs`/`UpdateProgressForm.cs`/`EmbeddedStaticServer.cs`), titolo finestra/dialog "Carriera" → "My Road - L'Ascesa", cartella profilo WebView2 in `%LOCALAPPDATA%` `Carriera` → `MyRoad`.
  - **Auto-updater** (`UpdateChecker.cs`/`UpdateInstaller.cs`): URL API `api.github.com/repos/Gioixxx/Carriera/releases/latest` → `.../Gioixxx/MyRoad/...`, nome asset atteso `Carriera.exe` → `MyRoad.exe`, `UserAgent` header, cartella temp di download `%TEMP%\CarrieraUpdate` → `%TEMP%\MyRoadUpdate`, file scaricato `Carriera.new.exe` → `MyRoad.new.exe`. **Punto critico**: questi valori sono hardcoded lato *client* — un'installazione precedente a questa release continuerà a interrogare il vecchio URL/asset finché non viene aggiornata manualmente almeno una volta (stesso limite già visto e documentato per il fix HTTP/2 dell'auto-updater).
  - **`scripts/build-launcher.ps1`**: path progetto, `wwwroot`, output `dist/Carriera.exe` → `dist/MyRoad.exe`.
  - **UI/package**: `package.json` `name` → `my-road`, `src/app/layout.tsx` `metadata.title` → "My Road - L'Ascesa", wordmark in `CareerGame.tsx` (kicker `text-[10px] tracking-[0.35em]` sopra l'header) → "My Road - L'Ascesa".
  - **Docs/config**: `README.md` (IT+EN, badge/link/istruzioni), `launcher/README.md`, `.gitignore` (path `/launcher/MyRoadLauncher/...`), `workspace.json` (`name`/`githubRepo`, metadata claude-libs), `CLAUDE.md` (header).
  - **Non toccato deliberatamente**: le occorrenze di "Carriera"/"carriera" nel testo di gioco in italiano (`CareerSummary.tsx` "Carriera conclusa", `shadow.ts` "Carriera controversa", `satisfaction.ts` "Carriera solida", commento in `types/career.ts`) — sono la parola italiana generica "carriera" (career), non il nome proprio del gioco, verificate una per una nel contesto prima di escluderle. La cartella locale del clone (`C:\Dev\Carriera`) **non è stata rinominata sul filesystem** — è un percorso Windows locale, fuori scope di un rename applicativo/repo.
- **Perché:** richiesta diretta dell'utente. Le due domande preliminari erano necessarie perché l'auto-updater del launcher ha **due dipendenze hardcoded** (URL dell'API GitHub e nome esatto dell'asset di release) che, se disallineate tra loro o rispetto al repo reale, avrebbero rotto silenziosamente gli aggiornamenti per chi ha già installato l'app — lo stesso genere di errore già diagnosticato e risolto più volte in questo progetto (vedi le voci HTTP/2 e retry automatico sopra). Verificato `npm test` (342 verdi), `tsc --noEmit` (pulito) e `dotnet build` sul progetto rinominato (0 errori, solo il warning preesistente MSB3277 WindowsBase/WebView2, già noto) prima di considerare il rename concluso.
- **Alternative:** lasciare il repo GitHub con il vecchio nome e rinominare solo ciò che vive nel codice — proposta come opzione all'utente, scartata: l'utente ha scelto esplicitamente di rinominare anche il repo per coerenza end-to-end.
- **Impatto:** `launcher/MyRoadLauncher/**` (rinominata da `CarrieraLauncher/`, tutti i `.cs` + `.csproj`), `scripts/build-launcher.ps1`, `package.json`, `src/app/layout.tsx`, `src/components/features/career/CareerGame.tsx`, `README.md`, `launcher/README.md`, `.gitignore`, `workspace.json`, `CLAUDE.md`, remote git `origin`, repo GitHub `Gioixxx/Carriera` → `Gioixxx/MyRoad`. **Non ancora fatto** (fuori scope di questa sessione, solo rename): nessun bump di versione, nessun nuovo tag/release, `dist/MyRoad.exe` non rigenerato — un'installazione esistente del vecchio `Carriera.exe` non riceverà l'update verso una futura release finché non se ne pubblica una con l'URL/asset name nuovi, vedi [[tech-debt]]. Il wordmark "My Road - L'Ascesa" in `CareerGame.tsx` (19 caratteri) sostituisce "Carriera" (8) nello stesso trattamento CSS molto compatto (`text-[10px] tracking-[0.35em]`) pensato per un testo corto — **non verificato visivamente**, possibile necessità di restringere il font-tracking o accorciare il testo lì, vedi [[tech-debt]].

### Offerte club: 4 invece di 3 + esclusione dei campionati emergenti per giocatori affermati
- **Data:** 2026-08-07
- **Decisione:** su segnalazione diretta dell'utente ("se ho 27 anni e 84 OVR non mi può arrivare l'offerta da una squadra nigeriana, ma magari di un team più prestigioso"), due modifiche in `src/lib/career/decisions.ts`: (1) il numero di offerte club generate sale da 3 a 4 in tutti e 5 i flussi che usano `pickClubs`/`eligibleClubs` — settore giovanile (3→4 club), finestra di mercato (2→3 club + "resta"), prestito (3→4 club), rientro da prestito (2→3 club + firma definitiva), fine ciclo (2→3 club + "ritirati"); (2) nuovo `EMERGING_MARKET_COUNTRIES` (i 12 paesi dell'espansione mondo 2026-08-06: Messico/USA/Canada/Marocco/Senegal/Nigeria/Ghana/Egitto/Costa d'Avorio/Giappone/Corea del Sud/Australia) esclusi dal pool di `eligibleClubs` quando `targetPrestige(ovr) >= 2` (cioè OVR ≥84) — restano pienamente eleggibili sotto quella soglia.
- **Perché:** `Club.prestige` (0-3) è assegnato **per paese** (ogni paese ha la sua distribuzione 3/3/2/2/1/1/0/0, vedi decisione sull'espansione mondo sopra) — è una misura di rilievo locale, non di livello globale del campionato. `eligibleClubs` prima confrontava questo valore direttamente con `targetPrestige(ovr)` su tutto il pool globale, quindi un top club nigeriano (prestige locale 3) risultava indistinguibile da un top club dei campionati "big" (Italia/Inghilterra/Spagna/ecc.) per un giocatore OVR alto — esattamente il caso segnalato dall'utente. L'esclusione scatta solo da OVR 84 in su (giocatori già affermati): sotto quella soglia (giovani/in crescita) un'offerta da questi campionati resta plausibile e non viene rimossa, per non riaprire il problema già risolto con l'espansione mondo (offerte "casuali" per nazionalità).
- **Alternative:** penalizzare il prestige di questi paesi con un malus numerico (es. `-1`/`-2`) invece di un'esclusione netta — scartato dopo aver verificato con l'aritmetica della soglia che un malus fisso o non risolveva il caso esatto segnalato (malus -1: un club nigeriano di prestige 3 resta comunque nel range per OVR 84) o richiedeva un malus abbastanza grande da equivalere di fatto a un'esclusione, con la stessa complessità ma meno leggibile. Weighting probabilistico (club emergenti ancora nel pool ma pescati più raramente) — scartato per semplicità: `pickClubs` oggi fa uno shuffle uniforme senza pesi, introdurne uno per questo solo caso avrebbe aggiunto complessità sproporzionata rispetto a un filtro diretto.
- **Impatto:** `src/lib/career/decisions.ts` (`eligibleClubs`, `EMERGING_MARKET_COUNTRIES`, le 5 chiamate a `pickClubs` nei generatori di offerta), `src/lib/career/decisions.test.ts` (aggiornata l'asserzione `toHaveLength(3)`→`toHaveLength(4)` su `generateAcademyOffer`). Verificato: 342 test verdi, `tsc --noEmit` pulito, `npm run simulate` (2000 carriere) con frequenze stabili rispetto al baseline pre-modifica (trofeo di club 93.5% vs ~91%, trofeo di nazionale 6.3% vs ~5%, convocazione 21.9% vs ~22%, award 7.0% vs ~7%, OVR di picco medio 82.0 vs ~81.9) — nessuna frequenza collassata, la modifica non altera il bilanciamento generale. `OfferPanel.tsx` non ha richiesto modifiche: la griglia è già responsive (`grid gap-3 sm:grid-cols-2 lg:grid-cols-3`), una quarta card va semplicemente a capo. **Non ancora verificato manualmente nel browser** né committato a fine di questa voce.

### Immagini reali dei trofei (club/nazionale) accanto al badge — premi individuali differenziati per tipo, invertendo la decisione 2026-08-05 di icona generica unica
- **Data:** 2026-08-08
- **Decisione:** su richiesta esplicita dell'utente ("dobbiamo mettere anche le immagini dei vari trofei sia per club che personali... se vinco la champions league vorrei vedere oltre al badge anche il trofeo vero"), due meccanismi nuovi: (1) **trofei di club/nazionale**: nuovo `src/data/competition-trophies.ts` (`COMPETITION_TROPHIES`, campo `strTrophy` di TheSportsDB — un'immagine del trofeo fisico reale, distinta dal campo `strBadge` già usato in `competition-badges.ts`) e componente `TrophyImage.tsx`, mostrato **solo in `MomentOverlay.tsx`** (l'overlay celebrativo "hai vinto"), accanto al badge già esistente — scelta esplicita dell'utente tra 3 opzioni proposte (overlay soltanto / anche liste riepilogo / anche banner esito ciclo), per non affollare le viste ricorrenti con un'immagine pensata per il momento raro e celebrativo. (2) **premi individuali**: `AwardBadge.tsx` ora richiede un `type: AwardType` e mostra un'immagine diversa per Pallone d'Oro/Player of the Season/capocannoniere (`src/data/award-images.ts`) invece dell'unica icona Twemoji generica identica per tutti e tre, decisa nella sessione 2026-08-05 — l'utente ha scelto esplicitamente "immagini reali" pur sapendo (avvisato via `AskUserQuestion`) che il rischio di marchio non è mitigato da una fonte "as is" come TheSportsDB per questo caso specifico.
- **Perché:** la sessione 2026-08-05 aveva scartato immagini reali per i premi individuali proprio per il rischio di marchio non documentato dalla fonte — qui l'utente ha accettato consapevolmente quel rischio pur di avere immagini più riconoscibili, quindi la decisione precedente non era "sbagliata" ma un trade-off diverso, ribaltato da una preferenza esplicita successiva. Due problemi scoperti **durante l'implementazione**, non prevedibili dalla sola ricerca testuale, hanno cambiato il piano rispetto all'approvazione iniziale: (a) l'immagine reale trovata per il capocannoniere ("PremierLeagueGoldenBoot.png") si è rivelata una **foto** (non un'illustrazione come descritto inizialmente) con il logo dello sponsor "Barclays" ben visibile sulla base — rischio di marchio concreto e diverso da quanto comunicato in fase di approvazione, quindi ri-sottoposto all'utente con screenshot prima di procedere; scartata a favore di una medaglia d'oro Twemoji generica. (b) l'icona "Golden trophy.svg" trovata per "player-of-the-season" (nessun trofeo reale unico esiste per questo premio generico) riproduceva chiaramente la sagoma della Coppa del Mondo (spirale dorata + base verde) — fuorviante dato che il vero trofeo Mondiale è già mostrato altrove nell'app tramite `COMPETITION_TROPHIES`; scartata a favore della coppa Twemoji generica già in uso prima di questa sessione. Il Pallone d'Oro invece usa un'illustrazione dettagliata reale (`Icone_ballon_d'or.svg`, CC BY-SA 4.0, già usata pubblicamente su Wikipedia in molte lingue per lo stesso scopo) — nessun problema equivalente trovato.
- **Alternative:** icone generiche differenziate ma non reali (es. scarpa/pallone stilizzati senza dettaglio) per tutti e 3 i premi — proposta come opzione raccomandata, scartata dall'utente a favore di immagini reali dove possibile. Vedi sopra per le 2 alternative scartate durante l'implementazione (foto Golden Boot con logo, icona Coppa-del-Mondo-lookalike).
- **Impatto:** `src/data/competition-trophies.ts` + test (nuovo, copre 33 competizioni: le stesse di `COMPETITION_BADGES` meno `TROPHY_KNOWN_GAP` — 3 leghe minori africane senza `strTrophy` su TheSportsDB oltre ai gap già noti dai badge), `src/data/award-images.ts` + test (nuovo), `src/components/features/career/TrophyImage.tsx` (nuovo, stesso pattern `onError` di `CompetitionBadge` ma senza fallback icona — il badge accanto copre già il caso "nessuna immagine"), `AwardBadge.tsx` (+ prop `type`, 4 call site aggiornati in `CareerGame.tsx`/`CareerSummary.tsx`×2/`MomentOverlay.tsx`), `MomentOverlay.tsx` (dialog ingrandito `max-w-sm`→`max-w-md` e tutte le dimensioni delle immagini/icone aumentate di conseguenza, per ospitare badge+trofeo affiancati senza sembrare cramped — richiesta esplicita dell'utente dopo aver visto la prima versione). `README.md` (nuova sezione "Crediti immagini", bilingue, con licenze e attribuzioni di ogni fonte). 356 test (era 342), `tsc` pulito. Ricerca condotta con 3 agenti paralleli per gruppo di competizioni (stesso pattern già usato per l'espansione mondo del 2026-08-06), ogni URL verificato con una richiesta HTTP diretta prima di committarlo — un agente si è bloccato a lungo su un rate limit temporaneo di TheSportsDB (Cloudflare "1015"/HTTP 429) ed è stato riavviato con istruzioni di spaziare le chiamate, risolvendo il problema. **Verificato nel browser**: overlay traguardo OVR con le nuove dimensioni (dialog+icone ingranditi) su una carriera di test; **non verificato dal vivo con un vero evento di vittoria trofeo/premio** (RNG-gated, un tentativo di forzare l'evento via localStorage non ha riprodotto l'overlay in modo affidabile) — vedi [[tech-debt]].

### Storico della carriera spostato in colonna a destra durante la partita, corpo pagina allargato
- **Data:** 2026-08-08
- **Decisione:** su richiesta diretta dell'utente, `CareerTable` ("Storico") non è più impilato sotto il pannello decisioni ma è una terza colonna a destra nella griglia di `CareerGame.tsx` (`PlayerCard | contenuto | Storico`, da `lg:` in su — sotto `lg:` resta impilato come prima). Nuovo prop `compact?: boolean` su `CareerTable.tsx` forza sempre il layout a lista già esistente per mobile (niente tabella a 6 colonne, troppo larga per una colonna di 16-18rem) indipendentemente dal breakpoint. Il contenitore radice di ogni step (`CareerGame.tsx`) è stato allargato (`max-w-6xl`→`max-w-[88rem]` in partita/riepilogo, `max-w-5xl`→`max-w-6xl` in creazione personaggio, `max-w-3xl`→`max-w-4xl` nel resto) su richiesta esplicita dell'utente ("allarga tutto il body della pagina") dopo aver visto che la nuova colonna Storico rendeva il layout a 3 colonne cramped nel vecchio contenitore.
- **Perché:** preferenza di layout dell'utente, nessun trade-off tecnico rilevante da preservare — il pattern `compact` replica esattamente quello già usato per `PlayerCard` nello stesso file.
- **Impatto:** `src/components/features/career/CareerTable.tsx` (+prop `compact`), `src/components/features/career/CareerGame.tsx` (griglia a 3 colonne, container più largo). Verificato nel browser: storico leggibile in colonna stretta con più righe, layout generale meno cramped su una viewport di 1568px.

### `npm run build` rotto da Turbopack che segue il symlink `.claude/libs` fuori dalla repo — escluso con `@source not`
- **Data:** 2026-08-09
- **Decisione:** durante il rilascio v0.6.0, `npm run build` (invocato da `scripts/build-launcher.ps1` per rigenerare `dist/MyRoad.exe`) falliva con un panic Turbopack (`TurbopackInternalError: Failed to write app endpoint /page`, causa: `FileSystemPath("").join("../../Users/Gioix/.claude/claude-libs") leaves the filesystem root`). Causa: `.claude/libs` nel repo è un symlink tracciato da git verso `~/.claude/claude-libs` (fuori dalla repo, vedi `CLAUDE.md`/librerie globali) e **non è in `.gitignore`** — la scansione automatica dei source di Tailwind v4 lo attraversa, Turbopack prova a calcolare un path relativo verso una posizione fuori dalla root del filesystem del progetto e va in panic invece di un errore gestito. Fix: aggiunta la riga `@source not "../../.claude";` subito dopo `@import "tailwindcss";` in `src/app/globals.css`, che esclude esplicitamente l'intera cartella `.claude` (non solo `libs`) dalla scansione automatica dei source.
- **Perché:** `@source not` è il meccanismo nativo di Tailwind v4 (4.3.3 installata) per escludere path dalla content-detection automatica, più mirato di aggiungere `.claude/libs` a `.gitignore` (che avrebbe risolto solo se la content-detection di Tailwind si basa davvero sul gitignore per path già tracciati — non verificato, e comunque avrebbe lasciato `.claude` come possibile fonte di problemi futuri per qualunque altro file/symlink aggiunto lì). Nessuna modifica a `.claude/libs` stesso (resta un symlink tracciato, invariato) — il fix vive interamente nel CSS applicativo.
- **Alternative:** rimuovere `.claude/libs` da git tracking o convertirlo in un path reale — scartato, romperebbe l'installazione dichiarativa delle librerie globali (`install.ps1`/`reconcile.ps1`, vedi `.claude/libs/CLAUDE.md`) per chiunque altro clonasse la repo. `.gitignore` invece di `@source not` — non provato, `@source not` risolve il problema alla radice (Tailwind) indipendentemente da come Turbopack tratti il gitignore.
- **Impatto:** `src/app/globals.css` (+1 riga). Nessun impatto visivo/funzionale sul CSS generato (la cartella `.claude` non contiene classi Tailwind da rilevare). Probabile regressione recente legata a una versione di Next.js/Turbopack più aggressiva nel seguire symlink durante la scansione dei source — non era un problema nelle build precedenti (v0.5.x e prima). Verificato: `npm run build` e `scripts/build-launcher.ps1` completano puliti dopo il fix, 356 test invariati, `tsc --noEmit` pulito.

### Release v0.6.0 pubblicata
- **Data:** 2026-08-09
- **Decisione:** bump `package.json`/`package-lock.json` 0.5.1→0.6.0 (minor, coerente col criterio già usato per bundle di feature — qui persistenza ultima identità + immagini reali trofei/premi + layout storico/corpo pagina, tutti già sviluppati e committati l'8/8 ma non ancora rilasciati). `dist/MyRoad.exe` rigenerato via `scripts/build-launcher.ps1` (FileVersion 0.6.0.0 verificata) dopo il fix Turbopack sopra, e allegato alla [release GitHub v0.6.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.6.0) con note che ripetono l'avviso già dato in v0.5.0/v0.5.1 per chi ha ancora il vecchio `Carriera.exe`.
- **Perché:** richiesta esplicita dell'utente ("rilascia nuova versione"); 3 commit feature (43d892a, 3ab2020, 1c865ab) erano già in `main` ma mai taggati/pubblicati come release.
- **Impatto:** `package.json`, `package-lock.json`, tag `v0.6.0`, release GitHub v0.6.0. 356 test verdi, `tsc` pulito prima del tag.

### Packaging Android via Capacitor, non un wrapper WebView nativo scritto a mano
- **Data:** 2026-08-10
- **Decisione:** su richiesta esplicita dell'utente ("possiamo creare un apk?"), scelto **Capacitor** (`@capacitor/core`/`cli`/`android`) per wrappare l'export statico Next.js (`out/`, già esistente per il launcher desktop) in un progetto Android nativo con WebView — stesso principio del launcher `.NET`/WebView2, ma senza dover scrivere a mano l'host/server locale/gestione finestra come fatto per il desktop. `capacitor.config.ts` (`appId: com.gioixxx.myroad`, `webDir: "out"`), progetto nativo scaffoldato in `android/` via `npx cap add android`. Toolchain verificata già presente sulla macchina (Android Studio con JDK bundled in `jbr/`, SDK con platform 36/build-tools 36.0.0) — build `assembleDebug` riuscita al primo tentativo dopo aver settato `JAVA_HOME`/`ANDROID_HOME` e creato `android/local.properties`.
- **Icona coerente con l'exe**: estratto il frame 256×256 dalla stessa `launcher/MyRoadLauncher/assets/app.ico` usata per il desktop (parsing diretto dell'header ICO per estrarre il blocco PNG embedded, dato che `System.Drawing.Icon` in PowerShell non prendeva la risoluzione più alta), upscalato a 1024×1024 come sorgente per `@capacitor/assets generate --android` → adaptive icon + icona legacy generate in tutte le densità (`mdpi`→`xxxhdpi`). Verificato visivamente che lo sfondo bianco di default dell'adaptive icon non è mai visibile (l'artwork del launcher riempie l'intero quadrato in modo opaco).
- **Verificato end-to-end su dispositivo reale**: tablet Android collegato via USB (debug ADB), non emulatore — build `assembleDebug` → `adb install` → `adb shell am start`, poi un giro di playtest via `adb shell input tap`/`input text` (coordinate calcolate a mano da screenshot `adb shell screencap`, non uno strumento di automazione UI dedicato) attraverso l'intero flusso: menu → scelta ritmo → creazione identità (digitazione cognome, dropdown nazionalità con ricerca, validazione campo obbligatorio) → offerta settore giovanile (crest reali) → overlay traguardo OVR → banner esito ciclo con record → offerta di prestito (club dei mercati emergenti con bandiere). Confermate leggibili anche le label "kicker" corrette nella sessione precedente (vedi voce sopra sui font piccoli).
- **Perché:** l'export statico è già pronto (nessuna modifica al codice applicativo necessaria), e Capacitor è lo standard de facto per questo esatto caso d'uso (bundlare un'app web statica client-only, senza backend, in un contenitore nativo) — molto meno codice custom rispetto a scrivere un `WebView`/`Activity` Android a mano nello stesso modo in cui è stato scritto il launcher desktop in C#. La build `assembleDebug` (non firmata) è sufficiente per l'obiettivo immediato dell'utente (test su un proprio dispositivo via sideload), rimandando la firma per una release distribuibile.
- **Alternative:** TWA/Bubblewrap — scartata, richiede hosting pubblico live del sito con Digital Asset Links verificati sul dominio, che il progetto non ha (distribuzione solo via GitHub Release, mai stato live su un dominio pubblico); wrapper Android nativo scritto a mano (Kotlin/Java + WebView, mirror esatto del launcher .NET) — scartato, effort sproporzionato quando Capacitor risolve lo stesso identico problema con un tool maturo e mantenuto.
- **Impatto:** `capacitor.config.ts` (nuovo), `android/` (nuovo, progetto nativo — build artifacts `app/src/main/assets/public`/`capacitor.config.json` esclusi dal tracking dal `.gitignore` di Capacitor stesso, stesso pattern già in uso per `dist/*.exe`), `resources/icon.png` (nuovo, sorgente per rigenerare le icone con `npx capacitor-assets generate --android`), `package.json`/`package-lock.json` (+`@capacitor/core`/`cli`/`android`, +`@capacitor/assets` in dev). **Non ancora deciso**: build release firmata + canale di distribuzione (GitHub Release come l'exe?), comportamento del bottone "Chiudi" del menu su Android (probabile no-op, non ancora verificato — stesso tipo di gap già noto per il caso desktop pre-fix) — vedi [[tech-debt]] e [[backlog]].

### Potenziale dinamico + attributi granulari + PlayStyles — 3 delle 6 meccaniche proposte, scouting/staff/sharpness escluse
- **Data:** 2026-08-10
- **Decisione:** l'utente ha proposto 6 meccaniche ispirate a un gestionale (Potenziale Dinamico,
  Piani di Sviluppo/Cambio Ruolo, Visione Tattica/Staff Tecnico, Rete Scouting/Vivaio, PlayStyles,
  Match Sharpness). Ricognizione del codice: 2 di queste (Staff Tecnico, Scouting) presuppongono
  la gestione di un'intera rosa/club (altri giocatori come entità, budget societario) — inesistenti
  nel gioco, che segue **un solo calciatore**. Interpellato esplicitamente (`AskUserQuestion`, 3
  domande), l'utente ha scelto: (1) escludere Scouting+Staff da questo piano (backlog), (2) per
  Piani di Sviluppo/PlayStyles la profondità "pesante" — attributi granulari separati invece di
  bonus a formule esistenti sul solo OVR, pur sapendo che tocca più file del motore, (3) escludere
  Match Sharpness (il gioco procede a cicli di 1-3 stagioni, non a giorni — granularità incompatibile).
  Implementate quindi 3 macro-feature in 3 fasi indipendenti e shippabili singolarmente (ognuna col
  proprio bump `STORAGE_VERSION`, v5→v8):
  1. **Potenziale dinamico** (`lib/career/potential.ts`): `Player.potential` (tetto OVR
     individuale 30-99, sostituisce il fisso 99 uguale per tutti) rollato a fasce pesate alla
     creazione, cresce nei cicli "breakout" (≥2 segnali su 3: obiettivo raggiunto, titolo di
     stagione alto, record infranto — tutti dati già calcolati in `resolveCycle`, nessun nuovo
     dato introdotto) e solo sotto i 27 anni.
  2. **Attributi granulari + focus di allenamento + cambio ruolo funzionale**
     (`lib/career/attributes.ts`): 5 attributi outfield (velocità/tiro/passaggio/difesa/fisico) o
     4 da portiere (riflessi/presa/rinvio/piazzamento), pesati per ruolo (`OUTFIELD_ROLE_ATTRIBUTE_WEIGHTS`,
     stesso stile di `ROLE_WEIGHTS` in `progression.ts`). Nuova categoria `"training-focus"`
     (6/5 opzioni: un attributo a scelta o "bilanciato"). Cambio ruolo funzionale estende
     `"position-change"` (prima puramente cosmetica, solo -2 OVR testuale, mai toccava
     `player.position`): mappa di adiacenza hand-authored (`POSITION_CHANGE_ADJACENCY`, mai
     GK↔outfield), gli attributi **non vengono rimappati** — restano gli stessi numeri e si
     ripesano da soli sul nuovo ruolo.
  3. **PlayStyles** (`lib/career/playstyles.ts`): 6 tratti sbloccabili per soglia attributo
     (curler/playmaker/sprinter/brickwall/targetman/catlike), bonus concreti su formule esistenti
     (proiezione gol/assist, infortuni, trofeo di club, callup) — **nome deliberatamente diverso
     da `Traits`** (il tipo esistente per personalità/archetipo — Bandiera/Mercenario/ecc. —,
     concetto completamente diverso, collisione da evitare).
- **Vincolo di design trasversale rispettato**: `player.ovr` resta l'unico campo su cui agiscono
  direttamente le decine di outcome narrativi esistenti (`ovrDelta` in `decisions.ts`) — mai
  riscritti. Gli attributi influenzano l'OVR solo in `advanceSeasons`, con un termine di "pull"
  bounded per ciclo verso la media pesata degli attributi (mai abbastanza da sovrastare la curva
  età-based già calibrata o cancellare un `ovrDelta` narrativo appena applicato).
- **Bug trovato e corretto con `npm run simulate`** (stesso principio già consolidato nel
  progetto — mai fissare formule "a tavolino"): la prima versione di `distributeAttributeGrowth`
  distribuiva il budget di crescita proporzionalmente ai pesi di ruolo (`share_i = weight_i`), ma
  la riaggregazione pesata in `deriveOvrFromAttributes` (che usa **gli stessi pesi**) non
  preserva la crescita totale — `sum(weight_i · share_i) = sum(weight_i²) < 1` (i pesi sono
  frazioni). L'OVR derivato dagli attributi cresceva quindi molto più lento dell'OVR age-based,
  il termine di pull diventava negativo e saturato ad ogni ciclo, e l'OVR di picco medio è
  crollato da ~82 a 64 (97% delle carriere sotto 70) nel primo giro di `npm run simulate`.
  Corretto normalizzando le quote in modo che la riaggregazione pesata dia per costruzione
  esattamente il budget atteso: `share_i = boosted_i / Σ(weight_j · boosted_j)` — proprietà
  garantita algebricamente indipendentemente dal focus di allenamento applicato, coperta da test
  dedicato in `attributes.test.ts` (invariante anti-regressione). Dopo il fix, le frequenze sono
  tornate in linea con la baseline pre-esistente (OVR di picco medio 82.8, trofeo club ~94-96%,
  convocazione ~25-28%, trofeo nazionale ~4-5%).
- **Effetto collaterale scoperto durante la diagnosi**: `simulation.ts::simulateCareer` non
  passava il proprio `rng` a `createPlayer`, quindi il test smoke seedato (`simulation.test.ts`,
  mulberry32 seed 42) non era in realtà completamente deterministico — il `potential` iniziale
  veniva rollato con `Math.random()` reale anche dentro il test "a seed fisso". Corretto passando
  `rng` esplicitamente; bug pre-esistente scoperto per caso durante la Fase 2, non introdotto da
  questa sessione.
- **Verificato**: 384 test (era 356), `tsc`/`npm run build`/lint puliti (solo i 4 warning
  `react-hooks/set-state-in-effect` pre-esistenti, invariati). Playtest completo nel browser
  (dopo un riavvio del dev server necessario — la sessione precedente aveva una CSS bundle
  incompleta/stale con classi `sm:*` mancanti, causa ignota, risolta da un semplice restart):
  badge potenziale, pannello attributi con barre, decisione "Piano di allenamento" (focus
  specifico + bilanciato), chip "Focus: X", sblocco PlayStyle "Regista" con overlay dedicato e
  chip sul cartellino, declino età-based degli attributi da veterano (37 anni) — tutti osservati
  funzionanti in una singola carriera reale. **Non osservato dal vivo in questo giro**: la
  decisione di cambio ruolo funzionale (categoria `"position-change"`, peso base 8 su ~13
  categorie, non innescata nella carriera di playtest) — vedi [[tech-debt]].
- **Alternative**: vedi le 3 domande poste all'utente sopra — profondità "leggera" per Piani di
  Sviluppo/PlayStyles (bonus diretti a formule esistenti, niente nuovi attributi) scartata
  esplicitamente dall'utente a favore della profondità pesante.
- **Impatto**: `src/types/career.ts` (+`Attributes`/`AttributeKey`/`PlayStyleId`, +campi
  `Player.potential`/`attributes`/`trainingFocus`/`playStyles`, +`DecisionCategory` `"training-focus"`,
  +`DecisionOption.trainingFocus`/`newPosition`), 3 nuovi moduli dominio (`potential.ts`,
  `attributes.ts`, `playstyles.ts`) + test dedicati, `engine.ts` (`createPlayer`/`applyDelta`/
  `advanceSeasons` + nuovo `changePosition`), `loop.ts` (`processInjuries`, `resolveCycle`, nuovi
  case categoria), `decisions.ts` (2 nuovi generatori, rimossa l'entry statica cosmetica
  `position-change`), `progression.ts` (`projectOvr`+`potential`, nuova `sumOvrDeltaForAge`,
  parametro `playStyles` sulle funzioni di proiezione stats), `injuries.ts`/`trophies.ts`
  (parametri opzionali per i bonus PlayStyle), `storage.ts` (3 nuovi migratori a cascata,
  `STORAGE_VERSION` 5→8), UI (`AttributesPanel.tsx` nuovo, `PlayerCard.tsx`/`CareerSummary.tsx`/
  `MomentOverlay.tsx` per i nuovi chip/overlay), `scripts/simulate-careers.ts` (nuove sezioni di
  report per potenziale e distribuzione PlayStyle). `eslint.config.mjs` (+`android/**` negli
  ignore — gap pre-esistente scoperto ed esteso durante questa sessione, non correlato alle 3
  feature ma corretto perché notato lungo il percorso).

### Bilanciamento su 7 fasi per rigiocabilità/divertimento: bug del loop prestiti, Shadow/scandalo, trofeo di club, PlayStyle, archetipo
- **Data:** 2026-08-10
- **Decisione:** su richiesta esplicita dell'utente ("bilanciare tutte le meccaniche... se reputi
  che convenga fare cambiamenti fammi sapere"), audit completo (3 agenti Explore paralleli sulle
  costanti numeriche attuali + un run fresco di `npm run simulate`, dato che Potenziale/Attributi/
  PlayStyles erano stati aggiunti la stessa giornata e il loro effetto sulle altre frequenze non
  era ancora stato misurato). L'audit ha trovato un **bug strutturale**, non solo uno
  sbilanciamento: nel flusso di prestito, `nextLoopContext` (loop.ts) azzerava `loanParentClub`
  solo scegliendo `sign-permanent` durante un evento `loan-return` — qualunque altra opzione ("vai
  in prestito altrove", 3 offerte su 4 opzioni tipiche) lasciava il contesto invariato, e
  `availableCategories` forza `loan-return` su ogni ciclo finché `loanParentClub` è valorizzato:
  un giocatore restava quindi intrappolato a scegliere destinazioni di prestito per una media
  geometrica di ~4 cicli consecutivi (25% di probabilità per ciclo di uscirne sotto scelta
  uniforme). Da solo, `loan`+`loan-return` consumavano **~29% di tutti i cicli simulati**. Piano
  approvato dall'utente (3 domande mirate: sì a rendere Shadow/scandalo raggiungibile per chi
  rischia, sì a ridurre il trofeo di club — già notato in passato e lasciato fuori scope — sì a
  un unico piano coordinato per tutto), eseguito in 8 fasi (0-7), ognuna verificata con
  `npm test`/`tsc --noEmit`/`npm run simulate` prima di passare alla successiva:
  1. **Fase 0 — infrastruttura harness**: `simulation.ts` già esponeva `pickOption` iniettabile
     (mai usato oltre `pickUniformOption` di default) — aggiunti `pickExtremeOption`/
     `pickRiskSeekingOption`/`makeTrainingFocusPicker`/`makeTraitDirectedPicker`, tutti opzionali
     e non usati dal test a seed fisso esistente (`simulation.test.ts` resta invariato).
     `scripts/simulate-careers.ts` esteso con blocchi diretti (batch più piccoli, 400-800
     carriere) per misurare la raggiungibilità REALE per un giocatore che persegue deliberatamente
     una direzione, non solo il pavimento pessimistico della scelta uniforme casuale.
  2. **Fase 1 — fix del loop prestiti**: nuovo `LoopContext.loanReturnBounces` +
     `MAX_LOAN_RETURN_BOUNCES=1` — dopo un primo rimbalzo, il prossimo `loan-return` si risolve
     comunque (il club che ospita il prestito lo trattiene), indipendentemente dall'opzione
     scelta. `loan-return` sceso da 21.4% a ~12.6% dei cicli totali, `loan`+`loan-return`
     complessivo da ~29% a ~21%. **Trade-off noto, non corretto in questo giro**: al secondo
     rimbalzo consecutivo la narrazione dice ancora "vai in prestito altrove" ma la registrazione
     diventa di fatto definitiva — rifinitura opzionale futura (far sapere a `generateLoanReturn`
     quanti rimbalzi sono già avvenuti e togliere le opzioni "vai altrove" al tetto).
  2b. **Fase 4 — trofeo di club**: `CLUB_TROPHY_PRESTIGE_WEIGHT` 0.08→0.03, `CLUB_TROPHY_OVR_DIVISOR`
     200→350, `CLUB_TROPHY_OVR_BONUS_CAP` 0.15→0.08, `CLUB_TROPHY_CHANCE_CAP` 0.5→0.3 —
     "almeno 1 trofeo di club" da 94.8% a 84.4% (target utente 75-85%). Un primo taglio moderato
     (solo `PRESTIGE_WEIGHT` 0.08→0.06) aveva mosso il tasso di appena un punto (94.8%→93.7%):
     dato che il trofeo si estrae **due volte per ciclo** (campionato + coppa nazionale al 70%
     della chance del campionato) su ~11 cicli/carriera, serviva un taglio molto più aggressivo di
     quanto l'intuizione suggerisse — altro promemoria diretto del principio "mai tarare a
     tavolino" già consolidato nel progetto. **Effetto collaterale documentato, non corretto**: la
     promozione di campionato (`club-progression.ts`) scatta solo vincendo il titolo, quindi cala
     proporzionalmente — nuova metrica `promotionCount`/`relegationCount` aggiunta a
     `SimulatedCareerResult`/`scripts/simulate-careers.ts` (0.17/0.25 per carriera osservato, non
     collassata a zero).
  3. **Fase 3 — Shadow/scandalo raggiungibile**: 6+ giri di iterazione con l'harness (non riusciti
     al primo/secondo/terzo tentativo) hanno rivelato un vincolo strutturale analogo a quello del
     trofeo: sotto scelta uniforme un giocatore incontra solo ~1 scelta "shadow-rilevante" per
     carriera (club-crisis/lifestyle/narrative sono categorie già rare, e solo una minoranza dei
     loro sotto-generatori tocca lo shadow), quindi alzare le magnitudini o abbassare
     `SHADOW_SCANDAL_THRESHOLD` sposta **entrambe** le popolazioni (scelta pulita vs rischiosa)
     quasi proporzionalmente — il rapporto di separazione osservato satura empiricamente attorno a
     ~2.5-3x, non l'obiettivo indicativo iniziale di "raggiungibile ≥60% per chi rischia". Scoperta
     rilevante durante l'iterazione: `controversial-statement`/`controversial-post` alzano lo
     shadow su **entrambe** le opzioni (nessuna scelta "sicura") — un contributo di base uguale per
     scelta uniforme e diretta che comprime il rapporto di separazione invece di allargarlo;
     riportato a un valore modesto (6, era stato temporaneamente alzato a 8/12 durante
     l'iterazione) mentre gli eventi con una vera alternativa sicura (`mysterious-substance`,
     `tax-trouble`, `honesty-test use-it`, `club-crisis leave`) hanno assorbito l'aumento
     principale. Configurazione finale: `SHADOW_SCANDAL_THRESHOLD` 50→28, `SHADOW_REDEMPTION_THRESHOLD`
     30→18, magnitudini rischiose circa raddoppiate (es. `mysterious-substance` take 15/25→26/40,
     `tax-trouble` stay 12→21). Risultato: scandalo "almeno 1" da 0% a ~7-8% sotto scelta uniforme
     (dentro la fascia 5-15% concordata), ~20% sotto un picker che massimizza sempre lo shadow —
     un miglioramento reale (da meccanica completamente morta a chiaramente più raggiungibile per
     chi rischia) ma sotto l'obiettivo indicativo iniziale, per lo stesso vincolo strutturale di
     frequenza di tocco — vedi [[tech-debt]].
  4. **Fase 5 — soglie PlayStyle per stile**: `PLAY_STYLE_THRESHOLD` piatta (82, tutti e 6 gli
     stili) sostituita da soglie nominate per stile (`playstyles.ts`) — causa dello sbilanciamento
     (sprinter 1.1% vs playmaker 46.7% sotto scelta uniforme) è che la quota di crescita per
     attributo in `distributeAttributeGrowth` dipende dal peso di ruolo, quindi un attributo con
     peso basso nella maggior parte dei ruoli (velocità, alta solo su ali/terzini) cresce molto più
     lentamente anche col focus di allenamento — **non toccata** la formula di crescita
     (invariante di conservazione del budget già testato in una sessione precedente). Soglie:
     `SPRINTER_THRESHOLD=68`, `TARGETMAN_THRESHOLD=74` (erano 82), `PLAYMAKER_THRESHOLD=86` (era
     82, il più facile da raggiungere), `CURLER`/`BRICKWALL`/`CATLIKE_THRESHOLD` invariati a 82.
     Risultato sotto scelta uniforme: sprinter 1.1%→43.8%, targetman 7-8%→39.9%; sotto focus di
     allenamento diretto (nuovo blocco harness, un ruolo plausibile per stile: ala per velocità,
     ST per tiro/fisico, CAM per passaggio, CB per difesa, GK per riflessi) tutti e 6 gli stili
     ≥73% (la maggior parte vicino al 100%) — unica fase del piano che ha superato l'obiettivo
     indicativo (≥50-60%) al primo giro di taratura.
  5. **Fase 6 — archetipo raggiungibile**: stesso vincolo strutturale di frequenza-di-tocco della
     Fase 3. Alzate le magnitudini che alimentano `leader` (club-crisis stay-and-fight leadership
     5→9, honesty-test report-it leadership 3→7/discipline 4→5) e `pro` (discipline sulle opzioni
     "rifiuta" 4/6→5/7, training-focus 1→2 discipline piatto). **Errore scoperto e corretto in
     corsa**: un primo tentativo aveva alzato anche `NATIONAL_CALLUP_LEADERSHIP_BONUS` da 6 a 8 —
     dato che la convocazione in nazionale è un evento automatico (non una scelta, quindi
     identico sotto qualunque picker) e parte da un `leadership` neutro di 50, +8 portava
     ESATTAMENTE a 58 (`ARCHETYPE_DOMINANT_THRESHOLD`), rendendo "leader" quasi garantito per
     chiunque venisse convocato (~25-27% delle carriere) — misurato con l'harness: "leader" era
     schizzato al 29.4% sotto scelta uniforme (da ~3-4%) e "nessuno" crollato da 81% a 42.9%, uno
     sbilanciamento molto più ampio di quanto inteso. Riportato a 6 (invariato). Risultato finale:
     "nessuno" 81.2%→63.6% (resta la maggioranza relativa netta, come da obiettivo), tutti e 6 gli
     archetipi non nulli (era `problem` 0.0%), nessuno dominante; sotto scelte dirette per tratto
     (nuovo blocco harness, `pickExtremeOption` per vettore, combo ambition-max/loyalty-min per
     mercenary) separazione reale ma modesta (13-22% diretto contro 1-9% uniforme, ~2-20x a
     seconda dell'archetipo) — sotto l'obiettivo indicativo iniziale (≥60-70%) per lo stesso
     vincolo di frequenza di tocco della Fase 3, vedi [[tech-debt]].
  6. **Fase 7 — pesi categoria + pulizia**: rimisurate tutte le frequenze di categoria dopo il fix
     del prestito — nessuno scarto attuale-vs-nominale è risultato ingiustificabile (lifestyle/
     narrative/sponsor/training-focus/club-crisis sotto il nominale per eleggibilità dei
     sotto-generatori, già atteso; loan-return sopra per il rimbalzo della Fase 1, già accettato)
     — **nessun peso di `BASE_CATEGORY_WEIGHTS` modificato**, solo risolti i commenti "provvisorio,
     da confermare" nel codice con i dati osservati. Rimossa `"callup"` dall'union
     `DecisionCategory` (`types/career.ts`) — confermato morto (non in `availableCategories`, non
     gestito nello switch di `pickNextDecision`, non nei pesi); le altre occorrenze della stringa
     `"callup"` nel codebase (`CycleObjectiveKind`, `MomentOverlay.tsx`) sono union type non
     correlate, verificato via grep prima e dopo la rimozione.
- **Perché:** stesso principio già consolidato nel progetto ("harness prima, poi ritara", vedi le
  precedenti sessioni di ricalibrazione OVR/traits/shadow) applicato qui su scala più ampia (7
  meccaniche in un'unica sessione coordinata) — ogni fase verificata con `npm run simulate`
  prima/dopo, mai un numero scelto "a tavolino". La scoperta più importante non era prevista
  all'inizio della sessione: un vincolo strutturale di **frequenza di tocco** (quante volte per
  carriera un giocatore incontra davvero una scelta rilevante per una data meccanica) limita il
  rapporto di separazione raggiungibile tra "scelta pulita" e "scelta diretta/rischiosa" a circa
  2.5-3x per Shadow/scandalo e archetipi, indipendentemente da quanto si alzino le magnitudini o
  si abbassino le soglie — alzarle ulteriormente sposta entrambe le popolazioni insieme invece di
  allargare il divario. Rompere questo vincolo richiederebbe alzare la *frequenza* con cui le
  categorie/sotto-generatori rilevanti compaiono (dominio della Fase 7, esplicitamente
  posticipata a dopo tutte le altre misure per non confondere le cause) — non affrontato in questa
  sessione, registrato come tech-debt per una sessione futura mirata.
- **Alternative:** alzare i pesi di categoria (`club-crisis`/`lifestyle`/`narrative`) già in questa
  sessione per rompere il vincolo di frequenza-di-tocco — scartato: la Fase 7 doveva restare
  l'ultima e informata da tutte le altre misure per non confondere gli effetti, e il piano
  approvato dall'utente non prevedeva di alzare la frequenza complessiva di questi eventi (solo di
  ritararne peso relativo se necessario, cosa che i dati finali non hanno richiesto).
- **Impatto:** `src/lib/career/loop.ts` (`loanReturnBounces`, `NATIONAL_CALLUP_LEADERSHIP_BONUS`),
  `src/lib/career/decisions.ts` (magnitudini shadow/traits, commenti pesi categoria),
  `src/lib/career/shadow.ts` (soglie), `src/lib/career/trophies.ts` (costanti trofeo club),
  `src/lib/career/playstyles.ts` (soglie per stile), `src/lib/career/simulation.ts` (picker
  diretti, `promotionCount`/`relegationCount`), `scripts/simulate-careers.ts` (4 nuovi blocchi di
  misura diretta), `src/types/career.ts` (rimozione `"callup"`), `src/lib/career/loop.test.ts`/
  `decisions.test.ts`/`shadow.test.ts` (asserzioni aggiornate ai nuovi valori). 386 test (era 384),
  `tsc --noEmit`/`npm run lint` puliti (solo i 4 warning `react-hooks/set-state-in-effect`
  pre-esistenti, invariati). **Non verificato manualmente nel browser** in questa sessione
  (bilanciamento numerico puro, stesso standard già usato per le sessioni di ricalibrazione
  precedenti — verificato via test + harness) — vedi [[tech-debt]]. **Effetto collaterale
  osservato, non nel piano originale**: la convocazione in nazionale è salita da ~25% a ~37% —
  causa probabile è che `targetman` (bonus additivo +0.08 alla chance di convocazione) è ora
  sbloccato dal ~40% dei giocatori invece dell'8% grazie alla Fase 5, un effetto a cascata
  legittimo ma non esplicitamente richiesto — vedi [[tech-debt]] per la decisione se ritararlo.

### GitHub Pages come nuovo canale live pubblico — ribalta la precedente scelta "mai online"
- **Data:** 2026-08-11
- **Decisione:** su richiesta esplicita dell'utente ("GitHub Pages deve essere funzionante"),
  attivato il deploy automatico su `https://gioixxx.github.io/MyRoad/` — project page di default
  (scelta esplicita dell'utente tra project page vs dominio personalizzato). Nuovo workflow
  `.github/workflows/deploy-pages.yml` (`actions/checkout`→`npm ci`→`npm test`→`npm run build`
  con `GITHUB_PAGES=true`→`configure-pages`→`upload-pages-artifact`→`deploy-pages`), triggerato
  su ogni push a `main` — il deploy fallisce (non pubblica) se i test non passano, stesso gate di
  qualità già usato per le release exe/APK. Pages abilitato via `gh api repos/.../pages -X POST
  -f build_type=workflow` (sorgente "GitHub Actions", non branch `gh-pages`).
  `next.config.ts` imposta `basePath`/`assetPrefix`/`NEXT_PUBLIC_BASE_PATH="/MyRoad"` **solo**
  quando `GITHUB_PAGES=true` è nell'ambiente di build — la build per l'exe desktop
  (`scripts/build-launcher.ps1`) e per l'APK Android (`npx cap sync`) restano root-relative come
  prima, nessuna delle due imposta quella variabile. **Bug trovato e corretto durante il primo
  giro di verifica locale** (non a posteriori sul sito pubblicato): `basePath`/`assetPrefix`
  riscrivono automaticamente solo gli asset gestiti da Next.js stesso (`_next/*`, favicon) — due
  riferimenti hardcoded a file in `public/` (audio di sottofondo in `CareerGame.tsx`, sprite
  maglia in `JerseyBadge.tsx`) restavano root-relative e avrebbero dato 404 sotto `/MyRoad/`.
  Nuovo helper `withBasePath()` in `lib/utils.ts` (prefissa con `NEXT_PUBLIC_BASE_PATH`, stringa
  vuota per le build exe/APK) usato in entrambi i punti — verificato con una build locale
  `GITHUB_PAGES=true` prima di pushare (grep sull'HTML esportato) e poi di nuovo in produzione
  dopo il deploy (HTML/JS/audio tutti 200).
- **Perché:** richiesta diretta dell'utente — ribalta esplicitamente la decisione precedente
  (2026-08-10, sessione packaging Android) di scartare TWA/Bubblewrap proprio perché "il progetto
  non ha hosting pubblico live... mai stato live su un dominio pubblico". Quella decisione non è
  più valida: da qui in poi il progetto **ha** un sito pubblico live. Rilevante se in futuro si
  torna a valutare TWA/Bubblewrap per una futura release Android firmata (vedi [[backlog]]), il
  prerequisito che mancava ora esiste.
- **Alternative:** branch `gh-pages` con build committata — scartata, il workflow "GitHub
  Actions" come sorgente evita di dover committare artefatti di build (`out/`) nella cronologia
  git, stesso principio già seguito per `dist/*.exe` (mai committato, solo allegato alle
  release). Riscrivere i 2 riferimenti hardcoded con percorsi relativi invece di un helper
  `withBasePath()` — scartata: i componenti non hanno un modo affidabile di conoscere la propria
  profondità nell'albero DOM per costruire un path relativo corretto in ogni contesto d'uso.
- **Impatto:** `.github/workflows/deploy-pages.yml` (nuovo), `next.config.ts` (basePath
  condizionale), `src/lib/utils.ts` (+`withBasePath`), `CareerGame.tsx`/`JerseyBadge.tsx` (2 call
  site). Repo pubblica dal 2026-08-05 (vedi promemoria in [[domain]]/segnalibri) — il sito ora
  online rende ancora più rilevante quel promemoria: ogni asset/scelta va valutata assumendo
  visibilità pubblica. Nessun impatto su `STORAGE_VERSION`/salvataggi. **Annotazione benigna nel
  log del workflow** da non confondere con un errore: `actions/checkout`'s post-job cleanup
  tenta un `git submodule foreach` che fallisce con "No url found for submodule path
  '.claude/libs'" — il symlink tracciato verso `~/.claude/claude-libs` (fuori dal repo, vedi
  `.claude/libs/CLAUDE.md`) viene scambiato per un submodule dal cleanup step; cosmetico, non
  blocca né build né deploy (entrambi verdi), non richiede fix.

### Ottimizzazione layout per schermi di telefono piccoli — scoperto e risolto un bug strutturale di CSS Grid mai visto prima (release v0.7.1)
- **Data:** 2026-08-11
- **Decisione:** su segnalazione diretta dell'utente ("sul tablet si vede bene, su schermi più
  piccoli non si vede bene e non si possono fare le scelte"), diagnosi e fix in più round, ognuno
  verificato su un **dispositivo Android reale** (Honor, ~360px di larghezza CSS) via debug USB +
  Chrome DevTools remoto (`chrome://inspect`-style, socket `webview_devtools_remote_<pid>`
  forwardato con `adb forward`, ispezione `getBoundingClientRect()`/`getComputedStyle()` via
  `Runtime.evaluate` su WebSocket) — non solo screenshot, per la prima volta in questo progetto
  una verifica mobile con accesso diretto al DOM/CSSOM renderizzato. Causa iniziale ipotizzata
  (meta-tag viewport mancante) **smentita** ispezionando l'`out/index.html` reale: Next.js 16 lo
  inietta già di default. 5 fix distinti, tutti nello stesso commit (c8c3f88) + release v0.7.1:
  1. **`CareerGame.tsx` — schermata di gioco non scrollabile sotto `lg:`**: il ramo `showPlayShell`
     del contenitore radice aveva `overflow-hidden` fisso su ogni breakpoint, senza il fallback
     `overflow-y-auto` già usato correttamente altrove nello stesso file (`showSummary`,
     `isIdentity`) — su telefono (sempre sotto `lg:` 1024px) i bottoni di decisione finivano fuori
     dall'area visibile/toccabile senza modo di raggiungerli. Fix: un cambio di classe.
  2. **Tap target sotto i ~44px raccomandati**: `PositionPicker.tsx` (selezione ruolo, 32×40px→
     40×48px base) e `SegmentedControl.tsx` (selezione piede, ~32px→44px alt. base).
  3. **Rendering edge-to-edge Android non gestito**: `targetSdkVersion 36` + Capacitor 8 attivano
     l'edge-to-edge di default (obbligatorio da Android 15+) — la WebView si estende dietro le
     barre di sistema, nessun padding `safe-area-inset` da nessuna parte nel codice. Fix:
     `viewport: { viewportFit: "cover" }` (Next.js Viewport export) + padding
     `env(safe-area-inset-*)` su tutti e 4 i lati del `body` in `layout.tsx`.
  4. **Scoperta principale — compressione "silenziosa" di CSS Grid con `min-h-0` incondizionato**:
     una volta reso scrollabile il contenitore di gioco (fix 1), è emerso un bug preesistente
     (mascherato fino a quel momento dal clipping totale) — le 3 colonne della griglia di gioco
     (PlayerCard | contenuto-decisione | Storico) avevano tutte `min-h-0` **non condizionato da
     `lg:`**. Sotto `lg:`, la griglia implicita a colonna singola comprime ogni riga `auto` per
     stare nel budget di altezza disponibile (quello del `Card` esterno scrollabile), distribuendo
     il deficit in base al "automatic minimum size" di ciascun item — che per un elemento con
     `min-h-0` esplicito è **zero**, non il contenuto reale, quindi la riga può essere compressa
     arbitrariamente sotto il proprio bisogno reale. Con `overflow:visible` (il caso comune) il
     contenuto in eccesso trabocca visivamente senza danno — ma la riga successiva nella griglia
     inizia comunque subito dopo il box **nominale** (compresso) della riga precedente, non dopo
     il suo contenuto **reale** traboccato: risultato, la label "Storico" si sovrapponeva
     visivamente a una card di offerta club. Stesso identico meccanismo, variante ancora più
     insidiosa, trovato in `IdentityForm.tsx`: `PositionPicker` (che ha `overflow-hidden`, non
     `visible`, per clippare lo sfondo decorativo del campo) veniva compresso al proprio
     `min-h-[12rem]` (192px, un floor esplicito **inferiore** al contenuto reale di 328px per 6
     righe di ruoli) — lì, siccome l'overflow è `hidden` non `visible`, le ultime righe (LB/CB/RB,
     GK) sparivano del tutto, non solo si sovrapponevano. Fix: `min-h-0` spostato a `lg:min-h-0` su
     tutte le righe della griglia di `CareerGame.tsx` (nessuna compressione sotto `lg:`, si affida
     interamente allo scroll del `Card` esterno) — per `PositionPicker` invece (dato che i tentativi
     di far sì che si dimensioni al contenuto reale non hanno funzionato, la causa esatta del
     "perché esattamente 192px e non di più" resta non del tutto chiarita nonostante 3 tentativi),
     soluzione pragmatica: box reso scrollabile internamente (`overflow-y-auto` sotto `lg:`,
     `lg:overflow-hidden` per il comportamento originale su schermi grandi) — scroll annidato,
     meno elegante di un unico scroll continuo ma garantito funzionante.
  5. **Musica di sottofondo non in pausa quando l'app va in background**: nessun codice mette in
     pausa l'`<audio>` quando l'app Android va in background (tasto home, cambio app, o il bottone
     "Chiudi" del menu — probabile no-op su Android, vedi [[tech-debt]]) — la musica continuava a
     suonare. Fix a due livelli: hook nativo `onPause()`/`onStop()` in `MainActivity.java`
     (`bridge.getWebView().evaluateJavascript(...)` per mettere in pausa ogni `<audio>`, garantito
     dal ciclo di vita Android indipendentemente da cosa fa il livello JS) + fallback lato web
     (`useBackgroundMusic.ts`: `document.visibilitychange`/`window.pagehide`) per il caso
     browser/exe desktop dove non esiste un ciclo di vita Android nativo.
- **Perché:** la scoperta del meccanismo di compressione CSS Grid (`min-h-0` + `automatic minimum
  size = 0` per item con overflow non-`visible`) è il pattern più importante da ricordare da questa
  sessione: **qualunque** `min-h-0` non condizionato da breakpoint, applicato a un item di
  grid/flex dentro un contenitore la cui altezza disponibile può essere inferiore al contenuto
  reale, rischia lo stesso bug — compressione silenziosa fino al floor esplicito (o a zero se non
  c'è un floor), invisibile finché qualcosa non lo rende "visibile" (uno scroll che prima non
  c'era, un contenuto più lungo, ecc.). Verificare `git grep 'min-h-0'` su qualunque nuovo
  componente di layout mobile prima di assumere che "sotto lg: si impila e basta".
- **Alternative:** per `PositionPicker`, forzare un `min-h-[20.5rem]` (valore magico che copre
  esattamente il contenuto a 6 righe) invece dello scroll interno — scartata, fragile (si rompe di
  nuovo se cambia il numero di righe/l'altezza dei bottoni, esattamente il tipo di regressione già
  causato dal fix dei tap target in questa stessa sessione).
- **Impatto:** `src/components/features/career/CareerGame.tsx`, `PositionPicker.tsx`,
  `IdentityForm.tsx`, `src/components/ui/SegmentedControl.tsx`, `src/app/layout.tsx`,
  `src/hooks/useBackgroundMusic.ts`, `android/app/src/main/java/com/gioixxx/myroad/MainActivity.java`.
  386 test invariati, `tsc`/lint puliti (solo i 4 warning pre-esistenti). Release
  [v0.7.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.7.1), `dist/MyRoad.exe` rigenerato
  (FileVersion 0.7.1.0 verificata). **Metodo di verifica nuovo per il progetto**: debug USB +
  ispezione DOM/CSSOM via Chrome DevTools Protocol invece di soli screenshot — molto più efficace
  per diagnosticare bug di layout (misura esatta di `scrollHeight`/`clientHeight`/
  `getBoundingClientRect()` invece di dedurre dal pixel) — utile ricordarlo per future sessioni di
  debug mobile invece di affidarsi solo a `adb shell screencap`. Non verificato in questa sessione:
  build APK release firmata (resta backlog aperto), comportamento esatto del bottone "Chiudi" su
  Android (tech-debt esistente, non toccato).

### Build Android firmata + controllo aggiornamenti in-app per i tester senza ADB
- **Data:** 2026-08-11
- **Decisione:** l'utente ha chiarito che il cavo/ADB resta il suo flusso personale per il debug
  pre-release, ma per i tester terzi (senza ADB) l'app deve aggiornarsi "in automatico". Chiariti
  con l'utente (`AskUserQuestion`) due punti prima di implementare: dove conservare la chiave di
  firma (scelto: locale sul PC, fuori dal repo — non su un servizio cloud/CI) e il livello di
  automazione richiesto (scelto: controllo automatico all'avvio + avviso in-app con un tap per
  installare, non solo un link da cercare a mano). Implementazione in 3 parti:
  1. **Keystore di firma**: generata con `keytool` (formato PKCS12, validità 10000 giorni),
     conservata in `C:\Users\Gioix\keystores\myroad\myroad-release.jks` — **fuori dal repo**, con
     un file `README-PRIVATO-NON-CONDIVIDERE.txt` accanto che documenta password/alias e il
     rischio se si perde (le installazioni già firmate non ricevono più aggiornamenti, servirebbe
     ricominciare da capo con una nuova chiave). `android/keystore.properties` (nuovo, locale,
     **gitignored**) punta a questo file — `android/app/build.gradle` lo legge se presente per
     configurare `signingConfigs.release`; se assente (es. un'altra macchina senza la keystore) la
     build `assembleRelease` risulta semplicemente non firmata invece di fallire, per non rompere
     CI/altri sviluppatori. `android/.gitignore` aggiornato per escludere `*.jks`/`*.keystore`/
     `keystore.properties` (le righe erano già presenti ma commentate nel template di default).
  2. **`versionCode`/`versionName` derivati da `package.json`**: prima erano hardcoded (`1`/`"1.0"`,
     mai aggiornati). Ora `android/app/build.gradle` legge `package.json` (stessa fonte di verità
     già usata da `scripts/build-launcher.ps1` per l'exe) con `groovy.json.JsonSlurper`;
     `versionCode` derivato deterministicamente dal semver (`major*10000 + minor*100 + patch`,
     es. 0.7.2 → 702) — monotono finché il semver non regredisce, requisito Android per accettare
     un aggiornamento. Richiesto `buildFeatures { buildConfig true }` (non abilitato di default
     dalle versioni recenti di Android Gradle Plugin) per generare la classe `BuildConfig` usata
     dal controllo versione a runtime.
  3. **`UpdateChecker.java`** (nuovo, chiamato da `MainActivity.onCreate`): mirror semplificato
     dell'auto-updater del launcher desktop (`UpdateChecker.cs`/`UpdateInstaller.cs`) ma nativo
     Android — su un thread in background, interroga `api.github.com/repos/Gioixxx/MyRoad/
     releases/latest`, confronta `tag_name` con `BuildConfig.VERSION_NAME` (confronto numerico
     per componenti semver, non stringa), se trova una versione più recente mostra un
     `AlertDialog` con un tap per scaricare l'asset `.apk` della release e installarlo. Gestisce
     il permesso Android 8+ `REQUEST_INSTALL_PACKAGES` (necessario per installare pacchetti da
     un'app che non è uno "store"): se non concesso, apre le impostazioni di sistema pertinenti
     (`Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES`) invece di fallire silenziosamente. L'APK
     scaricato viene esposto tramite il `FileProvider` **già dichiarato** da Capacitor in
     `AndroidManifest.xml` (riusato il path `cache-path` esistente, che copre l'intera cache
     dell'app — nessuna modifica a `file_paths.xml` necessaria). Fallimenti di rete/parsing sono
     silenziosi by design, stesso principio del check periodico del launcher desktop. Aggiunta
     `INTERNET`/`REQUEST_INSTALL_PACKAGES` a `AndroidManifest.xml` (`INTERNET` era già presente).
  4. **`scripts/build-android.ps1`** (nuovo, mirror di `build-launcher.ps1`): `npm run build` →
     `npx cap sync android` → `gradlew assembleRelease` → copia in `dist/MyRoad.apk`. Fallisce
     esplicitamente se `android/keystore.properties` non esiste, per non produrre e distribuire
     per errore un APK non firmato. `dist/*.apk` aggiunto a `.gitignore` radice, stesso principio
     già usato per `dist/*.exe` — mai committato, solo allegato alle GitHub Release.
- **Perché:** l'app Android non aveva alcun canale di aggiornamento — ogni nuova build richiedeva
  cavo/ADB dal PC di sviluppo, impraticabile per tester esterni. Un vero self-update silenzioso
  (zero interazione) non è possibile per un'app fuori dal Play Store — il massimo ottenibile è
  "controllo automatico + un tap per completare", esattamente il compromesso scelto dall'utente.
  Riuso del `FileProvider` già presente (invece di dichiararne uno nuovo) evita una duplicazione/
  collisione di `authorities` con quello di Capacitor.
- **Alternative:** conservare la keystore in un servizio cloud/CI (es. GitHub Secrets per una
  futura pipeline di build automatica) — scartata dall'utente a favore del PC locale, più
  semplice da gestire per un progetto a singolo sviluppatore senza CI Android già impostata. Solo
  link scaricabile senza controllo automatico in-app — scartata dall'utente, voleva il check
  automatico all'avvio.
- **Impatto:** `android/app/build.gradle`, `android/keystore.properties` (nuovo, non committato),
  `android/.gitignore`, `android/app/src/main/AndroidManifest.xml`,
  `android/app/src/main/java/com/gioixxx/myroad/MainActivity.java` (+chiamata
  `UpdateChecker.checkAsync`), `UpdateChecker.java` (nuovo), `scripts/build-android.ps1` (nuovo),
  `.gitignore` radice (+`/dist/*.apk`). Verificato: `assembleRelease` produce un APK firmato
  (confermato con `apksigner verify --print-certs`, **non** con `keytool -printcert -jarfile` che
  non riconosce lo schema di firma v2/v3 usato di default e segnala falsamente "non firmato"),
  `versionCode`/`versionName` corretti nell'output-metadata (702/"0.7.2"), installato con
  `assembleDebug` ancora funzionante (nessuna regressione dalle modifiche a `build.gradle`),
  installato e avviato senza crash su un tablet reale.
- **Aggiornamento stesso giorno — verificato con un aggiornamento reale rilevato**: pubblicata
  v0.8.0 mentre un dispositivo di test aveva ancora v0.7.2 installata (release-signed) — al
  riavvio dell'app è comparso correttamente il dialog "Nuova versione disponibile", il tap su
  "Aggiorna" ha scaricato l'APK e aperto la schermata di sistema del package installer. **Trovato
  un problema reale sul dispositivo dell'utente** (diverso dal tablet di test, con ancora la
  vecchia build **non firmata con la chiave stabile** installata, es. debug): Android rifiutava
  l'installazione con un errore di certificato, perché richiede la stessa firma tra la versione
  installata e quella nuova per trattarla come aggiornamento — **atteso e documentato** nelle note
  della release v0.8.0 ("se hai già installato una versione precedente non firmata con questa
  chiave, disinstalla e reinstalla una volta"), risolto disinstallando e reinstallando da zero;
  gli aggiornamenti successivi non dovrebbero più incontrarlo, essendo tutte le build successive
  firmate con la stessa chiave. **Chiarimento importante distinto da questo**: l'utente ha anche
  segnalato un avviso di sicurezza Honor ("App non verificata") ad ogni installazione — **non è
  un problema di certificato/firma**, è un livello di sicurezza OEM separato che compare per
  qualunque APK installato fuori dall'App Market Honor, indipendentemente da come è firmato (non
  compare installando via `adb install`, solo nel flusso file scaricato/aperto sul dispositivo).
  Rimuoverlo richiederebbe pubblicare su uno store ufficiale — scope molto più grande, l'utente ha
  scelto di lasciarlo com'è per ora (vedi [[tech-debt]]).

### Overlay celebrativo per l'obiettivo di ciclo + traguardi OVR distinti + auto-dismiss di tutti i moment overlay
- **Data:** 2026-08-11
- **Decisione:** su segnalazione diretta dell'utente ("il raggiungimento di un obiettivo è poco
  chiaro a livello visivo, non so a livello di OVR se viene fatto qualcosa"), indagine (2 agenti
  Explore) ha confermato due gap distinti: l'obiettivo di ciclo (`CycleObjective`) funzionava a
  livello di dominio (bonus popolarità/risparmi) ma a schermo era solo una riga di testo colorata
  nel banner di fine ciclo, senza alcuna festa; i traguardi OVR (60/70/80/85/90) **avevano già**
  l'overlay celebrativo completo (`MomentOverlay.tsx`), ma erano visivamente quasi identici al
  moment "playstyle" (stesso cerchio dorato, icona generica) e con copy identica per ogni soglia
  — facili da percepire come "un altro popup" invece che un traguardo memorabile. Confermato con
  l'utente (`AskUserQuestion`, 3 giri) di affrontare entrambi i problemi insieme:
  1. **Nuovo moment `"objective"`**: quando l'obiettivo di ciclo è raggiunto si accoda come vero
     moment nell'overlay a schermo intero (icona lucide `Target`, cerchio `--color-success`
     verde — colore non ancora usato da nessun altro moment kind, coerente col colore già usato
     per la riga "Obiettivo raggiunto" nel banner). Se mancato, nessuna festa: resta solo il testo
     nel banner come prima. Inserito **in fondo** alla coda `buildCareerMoments` (dopo trofeo/
     premio/convocazione/traguardo/playstyle) perché è l'evento più frequente di tutti — messo
     prima avrebbe rubato risalto a eventi rari.
  2. **Traguardi OVR più distinti**: nuovo `lib/career/milestone-labels.ts` (stesso pattern di
     `award-labels.ts`/`playstyles.ts`, `Record<OvrMilestoneThreshold, {title, detail}>` esaustivo
     a compile-time) con copy dedicata per ciascuna delle 5 soglie (es. 60 "Titolare inamovibile",
     80 "Classe internazionale", 90 "Leggenda vivente"). Per l'accento visivo, **riuso di
     `OvrBadge.tsx`** (già mostrato su `PlayerCard`/`CareerTable`/`CareerSummary`/`CareerArchive`)
     invece di inventare un nuovo elemento grafico — nuova size `"lg"` (~80px) aggiunta al
     componente esistente. Scelta deliberata rispetto a un nuovo elemento: il numero OVR reale è
     più informativo di un'icona decorativa, la colorazione a fasce di `OvrBadge`
     (bronzo/argento/oro) dà una progressione visiva naturale tra le 5 soglie che prima non
     esisteva (colore piatto uguale per tutte), e crea un filo visivo riconoscibile col cartellino
     ("stesso badge che vedo sempre, solo più grande").
  3. **Auto-dismiss per tutti i moment overlay** (esistenti e nuovo): 6s di timer, in pausa su
     hover del pannello (non su focus DOM — il componente ha già un focus trap permanente sul
     bottone "Continua", usare il focus come trigger di pausa lo fermerebbe all'istante) e su
     `blur`/`visibilitychange` della finestra (copre il caso di alt-tab durante la lettura),
     **completamente disattivato** (non solo rallentato) con `prefers-reduced-motion`, stessa
     identica gating già usata per i coriandoli in questo file. Barra di progresso opzionale
     aggiunta per comunicare visivamente il countdown. Controllo manuale (bottone/Escape) sempre
     disponibile e immediato, indipendentemente dal timer.
  4. Reso esplicito l'ultimo branch dello switch di rendering (prima un `else` implicito per
     `"callup"`) con un `else` finale esaustivo (`const _exhaustive: never = moment`), stesso
     idioma già usato in `satisfaction.ts` (`isObjectiveMet`) — rete di sicurezza ora che l'union
     ha 6 varianti invece di 5.
- **Perché:** l'utente ha scelto esplicitamente il trattamento "overlay come i trofei" per
  l'obiettivo (non solo un banner potenziato) e "copy per fascia + accento visivo distinto" per i
  traguardi OVR, oltre all'auto-dismiss per **tutti** gli overlay (non solo quelli toccati in
  questo giro) per non lasciare un'incoerenza tra un moment "vecchio" a chiusura manuale e uno
  "nuovo" a chiusura automatica. Riuso di `OvrBadge` invece di un nuovo componente/CSS
  (`gold-metal` proposto inizialmente da un agente di design) scelto durante la revisione: stesso
  principio "riusa pattern esistenti" già seguito per `award-labels.ts`/`playstyles.ts`, con il
  vantaggio aggiuntivo della progressione bronzo/argento/oro tra le soglie.
- **Alternative:** icona generica dedicata per il traguardo (invece del badge numerico) — scartata
  in fase di revisione del piano perché meno informativa e perché duplicava logica già esistente
  in `OvrBadge`. Pausa dell'auto-dismiss su focus DOM invece che su hover — scartata, incompatibile
  col focus trap già presente nel componente (lo fermerebbe permanentemente).
- **Impatto:** `src/components/features/career/MomentOverlay.tsx` (+moment `"objective"`, branch
  milestone riscritto, timer auto-dismiss, esaustività), `src/components/features/career/
  OvrBadge.tsx` (+size `"lg"`), `src/lib/career/milestone-labels.ts` (nuovo),
  `src/components/features/career/CareerGame.tsx` (un campo in più a `buildCareerMoments`),
  `src/app/globals.css` (+keyframe barra di progresso), 2 nuovi file di test
  (`MomentOverlay.test.ts` logica pura, `MomentOverlay.test.tsx` RTL+fake timers — nuovo pattern
  di test per componenti con timer in questo progetto). 397 test (era 386), `tsc`/lint puliti
  (solo i 4 warning pre-esistenti). **Verificato dal vivo nel browser** (forzando `player.ovr`/
  `currentObjective` via `localStorage` + reload, stesso metodo già usato in sessioni precedenti):
  traguardo OVR 80/85 con badge dorato e copy tier-specifica confermati, overlay trofeo con barra
  di progresso e pausa su hover confermati, banner "Obiettivo raggiunto" invariato confermato — il
  nuovo overlay verde dell'obiettivo non è stato osservato dal vivo in questa sessione (solo via
  test automatico), diverso in questo dai casi precedenti dove di solito si è arrivati a una
  verifica visiva completa. Rilasciato come **v0.9.0** (bump minor, coerente col criterio già
  usato per bundle di feature UX correlate) con `dist/MyRoad.exe` e `dist/MyRoad.apk` rigenerati e
  allegati alla release.

### APK v0.9.0 stantio nella release GitHub — causa reale nella redirezione stderr di PowerShell
- **Data:** 2026-08-12
- **Decisione:** l'utente ha segnalato che l'APK v0.9.0 "non si aggiornava" nemmeno disinstallando
  e reinstallando. Diagnosticato con il tablet collegato via ADB: `dumpsys package` mostrava
  `versionCode=800`/`versionName=0.8.0` — l'APK allegato alla release v0.9.0 era in realtà una
  build **vecchia rimasta in `dist/`** da una sessione precedente, non quella nuova. Causa: il
  giorno prima `scripts/build-android.ps1` era stato lanciato con `2>&1 | Select-Object` — un
  warning innocuo di Gradle sull'SDK XML finiva su stderr, e con `$ErrorActionPreference = "Stop"`
  nello script PowerShell lo trasforma in un errore terminante che interrompe l'esecuzione
  *prima* dello step "copia l'APK in dist/" — lo script uscito con `NativeCommandError` era stato
  scambiato per un fallimento innocuo, senza notare che l'APK effettivamente pubblicato non era
  mai stato rigenerato. Fix: ricostruita la build **senza** `2>&1` (comportamento già documentato
  come anti-pattern nelle istruzioni del tool PowerShell di questa sessione — "Avoid `2>&1` on
  native executables... stderr is already captured for you"), verificata con `aapt2 dump badging`
  (versionCode/versionName) e `apksigner verify --print-certs` **prima** di ricaricare l'asset
  sbagliato sulla release esistente (`gh release upload --clobber`), poi installata via ADB sul
  tablet per conferma diretta.
- **Perché:** conferma pratica di una lezione già nota in astratto (vedi istruzioni del tool
  PowerShell) ma non ancora vissuta in un incidente reale su questo progetto — un warning
  innocuo su stderr può silenziosamente troncare uno script di build che sembra "quasi riuscito"
  (l'APK in `dist/` esisteva, aveva la dimensione giusta, sembrava plausibile), rendendo la
  build-non-aggiornata quasi impossibile da notare senza verificare esplicitamente
  versionCode/versionName del file prodotto.
- **Alternative:** nessuna — una volta isolata la causa, il fix è diretto (non redirigere stderr).
- **Impatto:** nessun file di progetto cambiato (solo procedura di build/release). **Promemoria
  procedurale per il futuro**: dopo ogni `build-android.ps1`/`build-launcher.ps1`, verificare
  SEMPRE `versionCode`/`versionName`/`FileVersion` del file appena prodotto (`aapt2 dump badging`,
  `Get-Item ... | .VersionInfo.FileVersion`) prima di allegarlo a una release — non fidarsi solo
  del fatto che lo script sia arrivato in fondo senza un errore visibile in console.

### Overlay obiettivo di ciclo: mostrato una sola volta per carriera, non ad ogni completamento
- **Data:** 2026-08-12
- **Decisione:** su segnalazione diretta dell'utente ("il raggiungimento degli obiettivi... non
  deve essere ripetuto. se già è spuntato una volta basta quella"), il nuovo moment "objective"
  (introdotto in v0.9.0, vedi sopra) ora si accoda **solo la prima volta** in cui un obiettivo di
  ciclo viene raggiunto in una data carriera — dato che è l'evento più frequente di tutti (quasi
  ogni ciclo), ripeterlo ogni volta lo rendeva percepito come rumore invece che una celebrazione.
  Nuovo campo persistito `Player.objectiveMomentShown?: boolean` (default `false`,
  `STORAGE_VERSION` 8→9, `migratePlayerV8`); `objectiveResult` in `CycleResult`/
  `CycleOutcomeSummary` guadagna un campo `firstTime: boolean` (calcolato in `loop.ts` come
  `evaluated.met && !player.objectiveMomentShown`, che poi imposta il flag a `true`);
  `buildCareerMoments` in `MomentOverlay.tsx` accoda il moment solo se `objectiveResult.firstTime`
  (non più solo `met`). **Il banner di fine ciclo resta invariato**: mostra "Obiettivo raggiunto/
  mancato" ad ogni ciclo come prima — solo l'overlay a schermo intero smette di ripetersi. I
  reward (popolarità/risparmi) restano invariati, si applicano ad ogni obiettivo raggiunto
  indipendentemente da `firstTime`.
- **Perché:** a differenza di trofei/premi/convocazioni/traguardi OVR (eventi rari per natura),
  l'obiettivo di ciclo viene rollato e valutato quasi ogni ciclo — mostrarlo come festa a
  schermo intero ogni volta ne svaluta l'impatto molto più in fretta degli altri moment.
- **Nota di processo — debug**: la prima verifica manuale nel browser sembrava mostrare un bug (la
  logica pareva corretta ma l'overlay non compariva mai, nemmeno alla prima occorrenza) —
  investigato con log temporanei (rimossi prima del commit) fino a scoprire che `chooseOption`
  (hook `useCareerGame.ts`) usa `setState((prev) => ...)`, e React Strict Mode (attivo di default
  in `next dev`) **invoca due volte** le funzioni updater passate a `setState` per rilevare
  impurità — questo aveva fatto sospettare una race condition nel codice, ma si è rivelato un
  falso allarme: entrambe le invocazioni ricevono lo stesso `prev` e calcolano `firstTime` in
  modo identico, quindi non causa il problema. La causa reale dei primi test "falliti" era solo
  un artefatto di osservazione (click troppo ravvicinati/coordinate del bottone "Continua"
  riferite allo screenshot sbagliato in una sequenza `browser_batch`, non un bug nel codice) —
  confermato in modo definitivo instrumentando `window.__debugLogs` invece di fidarsi di
  screenshot con timing incerto. Utile ricordare per future sessioni di debug UI in questo
  progetto: **in `next dev`, ogni `setState(prev => ...)` viene eseguito due volte** — se un log
  di debug sembra "raddoppiato" non è necessariamente un sintomo di un bug reale.
- **Alternative:** nessuna — richiesta chiara e specifica dell'utente, un solo modo ragionevole di
  implementarla (flag persistito "già mostrato una volta").
- **Impatto:** `src/types/career.ts` (+`Player.objectiveMomentShown?`), `src/lib/career/engine.ts`
  (`createPlayer`), `src/lib/career/storage.ts` (`STORAGE_VERSION` 9, `migratePlayerV8`),
  `src/lib/career/loop.ts` (`objectiveResult.firstTime`), `src/hooks/useCareerGame.ts` (tipo
  `CycleOutcomeSummary.objectiveResult`), `src/components/features/career/MomentOverlay.tsx`
  (`buildCareerMoments` condiziona su `firstTime`). 399 test (era 397, +2: caso "raggiunto ma non
  prima volta" e migrazione v8→v9), `tsc`/lint puliti. **Verificato dal vivo nel browser**
  (a differenza della v0.9.0, questa volta con successo): prima occorrenza mostra l'overlay verde
  con Target, seconda occorrenza nella stessa carriera mostra solo il banner — entrambi i casi
  osservati direttamente. Rilasciato come **v0.9.1** (patch, fix comportamentale non nuova
  feature), `dist/MyRoad.exe`/`dist/MyRoad.apk` rigenerati (versionCode/FileVersion verificati
  prima della pubblicazione, per non ripetere l'incidente della voce precedente) e allegati alla
  [release GitHub v0.9.1](https://github.com/Gioixxx/MyRoad/releases/tag/v0.9.1), installata e
  verificata anche sul tablet fisico via ADB.

### Confronto plausibilità gioco-vs-realtà (nuovo asse, diverso da gioco-vs-originale) + fix convocazione in nazionale
- **Data:** 2026-08-12
- **Decisione:** su richiesta esplicita dell'utente di confrontare l'ottenimento di trofei/premi/
  convocazioni del gioco con la realtà del calcio professionistico (non con l'originale "Copero",
  già confrontato più volte in passato), prodotto un **Artifact HTML** ("Trofei a confronto",
  design system dedicato — palette verde campo/oro coerente col "cartellino" del gioco ma adattata
  a un dossier scouting, Bebas-style condensed per i titoli, serif per il corpo, monospace
  tabulare per i numeri) con 6 meccaniche confrontate: durata carriera, trofeo di club, trofeo di
  nazionale, convocazione in nazionale, award generici, Pallone d'Oro. Verdetti distinti in 3
  categorie: **plausibile** (durata carriera, trofeo di nazionale come astrazione, award generici
  — nessuna modifica), **generoso per design** (trofeo di club 84.4%, Pallone d'Oro — scostamenti
  dalla realtà già scelti deliberatamente in sessioni precedenti per rendere il gioco
  soddisfacente, non bug — lasciati invariati, con un valore alternativo solo documentato come
  opzione), **da ribilanciare** (convocazione in nazionale, unico scostamento già segnalato come
  non pianificato in tech-debt.md).
  - **Fix applicato**: `TARGETMAN_CALLUP_BONUS` in `src/lib/career/playstyles.ts` da 0.08 a 0.03
    (due giri di misurazione con `npm run simulate`: 0.04 dava 31.8%, ancora sopra la fascia
    target 20-30%; 0.03 dà **28.4%**, dentro fascia e vicino al ~25-28% tarato deliberatamente
    prima della deriva della Fase 5 del 2026-08-10). Trofeo di club (82.1%) e trofeo di nazionale
    (5.5%) rimisurati nella stessa run per confermare che il fix è isolato alla sola convocazione,
    nessun'altra frequenza si è mossa.
- **Perché:** stesso principio già consolidato nel progetto ("harness prima, poi ritara") applicato
  qui su un asse nuovo — il confronto con la realtà, distinto dal confronto con l'originale già
  fatto più volte. La distinzione tra "generoso per design" e "da ribilanciare" è il punto
  centrale: molte soglie del gioco sono state rese esplicitamente più generose della realtà in
  sessioni precedenti per un obiettivo di divertimento/raggiungibilità (documentato più volte in
  questo stesso file) — ririaprire quelle scelte senza una richiesta esplicita in questa sessione
  sarebbe stato un errore, mentre la convocazione era un caso diverso: una deriva **non
  pianificata** già segnalata come aperta in tech-debt.md, quindi l'unico candidato a un fix reale
  senza bisogno di ridiscutere una decisione di design già presa.
- **Alternative:** riportare anche il trofeo di club/Pallone d'Oro a valori più realistici —
  scartato di default (solo documentato come opzione nell'artifact, non applicato), perché
  contraddirebbe due decisioni di design precedenti già motivate esplicitamente in questo file
  ("Soglie award/nazionale/coppa continentale... deliberatamente più generose dell'originale",
  "Bilanciamento su 7 fasi... trofeo di club ridotto... target utente esplicito 75-85%").
- **Impatto:** `src/lib/career/playstyles.ts` (`TARGETMAN_CALLUP_BONUS` 0.08→0.03). 399 test
  invariati, `tsc --noEmit` pulito. Item di tech-debt corrispondente spostato in Archiviato
  (vedi [[tech-debt]]).

### Follow-up stessa sessione: anche i due punti "generosi per design" ristretti su richiesta esplicita dell'utente
- **Data:** 2026-08-12
- **Decisione:** dopo aver visto l'artifact, l'utente ha chiesto esplicitamente di intervenire
  anche su trofeo di club e Pallone d'Oro (non solo sulla convocazione, unico punto originariamente
  proposto come fix). Non un ritorno ai tassi reali (avrebbe riportato il gioco alla sensazione
  "irraggiungibile" dell'originale, già scartata in passato), ma un compromesso a metà strada,
  concordato in chat prima di applicare: trofeo di club verso ~65-70% (da 84,4%), Pallone d'Oro
  dimezzato nel roll secondario.
  - **Trofeo di club**: scoperto durante la taratura che `CLUB_TROPHY_CHANCE_CAP` (0,3, poi
    provato a 0,2) **non era mai vincolante** — il massimo teorico della formula
    (`prestigio_max×peso + bonus_OVR_cap` = 3×0,03+0,08 = 0,17) è già sotto qualunque valore di
    cap provato, quindi ridurre il cap da solo è un no-op silenzioso (verificato: 82,1%→82,6%,
    nessun cambiamento reale, solo rumore statistico tra run). I veri driver sono
    `CLUB_TROPHY_PRESTIGE_WEIGHT` e `CLUB_TROPHY_OVR_BONUS_CAP`. Tre giri di misurazione con
    `npm run simulate`: peso 0,03→0,02/cap-bonus 0,08→0,05 (77,6%), poi 0,03→0,014/0,035 (73,9%),
    poi 0,03→**0,012**/cap-bonus 0,08→**0,03** (**72,2%**, fermato qui — vicino alla fascia
    obiettivo, ulteriori tagli avrebbero rincorso il rumore tra run). `CLUB_TROPHY_CHANCE_CAP`
    riportato a 0,3 (il valore originale, dato che non è comunque mai vincolante — nessun motivo
    di lasciarlo a un valore diverso che implicherebbe falsamente un effetto).
  - **Pallone d'Oro**: `BALLON_DOR_ROLL_CHANCE` 0,3→0,15 in `trophies.ts` — qui il gate
    `BALLON_DOR_OVR_THRESHOLD=90` è il vero collo di bottiglia (popolazione già minuscola sotto
    scelta uniforme nell'harness), il dimezzamento del roll secondario dimezza correttamente le
    chance nella sottopopolazione che lo raggiunge (misurato 0,1-0,3%→0,0-0,1%, entrambi già
    vicini a zero sotto scelta uniforme per lo stesso motivo già documentato altrove — vedi nota
    su `pickUniformOption` che sottostima gli esiti che richiedono OVR molto alto).
- **Perché:** stesso principio "harness prima, poi ritara" — la scoperta che il cap del trofeo di
  club non era vincolante è un promemoria diretto (già visto altre volte in questo progetto, es.
  la ricalibrazione OVR del 2026-08-06) che una costante con un nome che *sembra* la leva giusta
  può non esserlo affatto: va sempre verificato l'effetto reale con l'harness, non dedotto dal
  nome della costante.
- **Alternative:** nessuna — l'utente ha approvato esplicitamente il compromesso proposto (non i
  tassi reali) prima dell'implementazione.
- **Impatto:** `src/lib/career/trophies.ts` (`CLUB_TROPHY_PRESTIGE_WEIGHT` 0,03→0,012,
  `CLUB_TROPHY_OVR_BONUS_CAP` 0,08→0,03, `BALLON_DOR_ROLL_CHANCE` 0,3→0,15;
  `CLUB_TROPHY_CHANCE_CAP` invariato a 0,3 dopo aver verificato che non è vincolante). 399 test
  invariati, `tsc --noEmit` pulito. Convocazione (28,9%) e trofeo di nazionale (5,1-5,6%)
  rimisurati stabili in ogni run, a conferma che le modifiche sono isolate alle rispettive
  meccaniche. Artifact "Trofei a confronto" aggiornato con i nuovi valori e le formule applicate
  (stessa URL, redeploy). Nessuna release/bump di versione in questa sessione.
