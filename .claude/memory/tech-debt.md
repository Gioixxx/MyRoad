---
type: tech-debt
tags: [memory, tech-debt]
updated: [2026-08-11]
---

# Tech Debt
Registro debito tecnico con priorità. Aggiornato da /session-end. Origine spesso in [[conventions]].

> **Chiusura in blocco — 2026-08-11:** su richiesta esplicita dell'utente ("la Tech debt la puoi
> ritenere chiusa"), tutti gli item sotto sono stati dichiarati chiusi senza una verifica puntuale
> voce-per-voce — è una decisione di accettare collettivamente il rischio residuo, non la prova che
> ciascun problema sia stato effettivamente risolto/verificato. Le descrizioni originali restano
> intatte come riferimento storico (cosa non era ancora verificato e perché), utile se in futuro un
> bug osservato in gioco rimanda a uno di questi punti. Nessuna voce spostata in Archiviato per non
> perdere la distinzione tra "chiuso per decisione" e "risolto con verifica reale" (vedi le voci
> già in Archiviato sotto, quelle sì verificate).

## Template
### [Titolo breve]
- **Priorità:** Alta / Media / Bassa
- **Area:** [modulo/layer/feature]
- **Data:** [YYYY-MM-DD]
- **Descrizione:** [problema: duplicazione, workaround, ecc.]
- **Perché rimandato:** [motivo]
- **Impatto:** [rallenta sviluppo / rischio bug]
- **Risoluzione:** [piano suggerito]

---

### Soglia di ritiro automatico (40 anni) basata su pochi campioni
- **Priorità:** Bassa
- **Area:** `lib/career/engine.ts` (`checkRetirement`)
- **Data:** 2026-08-04
- **Descrizione:** la soglia di ritiro automatico è stata spostata da 41 a 40 anni sulla base di 3 osservazioni concordanti raccolte da un agente di ricerca sul gioco originale — un campione ridotto per una costante che definisce la durata massima di ogni carriera.
- **Perché rimandato:** 3 osservazioni concordanti sono un segnale ragionevole per procedere, non giustificano da sole una ricerca dedicata aggiuntiva in questa fase.
- **Impatto:** basso — se la soglia reale fosse leggermente diversa, l'effetto sarebbe solo qualche carriera che finisce 1 anno prima/dopo il previsto, nessun rischio funzionale.
- **Risoluzione suggerita:** se emergono altre osservazioni (nuove sessioni di ricerca o playtest), verificare che 40 resti coerente; altrimenti considerare la questione chiusa.

### Ricalibrazione OVR/soglie "grande momento" non verificata end-to-end nel browser
- **Priorità:** Media
- **Area:** `lib/career/progression.ts`, `lib/career/decisions.ts`, `lib/career/trophies.ts`
- **Data:** 2026-08-06
- **Descrizione:** la ricalibrazione (vedi [[decisions]]) è stata verificata via test unitari (274 verdi) e via l'harness statistico (`npm run simulate`, scelte casuali uniformi su 2000 carriere) ma non è stata rigiocata manualmente una carriera nel browser per confermare che la sensazione "in gioco" corrisponda ai numeri misurati (OVR che sale visibilmente oltre 80, un'offerta da un top club, una convocazione, un trofeo di nazionale).
- **Perché rimandato:** sessione focalizzata sul bilanciamento numerico; l'harness sceglie le opzioni in modo uniforme/casuale quindi sottostima leggermente un giocatore reale che sceglie con criterio (le fasce osservate sono quindi un pavimento conservativo, non un tetto).
- **Impatto:** rischio medio — se qualche interazione UI (es. `targetPrestige`/offerte, badge convocazione) leggesse i valori vecchi da qualche altra parte non aggiornata, il problema resterebbe invisibile finché qualcuno non gioca davvero.
- **Risoluzione suggerita:** giocare/simulare (o usare l'harness con `pickOption` che favorisce esiti OVR-positivi, se mai costruito) qualche carriera fino al ritiro per osservare almeno un'offerta da club di prestigio alto e, se possibile, una convocazione.
- **Aggiornamento 2026-08-06:** cross-validazione (non ancora un playtest manuale del *nostro* clone, ma un secondo tipo di evidenza) ottenuta da 23 carriere giocate sull'**originale** da 3 agenti browser paralleli (vedi [[decisions]], piano esterno "Esplorazione aggiuntiva 5"): convocazione aggregata ~27% (vs ~22.5% del clone, vicino ma con un effetto soglia più netto a OVR ~84-87 nell'originale contro una probabilità continua nel clone), trofeo di nazionale aggregato ~5.6% (vs ~5% del clone, molto vicino), award individuale 0/18 anche nel caso estremo (92 OVR/127 presenze/World Cup vinto) — conferma che tenerli rarissimi anche a OVR alto è corretto. Resta comunque aperta la verifica manuale nel browser del *nostro* clone.
- **Aggiornamento 2026-08-07:** prima verifica manuale nel browser del *nostro* clone (vedi [[sprint]]): carriera di test giocata dal vivo, OVR salito a 77 in 6 cicli (16→28 anni) con un'offerta reale dal Tottenham Hotspur (Premier League) a OVR 74 — conferma diretta che le soglie ritarate producono offerte da top club raggiungibili in gameplay reale, non solo nell'harness. Non ancora osservate in questo giro: una convocazione in nazionale o un trofeo di nazionale (richiede una carriera più lunga/mirata) — voce non ancora archiviabile.

### Promozione di campionato mai osservata esplicitamente nell'originale (retrocessione sì)
- **Priorità:** Bassa
- **Area:** `lib/career/club-progression.ts`
- **Data:** 2026-08-06
- **Descrizione:** su 23 carriere giocate sull'originale (Esplorazione aggiuntiva 5), la retrocessione è stata osservata più volte con un'icona/tooltip dedicato ("Relegation", freccia rossa) — confermando che il clone l'ha implementata correttamente. La **promozione** invece non è mai comparsa con un indicatore equivalente, nemmeno restando a lungo in un club appena retrocesso. Non è chiaro se l'originale non dia mai un trattamento UI esplicito alla promozione (succede silenziosamente) o se semplicemente nessuna delle 23 carriere abbia vissuto quella sequenza per puro caso campionario.
- **Perché rimandato:** nessuna evidenza sufficiente per concludere che la promozione nel clone sia sbagliata — è solo un punto rimasto non verificato, non un difetto accertato.
- **Impatto:** minimo — se la promozione esistesse ma con probabilità molto più bassa della retrocessione nell'originale, il clone (probabilità simmetrica, vedi [[decisions]]) potrebbe risultare leggermente più generoso nel promuovere di quanto sia fedele all'originale.
- **Risoluzione suggerita:** in una futura sessione di ricerca, giocare deliberatamente più cicli in un club appena retrocesso per verificare se/come la promozione riceve un trattamento UI nell'originale.

### Generatori club-crisis scelti con probabilità uniforme tra loro, non pesata
- **Priorità:** Bassa
- **Area:** `lib/career/loop.ts` (`pickClubCrisisDecision`)
- **Data:** 2026-08-04
- **Descrizione:** i generatori della categoria `club-crisis` sono scelti con probabilità uniforme tra loro (a parità di "recenza") in `pickClubCrisisDecision`. La ricerca sul gioco originale non ha misurato se questi eventi abbiano frequenza relativa uguale o diversa tra loro.
- **Perché rimandato:** informazione non disponibile dalla ricerca; una scelta uniforme resta un default ragionevole in assenza di dati.
- **Impatto:** minimo — al più una leggera differenza di "sapore" nella varietà degli eventi rispetto all'originale, nessun impatto funzionale.
- **Risoluzione suggerita:** nessuna azione necessaria a meno che una ricerca futura non fornisca dati sulla frequenza relativa osservata nell'originale.
- **Aggiornamento 2026-08-06:** aggiunta anti-ripetizione **a livello di singolo evento** (non solo di categoria) in `loop.ts`/`decisions.ts` — vedi [[decisions]] e l'item "Possibile assenza di finestra anti-ripetizione" ora archiviato. Risolve un problema adiacente (evitare ripetizioni ravvicinate dello stesso evento) ma **non** questo item: i pesi di base tra i diversi generatori `club-crisis` restano uguali tra loro in assenza di dati sulla frequenza relativa reale.

### Momenti celebrativi/timeline/animazioni non verificati end-to-end nel browser
- **Priorità:** Media
- **Area:** `MomentOverlay.tsx`, `CareerTimeline.tsx`, `hooks/useMotion.ts`, `CareerGame.tsx`
- **Data:** 2026-08-05
- **Descrizione:** i 3 commit che hanno introdotto overlay celebrativi, confetti, timeline di carriera e count-up statistiche (ba0083c, 41b9a01, c882a44) non erano stati registrati in memoria al momento del commit; questa sessione li ha documentati leggendo il codice, ma non ha rigiocato una carriera nel browser per confermare che overlay/focus-trap/coda dei momenti/rispetto di `prefers-reduced-motion` funzionino davvero come da codice.
- **Perché rimandato:** sessione dedicata al recupero della memoria disallineata, non a un giro di test funzionale.
- **Impatto:** rischio medio — è UI nuova e non banale (focus trap, coda di overlay multipli, animazioni condizionate), un bug qui sarebbe visibile all'utente ad ogni trofeo/premio vinto.
- **Risoluzione suggerita:** prima della prossima release, giocare una carriera fino a ottenere almeno un trofeo, un premio e una convocazione in nazionale nella stessa sessione per vedere la coda di overlay in sequenza; testare anche con `prefers-reduced-motion: reduce` attivo nel sistema.
- **Aggiornamento 2026-08-07:** verifica parziale in browser (vedi [[sprint]]) — l'overlay di `MomentOverlay` per i traguardi OVR (kind "milestone", testato su OVR 60/70/80) e il banner persistente "record infranti" funzionano correttamente. **Aggiornamento 2026-08-07 (stessa giornata, sessione successiva)**: in un secondo giro di playtest (verifica offerte 4/campionati emergenti) sono stati osservati anche l'overlay trofeo (Coppa Italia, DFB-Pokal, Mondiale — testo/icona/badge corretti), l'overlay convocazione in nazionale ("Convocato in nazionale!") e l'overlay premio individuale ("Giocatore della stagione") — tutti renderizzati correttamente in sequenza durante lo stesso ciclo di gioco. **Restano non verificati**: focus-trap esplicito, comportamento con `prefers-reduced-motion: reduce`, coda con 3+ overlay nello stesso ciclo — voce non ancora archiviabile ma rischio residuo ridotto.

### Sistema "satisfaction" (Hall of Fame, record personali, milestone OVR, titoli di stagione) non verificato end-to-end nel browser
- **Priorità:** Media
- **Area:** `lib/career/satisfaction.ts`, `CareerArchive.tsx`, `CareerSummary.tsx`, `PlayerCard.tsx`, `OutcomeBanner` in `CareerGame.tsx`
- **Data:** 2026-08-06
- **Descrizione:** i commit 46f180a (Hall of Fame + satisfaction) e b13fac9 (record infranti spostati in banner) sono stati documentati in memoria leggendo diff e codice, ma non è stata rigiocata una carriera nel browser per verificare: la sezione Hall of Fame in `CareerArchive` con più carriere archiviate, il "miglior titolo" mostrato in `CareerSummary`, il banner dei record infranti con più record nello stesso ciclo, lo stile condizionale delle statistiche-record in `PlayerCard`.
- **Perché rimandato:** sessione di aggiornamento memoria, non di test funzionale — stesso pattern già visto con i momenti celebrativi (vedi voce sopra, ancora aperta).
- **Impatto:** rischio medio — logica di selezione (rank titoli, Hall of Fame su 4 categorie, cap 12 titoli) non banale, un bug qui sarebbe visibile solo dopo diverse carriere giocate/archiviate, quindi difficile da notare per caso.
- **Risoluzione suggerita:** giocare/archiviare almeno 2-3 carriere con profili diversi (una con OVR alto, una con tanti trofei, una con alta popolarità) per vedere la Hall of Fame popolarsi correttamente in `CareerArchive`; forzare un ciclo con più record infranti insieme per verificare la lista nel banner.
- **Aggiornamento 2026-08-07:** l'overlay del premio individuale ("Giocatore della stagione", vedi [[sprint]]) è stato osservato funzionante in un playtest. **Restano non verificati**: Hall of Fame su `CareerArchive` con più carriere, "miglior titolo" in `CareerSummary`, banner con più record infranti insieme — voce non ancora archiviabile.

### Bottone "Chiudi" del menu principale non verificato nell'eseguibile desktop
- **Priorità:** Media
- **Area:** `launcher/CarrieraLauncher/MainForm.cs`, `components/features/career/MainMenu.tsx`
- **Data:** 2026-08-06
- **Descrizione:** il bottone "Chiudi" del nuovo menu principale chiama `window.close()` lato JS; `MainForm.cs` è stato modificato per sottoscrivere `CoreWebView2.WindowCloseRequested` (l'evento che WebView2 espone apposta per questo caso) e chiamare `Close()` sulla finestra. La modifica compila (verificato solo staticamente, non è stata rifatta la build .NET) ma **non è stata verificata eseguendo l'exe rigenerato** — il flusso completo (click "Chiudi" → evento intercettato → finestra chiusa) è verificato solo lato browser (dove `window.close()` è correttamente un no-op silenzioso, comportamento atteso).
- **Perché rimandato:** questa sessione ha lavorato solo sull'export Next.js via dev server (`npm run dev`), senza rigenerare `dist/Carriera.exe` con `scripts/build-launcher.ps1` né lanciare l'eseguibile.
- **Impatto:** rischio medio — se l'evento non si comporta come documentato (es. differenze di versione del runtime WebView2), il bottone "Chiudi" risulterebbe silenziosamente rotto solo nella build desktop, l'unico posto dove ha un effetto reale.
- **Risoluzione suggerita:** prima della prossima release, rigenerare l'exe con `scripts/build-launcher.ps1` e verificare manualmente che il bottone "Chiudi" chiuda davvero la finestra dell'app.

### Bottone "Chiudi" del menu principale non verificato sull'APK Android
- **Priorità:** Bassa
- **Area:** `android/`, `components/features/career/MainMenu.tsx`
- **Data:** 2026-08-10
- **Descrizione:** stesso `window.close()` lato JS del caso desktop (vedi voce sopra), ma il progetto Android/Capacitor non ha nessun equivalente dell'handler `CoreWebView2.WindowCloseRequested` del launcher .NET — non è stato aggiunto nessun listener nativo per intercettarlo. Durante il playtest su tablet reale il bottone non è stato provato.
- **Perché rimandato:** sessione di scaffolding/primo test, focalizzata su onboarding e leggibilità, non sul comportamento di ogni singolo bottone del menu.
- **Impatto:** rischio basso — molto probabilmente è un no-op silenzioso in un `WebView` Android standard (comportamento identico a un browser, coerente con quanto già osservato), ma non verificato; anche se non funzionasse, l'utente ha comunque il tasto "indietro"/home di sistema per uscire dall'app.
- **Risoluzione suggerita:** provare il bottone durante il prossimo giro di test sul tablet; se serve un vero "esci dall'app", aggiungere un plugin Capacitor (`@capacitor/app`, metodo `App.exitApp()`) invece di affidarsi a `window.close()`.

### Espansione mondo (12 nuovi paesi) e meccanica Giant Killer non verificate end-to-end nel browser
- **Priorità:** Media
- **Area:** `data/clubs.ts`, `data/competition-badges.ts`, `lib/career/decisions.ts`/`loop.ts`/`satisfaction.ts`, UI `PenaltyShootout`/`CareerGame`
- **Data:** 2026-08-06
- **Descrizione:** sessione interamente di codice/dati — 96 nuovi club verificati via test automatici (297 verdi) + `npm run simulate` (trigger cup-upset 7.1% dei cicli, win rate 23.7%, nessuna frequenza esistente crollata a zero) e crest/badge verificati individualmente via richieste HTTP dirette (non solo letti dal payload JSON), ma nessuna carriera è stata giocata a mano nel browser. Non verificato a vista: che gli stemmi dei 12 nuovi paesi si vedano correttamente in UI (offerte/club corrente/storico), che l'evento "sorpresa di coppa" (Giant Killer) si inneschi e mostri correttamente `PenaltyShootout` col nuovo flavor testuale, che il titolo "Ammazzagigante" compaia nel riepilogo di fine carriera.
- **Perché rimandato:** stessa convenzione già stabilita nel progetto per le sessioni di questo tipo (es. "miglioria motore su 4 assi", "ricalibrazione OVR") — verificato via test + harness, non manualmente.
- **Impatto:** rischio medio — è UI/dati nuovi non banali (96 club, 12 leghe, un nuovo evento con mini-gioco), un bug di rendering (es. un `crestUrl` che punta a un'immagine sbagliata nonostante l'HTTP 200, o un problema di layout con nomi club più lunghi del solito) sarebbe visibile solo giocando.
- **Risoluzione suggerita:** giocare/simulare una carriera con nazionalità in uno dei 12 nuovi paesi (es. Messico/Giappone/Egitto) fino a vedere l'offerta settore giovanile con gli stemmi corretti; giocare una carriera con un club di prestigio 0-1 fino a innescare la sorpresa di coppa.

### `sync-league-rosters.ts` non copre tutte le leghe esistenti (limiti noti dell'API gratuita)
- **Priorità:** Bassa
- **Area:** `scripts/sync-league-rosters.ts`
- **Data:** 2026-08-06
- **Descrizione:** lo script diagnostico (nuovo, `npm run sync-rosters`) risolve correttamente 11/14 leghe pre-esistenti verso il nome esatto TheSportsDB (via una mappa di override verificata a mano + una scoperta dinamica di fallback). Restano non risolte: Serie C (nessuna lega TSDB singola, 3 gironi — comportamento voluto, non un bug), e **Liga Profesional (Argentina)** — la scoperta dinamica trova solo "Argentinian Copa de la Liga Profesional" che non restituisce un roster. Inoltre confermato in pratica che `search_all_teams.php` con la chiave gratuita **tronca sempre a 10 squadre per risposta**, quindi la lista "in clubs.ts ma non nel roster live" dello script è strutturalmente rumorosa per leghe da più di 10 club reali (documentato nell'header del file).
- **Perché rimandato:** lo script è comunque utile così com'è (11/14 leghe con report utilizzabile) — non blocca l'uso, la ricerca del nome TSDB esatto per l'Argentina richiede solo un giro di verifica manuale in più.
- **Impatto:** minimo — lo script è uno strumento diagnostico manuale, non parte del gioco.
- **Risoluzione suggerita:** trovare e verificare il nome `strLeague` esatto per "Liga Profesional" argentina (probabilmente legato al formato del torneo corrente, che cambia più spesso in Argentina rispetto ad altri paesi) e aggiungerlo a `TSDB_LEAGUE_NAME_OVERRIDES`.

### Traits/archetipo + Shadow non verificati end-to-end nel browser
- **Priorità:** Media
- **Area:** `lib/career/traits.ts`, `lib/career/shadow.ts`, `PlayerCard.tsx`, `CareerSummary.tsx`, `CareerArchive.tsx`
- **Data:** 2026-08-06
- **Descrizione:** sessione di dominio/harness — 342 test verdi + `npm run simulate` (tutti e 6 gli archetipi e lo scandalo/redenzione confermati non nulli su 2000 carriere), ma nessuna carriera è stata giocata a mano. Non verificato a vista: il chip "Stile: X" che compare su `PlayerCard` dopo 4 cicli, il chip "Rumors" a shadow≥25, l'evento scandalo forzato che appare davvero come `DecisionPanel` standard, l'evento di redenzione nel pool narrative, l'archetipo/titolo shadow-derivato nel riepilogo di fine carriera e nell'archivio.
- **Perché rimandato:** stessa convenzione già stabilita nel progetto per questo tipo di sessione (dominio/bilanciamento) — verificato via test + harness, non manualmente.
- **Impatto:** rischio medio — è UI nuova non banale (chip condizionali, nuova categoria di decisione forzata), un bug di rendering o di wiring (es. il chip che non appare mai, o lo scandalo che non si presenta davvero come decisione giocabile) sarebbe visibile solo giocando abbastanza a lungo da accumulare shadow o cicli.
- **Risoluzione suggerita:** giocare/simulare una carriera fino a 4+ cicli per vedere il chip "Stile"; forzare (via scelte ripetute rischiose: doping, post controversi, tradire il club in crisi) l'accumulo di shadow fino a 50+ per vedere lo scandalo forzato e, gestendolo con trasparenza, verificare che poi scenda sotto 30 per innescare la redenzione.
- **Aggiornamento 2026-08-07:** il chip "Stile: Leader" è comparso correttamente su `PlayerCard` dopo 4+ cicli in un playtest (vedi [[sprint]]). **Restano non verificati**: chip "Rumors" a shadow≥25, evento scandalo forzato, evento di redenzione, archetipo/titolo shadow-derivato in `CareerSummary`/`CareerArchive` — voce non ancora archiviabile.

### Archetipo/shadow molto rari sotto scelta uniforme casuale — reachability di un giocatore reale non misurata
- **Priorità:** Bassa
- **Area:** `lib/career/traits.ts`, `lib/career/shadow.ts`
- **Data:** 2026-08-06
- **Descrizione:** l'harness (`pickUniformOption`, sceglie a caso tra le opzioni) misura solo un "pavimento" pessimistico: un archetipo richiede scelte *direzionalmente consistenti* (es. sempre "resta" per Bandiera), cosa che una scelta uniforme casuale raramente produce per costruzione — a differenza di OVR/trofei che accumulano lungo un solo binario indipendente dalla scelta. Dopo la taratura, "nessun archetipo" resta comunque il risultato più comune (77.9% su 2000 carriere) e `problem`/scandalo-redenzione restano sotto l'1%.
- **Perché rimandato:** coerente con la nota già esistente su `simulation.ts` ("il giocatore simulato... sottostima le frequenze che richiedono scelte mirate rispetto a un giocatore reale") — non è chiaro se serva altro tuning finché non si osserva come si comporta un giocatore reale che persegue deliberatamente uno stile.
- **Impatto:** rischio basso — se un giocatore reale che sceglie sempre "resta"/"professionista" non raggiunge comunque un archetipo entro una carriera tipica (~11-12 cicli), l'obiettivo "rendere gli archetipi raggiungibili e sentiti" fallirebbe nonostante l'harness dica che sono "possibili".
- **Risoluzione suggerita:** giocare (o estendere l'harness con una `pickOption` che persegue deliberatamente un archetipo, es. sempre "resta"/sempre "professionista") per misurare la reachability reale, non solo quella sotto scelta casuale.

### Installazioni esistenti di Carriera.exe non riceveranno l'update verso una release rinominata
- **Priorità:** Media
- **Area:** `launcher/MyRoadLauncher/UpdateChecker.cs`/`UpdateInstaller.cs`
- **Data:** 2026-08-07
- **Descrizione:** il rename "Carriera" → "My Road - L'Ascesa" (vedi [[decisions]]) ha cambiato, lato client, sia l'URL dell'API GitHub interrogata (`repos/Gioixxx/Carriera` → `repos/Gioixxx/MyRoad`) sia il nome asset atteso (`Carriera.exe` → `MyRoad.exe`). Questi valori sono **hardcoded nel binario già installato**: chiunque abbia oggi `Carriera.exe` continuerà a interrogare il vecchio URL finché non lo aggiorna manualmente almeno una volta (GitHub mantiene un redirect sul repo rinominato, ma l'asset `Carriera.exe` non esisterà più nelle release future).
- **Perché rimandato:** N/A — non più rimandato, vedi aggiornamento sotto.
- **Impatto:** rischio medio — se non gestito, chi ha installato l'app prima del rename resta bloccato sull'ultima versione pre-rename senza alcun avviso (il controllo update fallisce silenziosamente per design, vedi [[decisions]] sull'auto-updater).
- **Risoluzione suggerita:** nelle note della prossima release rinominata, segnalare esplicitamente che chi ha `Carriera.exe` deve scaricare `MyRoad.exe` a mano dalla nuova release GitHub una volta; valutare se lasciare temporaneamente anche un asset `Carriera.exe` (duplicato) nella prima release post-rename per non rompere il check automatico di chi non ha ancora letto l'annuncio.
- **Aggiornamento 2026-08-07:** release [v0.5.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.5.0) pubblicata con `MyRoad.exe` e note di rilascio che avvisano esplicitamente chi ha `Carriera.exe` di scaricare manualmente il nuovo eseguibile una volta — mitigazione applicata (avviso testuale), non risolta tecnicamente (nessun asset `Carriera.exe` duplicato lasciato nella release, opzione scartata come sovra-ingegnerizzata per un singolo passaggio manuale una tantum). Resta un gap noto per chiunque non legga le note di rilascio, a priorità bassa da qui in poi.

### Wordmark "My Road - L'Ascesa" non verificato visivamente nel kicker compatto di CareerGame.tsx
- **Priorità:** Bassa
- **Area:** `src/components/features/career/CareerGame.tsx`
- **Data:** 2026-08-07
- **Descrizione:** il piccolo wordmark sopra l'header (`text-[10px] tracking-[0.35em]`, pensato per un testo corto come "Carriera", 8 caratteri) ora mostra "My Road - L'Ascesa" (19 caratteri) con lo stesso trattamento CSS molto compatto — non verificato nel browser se vada a capo, trabocchi o risulti visivamente affollato con quella tracking così ampia.
- **Perché rimandato:** sessione di rename testuale, non di design — nessun accesso a verifica visiva in questa sessione.
- **Impatto:** rischio basso — al più un dettaglio estetico nell'header, nessun impatto funzionale.
- **Risoluzione suggerita:** aprire il gioco nel browser e controllare il wordmark; se risulta troppo largo, valutare una forma più corta solo lì (es. "MY ROAD") mantenendo il nome completo nel titolo della scheda browser e nella schermata "Carriera conclusa"/menu.

### Esclusione campionati emergenti (OVR≥84) senza test automatico dedicato
- **Priorità:** Bassa
- **Area:** `src/lib/career/decisions.ts` (`eligibleClubs`, `EMERGING_MARKET_COUNTRIES`)
- **Data:** 2026-08-07
- **Descrizione:** la nuova esclusione dei 12 campionati dell'espansione mondo dal pool di `eligibleClubs` quando `targetPrestige(ovr) >= 2` (vedi [[decisions]], "Offerte club: 4 invece di 3...") è stata verificata solo manualmente in browser (due playtest, uno sotto e uno sopra la soglia OVR 84) e via `npm run simulate` per l'effetto aggregato sulle frequenze — non esiste un test unitario dedicato in `decisions.test.ts` che asserisca esplicitamente "sopra OVR 84, `eligibleClubs` non contiene mai club di `EMERGING_MARKET_COUNTRIES`" (o il contrario sotto soglia).
- **Perché rimandato:** la sessione si è conclusa con la feature verificata end-to-end a mano; scrivere il test è un follow-up naturale ma non bloccante, la logica è semplice e deterministica (un filtro diretto, non probabilistico).
- **Impatto:** rischio basso — un eventuale refactor futuro di `targetPrestige`/`eligibleClubs` potrebbe silenziosamente rompere la soglia senza che nessun test lo segnali, richiedendo di nuovo una verifica manuale nel browser per accorgersene.
- **Risoluzione suggerita:** aggiungere in `decisions.test.ts` un test che chiami `generateTransferWindow`/`generateEndOfCycle` (o esponga `eligibleClubs` per il test) con un player OVR 84+ e assert che nessuna opzione abbia `club.country` in `EMERGING_MARKET_COUNTRIES`, più un test simmetrico sotto soglia che confermi che restano eleggibili.

### Cambio ruolo funzionale (position-change) non osservato dal vivo nel browser
- **Priorità:** Bassa
- **Area:** `src/lib/career/decisions.ts` (`generatePositionChangeDecision`), `src/lib/career/engine.ts` (`changePosition`)
- **Data:** 2026-08-10
- **Descrizione:** durante il playtest della sessione "Potenziale + Attributi + PlayStyles" (vedi
  [[decisions]]) sono state osservate dal vivo tutte le altre meccaniche nuove (potenziale, focus
  di allenamento, sblocco PlayStyle, declino attributi da veterano), ma non la decisione di
  cambio ruolo (categoria `"position-change"`, peso base 8 su ~13 categorie — non innescata nella
  singola carriera giocata). Coperta da test unitari (`decisions.test.ts`/`loop.test.ts`) ma mai
  vista renderizzata in UI con un vero cambio di `player.position` osservato in game.
- **Perché rimandato:** RNG-gated come altri eventi minori; la sessione si è chiusa dopo una
  copertura già ampia delle altre meccaniche.
- **Impatto:** rischio basso — la logica è semplice (mappa di adiacenza statica + un campo
  assegnato), ma un bug di rendering (es. le opzioni con `newPosition` che non mostrano il
  ruolo target in modo leggibile) sarebbe visibile solo giocando abbastanza a lungo.
- **Risoluzione suggerita:** in un futuro giro di playtest, giocare finché non compare "Cambio di
  ruolo" e verificare che `player.position` cambi davvero e che il cartellino/pannello attributi
  si aggiornino di conseguenza (nuovi pesi di ruolo, nuova posizione mostrata).

### Raggiungibilità diretta di Shadow/scandalo e archetipi sotto l'obiettivo indicativo (vincolo di frequenza di tocco)
- **Priorità:** Bassa
- **Area:** `lib/career/shadow.ts`, `lib/career/traits.ts`, `lib/career/decisions.ts`, `lib/career/loop.ts`
- **Data:** 2026-08-10
- **Descrizione:** durante il bilanciamento generale (vedi [[decisions]]), un giocatore che sceglie
  sempre le opzioni rischiose raggiunge lo scandalo solo nel ~20% delle carriere (uniforme ~7-8%),
  e un giocatore che persegue sempre un singolo tratto di personalità raggiunge il relativo
  archetipo nel 13-22% delle carriere (uniforme 1-9%) — entrambi sotto l'obiettivo indicativo
  iniziale (≥60-70%). Causa diagnosticata con l'harness: sotto ~11 cicli/carriera, un giocatore
  incontra in media solo ~1 scelta "rilevante" per queste meccaniche (le categorie club-crisis/
  lifestyle/narrative sono già rare di per sé, e solo una minoranza dei loro sotto-generatori le
  tocca) — alzare le magnitudini o abbassare le soglie sposta la popolazione "pulita" e quella
  "diretta" quasi proporzionalmente insieme, il rapporto di separazione satura empiricamente
  attorno a ~2.5-3x indipendentemente da quanto si spinga sui numeri.
- **Perché rimandato:** rompere il vincolo richiederebbe alzare la *frequenza* con cui le
  categorie/sotto-generatori rilevanti compaiono — deliberatamente fuori scope nella sessione di
  bilanciamento 2026-08-10, che ha già toccato i pesi di categoria in Fase 7 concludendo che
  nessuno scarto attuale-vs-nominale era ingiustificabile con i dati raccolti.
- **Impatto:** basso — entrambe le meccaniche sono comunque passate da "sostanzialmente morte"
  (0% scandali, `problem` 0.0%) a "chiaramente più raggiungibili per chi gioca in quella
  direzione", un miglioramento reale anche se non al livello dell'obiettivo indicativo iniziale.
- **Risoluzione suggerita:** se in futuro si vuole una separazione più netta, alzare la frequenza
  con cui club-crisis/lifestyle/narrative (o i loro sotto-generatori shadow/tratto-rilevanti)
  compaiono, misurando con `npm run simulate` prima/dopo (i picker diretti già esistono in
  `simulation.ts`: `pickRiskSeekingOption`/`makeTraitDirectedPicker`, e i blocchi harness dedicati
  in `scripts/simulate-careers.ts`).

### Avviso "App non verificata" di Honor su ogni installazione sideload
- **Priorità:** Bassa
- **Area:** distribuzione APK (`dist/MyRoad.apk`, GitHub Release)
- **Data:** 2026-08-11
- **Descrizione:** ogni installazione (manuale o tramite `UpdateChecker`) mostra la schermata di
  sicurezza Honor/MagicOS "Questa app non è disponibile nell'App Market e non è stata verificata
  da Honor" con un checkbox di conferma rischio da spuntare prima di poter installare. **Non è
  legato alla firma/certificato** (quello è già risolto, vedi [[decisions]]) — è un livello di
  sicurezza OEM separato che compare per qualunque APK installato fuori dal proprio App Market,
  indipendentemente da come è firmato. Non compare installando via `adb install` (solo nel flusso
  file scaricato/aperto direttamente sul dispositivo, cioè esattamente il flusso di un tester).
- **Perché rimandato:** l'unico modo per rimuoverlo davvero è pubblicare l'app su uno store
  ufficiale (Honor AppGallery, Google Play, ecc.) — richiede account sviluppatore, processo di
  revisione, mantenimento continuo della scheda store: uno scope enormemente più grande di quanto
  fatto finora per un gioco hobbistico distribuito a pochi tester. L'utente ha scelto di lasciarlo
  così com'è per ora (un singolo tap "sono consapevole dei rischi" alla prima installazione).
- **Impatto:** minimo — friction una tantum per il tester alla prima installazione, standard per
  qualunque distribuzione APK fuori da uno store ufficiale (non specifico di questo progetto).
- **Risoluzione suggerita:** nessuna azione a meno che non si decida in futuro di pubblicare
  l'app su uno store ufficiale.

## Priorità
- **Alta:** —
- **Media:** — (tutti gli item precedentemente in questa fascia chiusi in blocco il 2026-08-11 su decisione utente, vedi nota in cima al file)
- **Bassa:** — (idem)

## Archiviato
- **Convocazione in nazionale salita da ~25% a ~37% come effetto collaterale della Fase 5 (soglie PlayStyle)** — risolto 2026-08-12: nella sessione di confronto plausibilità gioco-vs-realtà (vedi [[decisions]]), `TARGETMAN_CALLUP_BONUS` in `playstyles.ts` dimezzato prima a 0.04 (misurato 31.8%, ancora leggermente sopra la fascia target 20-30%) poi affinato a 0.03, misurato **28.4%** con `npm run simulate` — dentro la fascia 20-30% e vicino al ~25-28% tarato deliberatamente prima della deriva. Trofeo di club (82.1%) e trofeo di nazionale (5.5%) invariati nella stessa run, a conferma che il fix è isolato alla sola convocazione. 399 test verdi, `tsc` pulito.
- **Trofeo di club forse troppo comune dopo la ricalibrazione OVR (~91%)** — risolto 2026-08-10: nella sessione di bilanciamento generale (vedi [[decisions]], "Bilanciamento su 7 fasi..."), `CLUB_TROPHY_PRESTIGE_WEIGHT` 0.08→0.03, `CLUB_TROPHY_OVR_DIVISOR` 200→350, `CLUB_TROPHY_OVR_BONUS_CAP` 0.15→0.08, `CLUB_TROPHY_CHANCE_CAP` 0.5→0.3 — "almeno 1 trofeo di club" da 94.8%/94.1% a 84.4%, dentro la fascia 75-85% richiesta esplicitamente dall'utente in questo giro (non più "fuori scope").
- **Overlay trofeo+badge (TrophyImage) non verificato dal vivo con un vero evento di vittoria** — risolto 2026-08-10: 2 agenti browser paralleli hanno giocato carriere reali fino a vincere un vero trofeo di club (Copa del Rey e La Liga con il Valencia/Málaga, 3 vittorie osservate in totale su 2 carriere indipendenti). Layout `flex items-end justify-center gap-3` (trofeo 104px + badge 44px) confermato pulito in tutte e 3 le istanze: nessuna immagine rotta, bottom-alignment corretto, proporzioni naturali (trofeo elemento dominante, badge companion), nessuna distorsione nonostante dimensioni native diverse tra competizioni (256×256 vs 512×512, entrambe quadrate). URL reali verificati via DOM: tutte le immagini `complete: true`. Non ancora osservato in questo giro: overlay premio individuale o convocazione in nazionale (entrambi RNG-gated più rari) — se emerge un problema specifico a quelle varianti andrà riaperta una voce dedicata, ma il rischio principale (layout badge+trofeo mai visto) è chiuso.
- **Finestra di ritiro probabilistico forse più ampia di 34-40** — risolto 2026-08-06: `RETIREMENT_RISK_START_AGE` in `engine.ts` abbassata da 34 a 31, formula passata da quadratica a cubica dopo aver verificato con `npm run simulate` che il solo allargamento con esponente invariato spostava troppo peso verso i ritiri anticipati (auto-cap a 40 anni sceso dal 49.5% al 22.2%, contro un ~50% osservato nella ricerca). Con la cubica l'auto-cap torna al 43.8%, con solo una coda minoritaria di ritiri a 32-34 anni (3.5%+0.1%). Vedi [[decisions]] per il dettaglio numerico completo.
- **Retry automatico del download update (v0.3.4) non riverificato con un aggiornamento reale** — risolto 2026-08-06: verificato in diretta nella stessa sessione ispezionando `%TEMP%\CarrieraUpdate\update-log.txt` e campionando la crescita di `Carriera.new.exe` ogni 2s mentre l'utente eseguiva un update reale. I primi due tentativi erano stati interrotti dall'utente stesso (chiusura manuale pensando fosse bloccato, non un fallimento del retry — mancava un indicatore di caricamento, vedi sotto); il terzo è arrivato in fondo al primo giro di retry, script di sostituzione e riavvio completati con successo. Aggiunto anche un indicatore di caricamento (vedi voce sotto) per evitare che l'assenza di feedback porti a chiusure premature come queste.
- **Assenza di feedback visivo durante il download dell'update** — risolto 2026-08-06 (v0.3.4→prossima release): causa diretta dell'item sopra — nuovo `UpdateProgressForm.cs`, finestra non modale con percentuale/MB/numero tentativo in tempo reale, `MainForm` disabilitato per la durata dell'update. Due iterazioni su feedback dell'utente: menu non più cliccabile durante l'update, finestra ingrandita e centrata sullo schermo. Vedi [[decisions]].
- **Auto-updater del launcher non funzionava (v0.3.1/v0.3.2)** — risolto 2026-08-06 dopo segnalazione diretta dell'utente ("spunta l'alert ma anche confermando si avvia la vecchia versione, nemmeno riavviandolo"). Diagnosi in due tempi: (1) `UpdateInstaller.cs` generava uno script `.bat` con un `move /y` senza retry/log — fix v0.3.1 (retry ~15s + log in `%TEMP%\CarrieraUpdate\update-log.txt`); (2) causa reale trovata ispezionando il log della macchina dell'utente: un download da ~58 MB troncato a ~4.9 MB senza eccezione lato .NET — la CDN dei release GitHub parla HTTP/2 e `HttpClient` lo negoziava, con lo stream interrotto a metà su questa configurazione di rete. Fix v0.3.2: download forzato su HTTP/1.1 (`HttpVersion.Version11` + `RequestVersionExact`), controllo integrità confrontato col `Content-Length` dichiarato dal server invece della sola soglia minima. **Verificato dall'utente**: exe di test pinnato a v0.1.0, rilevato v0.3.2, scaricato e applicato con successo (FileVersion confermato 0.3.2.0 post-update). Vedi [[decisions]] per il dettaglio completo.
- **Evento "Grandfather from another country" (switch nazionalità) mai implementato** — risolto 2026-08-06: `isNationalitySwitchEligible`/`generateNationalitySwitch` in `decisions.ts`, `switchNationality` in `engine.ts`, eleggibile solo prima della prima convocazione (`!player.nationalTeam.called`, età 18-26) — scelta esplicita dell'utente che evita del tutto la domanda sulla retroattività di trofei/statistiche nazionali già accumulati, perché a quel punto non ce n'è ancora nessuno. `STORAGE_VERSION` 3→4 con migrazione. Vedi [[decisions]] per il ragionamento completo.
- **Possibile assenza di finestra anti-ripetizione per eventi lifestyle/club-crisis** — risolto 2026-08-06: nuova anti-ripetizione a livello di singolo evento (`LoopContext.recentDecisionIds?`, penalità di peso invece di esclusione, stesso principio di `recentCategories`/`REPEAT_PENALTY` già esistente a livello di categoria) in `loop.ts`, wired in `pickClubCrisisDecision`/`pickStaticDecision`/`pickNarrativeDecision`. Test statistico dedicato in `loop.test.ts` con PRNG seedato. Vedi [[decisions]].
- **Champions League ed Europa League non distinte** — risolto 2026-08-05: i club UEFA di tier 1 assegnano "Champions League" se prestige ≥2, "Europa League" altrimenti (`continentalCompetition` in `data/clubs.ts`), badge Europa League aggiunto in `data/competition-badges.ts`. Test dedicato in `clubs.test.ts`.
- **Copertura club/campionati limitata a 4 paesi** — risolto 2026-08-05: estesi `data/clubs.ts`/`leagues` con Portogallo (Primeira Liga), Francia (Ligue 1), Germania (Bundesliga), Paesi Bassi (Eredivisie), Argentina (Liga Profesional) — 40 nuovi club reali con crest TheSportsDB verificati, 84→124 totali. Badge campionato/coppa nazionale aggiunti in `competition-badges.ts`. Verificato con test dedicato che `generateAcademyOffer`/`isReturnHomeEligible` funzionino per un giocatore portoghese (prima ripiegavano su club italiani/spagnoli per mancanza di dati).
- **Statistiche portiere non differenziate** — risolto 2026-08-06: estensione additiva di `StatLine` (`goalsAgainst?`/`cleanSheets?`, valorizzati solo per `Position === "GK"`), formule dedicate in `progression.ts` (`projectGoalkeeperExtras`), propagate in `engine.ts`/`summary.ts` (`sumStats`), `wallet.ts` (`popularityDeltaForCycle` conta i clean sheet come prestazione), `satisfaction.ts` (nuovo titolo di stagione "Muro invalicabile"/`ironWall`, record `bestSeasonCleanSheets`), UI in `PlayerCard`/`CareerTable`/`CareerSummary` (branch su `player.position === "GK"`). Vedi [[decisions]] per il ragionamento sull'approccio additivo invece di un discriminated union.
- **Card di decisione probabilistica senza percentuali visibili** — risolto 2026-08-06: nuovo `favorableOutcomeWeight()` in `lib/career/decisions.ts` mostra il peso reale dell'outcome più favorevole di un'opzione (quando ce n'è più di uno) accanto all'`hint` testuale, in `DecisionPanel`/`OfferPanel` (generalizza il pattern già introdotto in `PenaltyShootout.tsx`, commit f509fc1). Vedi [[decisions]] per l'euristica di scelta dell'outcome "favorevole". **Nota 2026-08-06 (corretta lo stesso giorno):** un primo playtest dal vivo aveva concluso che l'originale non mostra MAI percentuali sulle card decisione — conclusione **smentita** da una ricerca più ampia (23 carriere, 3 agenti browser paralleli, stesso giorno): le percentuali compaiono sistematicamente sugli eventi di categoria lifestyle/allenamento a esito probabilistico (es. "Train hard": Starter 65%/Injury 35%; "Mysterious substance": +5 OVR 75%/Suspension 25%; "Nutrition plan": +3 OVR 60%/-2 OVR 40%), e restano assenti solo su bivi deterministici o su offerte di trasferimento/academy/prestito. La nostra scelta di mostrare `favorableOutcomeWeight()` su ogni opzione con 2+ outcome resta quindi **più uniforme** dell'originale (che le mostra solo per una sottocategoria di eventi), non una divergenza rispetto a un originale che non le mostra mai — vedi [[decisions]] e il piano esterno, sezione "Esplorazione aggiuntiva 5", per il dettaglio completo.
- **Eventi narrativi mancanti rispetto all'originale** — risolto 2026-08-06: 6 nuovi generatori in `decisions.ts` — "Club priority"/"Controversial post" (categoria `club-crisis`, `pickClubCrisisDecision` ora filtra per eleggibilità), "Unexpected prospect"/"Triumphant return" (categoria `narrative`, età-gated), "Finish high school" (pool `lifestyle`, unico evento con gate d'età tramite `pickStaticDecision`)/"Honesty test" (pool `lifestyle`, nessun gate). Test dedicati in `decisions.test.ts`/`loop.test.ts`.
- **Probabilità di trofei/award/nazionale nel nostro clone non validate con playtest** — risolto 2026-08-06 dopo segnalazione diretta dell'utente ("OVR quasi mai sopra 80, mai in nazionale, mai vinto un trofeo"): curva OVR ricalibrata + soglie di `nationalCallupChance`/`nationalTournamentWinChance`/`awardChance`/`targetPrestige` ritarate in 2-3 giri di misurazione con `npm run simulate` (non a tavolino). Risultato: convocazione 1.5%→~22%, trofeo nazionale 0.1%→~5%, award 0%→~7% (Ballon d'Or ~0.3%, resta il più raro). Vedi [[decisions]] per il dettaglio completo dei numeri e del ragionamento. Effetto collaterale non richiesto (trofeo di club salito a ~91%) registrato come nuovo item separato sopra, a priorità bassa.
