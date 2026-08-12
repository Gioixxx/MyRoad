---
type: backlog
tags: [memory, backlog]
updated: [2026-08-12]
---

# Backlog
Funzionalità e idee a lungo termine. Prioritizzato pre-sprint → confluisce in [[sprint]].

## Template
### [Titolo breve]
- **Priorità:** Alta / Media / Bassa
- **Tipo:** Feature / Miglioramento / Refactor / Bug
- **Area:** [modulo/dominio]
- **Descrizione:** [valore atteso]
- **Criteri accettazione:** [come capire che è fatto]
- **Stima:** Piccola / Media / Grande

---

### Alleggerimento informazioni mobile (solo visualizzazione mobile)
- **Priorità:** Media
- **Tipo:** Miglioramento
- **Area:** UI mobile, componenti in `src/components/features/career/` (viewport <lg)
- **Descrizione:** su richiesta esplicita dell'utente (2026-08-12), semplificare/alleggerire le
  informazioni mostrate **solo sotto il breakpoint mobile** per renderle più chiare e meno dense
  — il layout desktop resta invariato. Nessun dettaglio implementativo ancora deciso (quali
  schermate/quali informazioni tagliare o raggruppare), solo la direzione generale registrata.
  Utile leggere prima [[conventions]] per la tecnica di test mobile in questo ambiente (iframe
  390×844 iniettato) e [[tech-debt]] per il pattern `min-h-0` ricorrente sugli stessi componenti.
- **Criteri accettazione:** da definire in una sessione dedicata con l'utente, prima di scegliere
  quali schermate/informazioni toccare.
- **Stima:** da definire.

### Tre carriere giocabili: calciatore → allenatore → presidente
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** nuovo dominio "carriera multi-ruolo" — richiede probabilmente nuovi tipi (`CareerRole`),
  nuovo motore per allenatore/presidente distinto da `lib/career/engine.ts` attuale (calciatore)
- **Descrizione:** idea di gioco grande proposta dall'utente il 2026-08-12, **da approfondire in
  una sessione dedicata prima di qualunque implementazione** (richiesta esplicita dell'utente di
  non progettare a fondo la meccanica ora). Due componenti:
  1. Scelta del tipo di carriera all'inizio del gioco — oggi solo "calciatore", da affiancare con
     "allenatore" e "presidente" come percorsi alternativi completi.
  2. **Continuità narrativa**: possibilità di continuare la stessa "storia" dopo il ritiro da
     calciatore passando ad allenatore, e poi da allenatore a presidente — non 3 modalità
     indipendenti scollegate, ma una progressione naturale sulla stessa carriera.
  Per il ruolo presidente: le finanze personali accumulate nelle carriere precedenti (calciatore/
  allenatore) finanziano l'acquisto e il mantenimento del club — non un budget societario separato
  o infinito, deve attingere dal patrimonio (`Player.savingsEur`-style) già accumulato. Distinta
  dall'idea di backlog già esistente "Rete Scouting/Vivaio... (gestione rosa/club)" (vedi sopra):
  quella riguardava solo funzionalità aggiuntive per il calciatore (osservatori, staff come
  mentore), questa è un intero nuovo ruolo/modalità di gioco con un proprio ciclo.
- **Criteri accettazione:** da definire — il primo passo è la sessione di approfondimento sulla
  meccanica richiesta esplicitamente dall'utente, non ancora fatta.
- **Stima:** Grande — nuovo dominio di gioco, probabilmente il progetto più grande mai affrontato
  su questo repo.

### Rete Scouting/Vivaio e Visione Tattica/Staff Tecnico (gestione rosa/club)
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** nuovo dominio "club management" (rosa, budget societario) — inesistente oggi
- **Descrizione:** 2 delle 6 meccaniche proposte dall'utente il 2026-08-10 (vedi [[decisions]]),
  esplicitamente escluse dal piano "Potenziale + Attributi + PlayStyles" perché presuppongono la
  gestione di un'intera rosa (altri giocatori come entità, budget di club separato dal
  patrimonio personale, staff assumibile) — un sottosistema completamente estraneo al gioco
  attuale (segui un solo calciatore). Se mai ripresa, l'utente ha indicato una possibile
  reinterpretazione "leggera" single-player: osservatori come evento narrativo che ti nota/ti
  procura offerte migliori, staff come mentore personale che accelera la TUA crescita — non
  gestione di altri giocatori.
- **Criteri accettazione:** da definire — richiede prima una decisione esplicita con l'utente su
  quale delle due letture perseguire (leggera single-player vs vera gestione rosa/club, quest'ultima
  un progetto enorme multi-sessione con nuovo modello dati).
- **Stima:** Grande (gestione rosa vera) o Media (reinterpretazione leggera) — dipende dalla scelta.

### Match Sharpness / gestione della forma (esclusa, granularità incompatibile)
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `lib/career/loop.ts` (il gioco procede a cicli di 1-3 stagioni, non a giorni)
- **Descrizione:** meccanica "bilanciamento quotidiano allenamento/riposo" proposta dall'utente
  il 2026-08-10, esclusa esplicitamente (vedi [[decisions]]) perché la granularità richiesta
  (giornaliera) non si adatta alla struttura attuale del gioco. Se mai ripresa, andrebbe adattata
  al ciclo esistente: una scelta "allenamento intenso vs gestione carichi" per ciclo, con
  bonus/rischio temporaneo — stesso pattern già usato per gli infortuni (`turnsRemaining` + tick).
- **Criteri accettazione:** da definire in una sessione dedicata, se l'utente decide di riprenderla.
- **Stima:** Piccola-media, riusando il pattern `Injury` esistente.

---

### Promozione/retrocessione estesa oltre i 4 paesi multi-tier attuali
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `data/clubs.ts`, `lib/career/club-progression.ts`
- **Descrizione:** la meccanica di promozione/retrocessione (2026-08-06, vedi [[decisions]]) è già generica (`leagueForTier`, no-op silenzioso se manca il tier), ma solo Italia/Inghilterra/Spagna/Brasile hanno più di un livello di campionato modellato in `data/clubs.ts` — gli altri 6 paesi non possono mai retrocedere/promuovere. Servirebbe nuovo dato campionati/club (secondo livello + crest verificati) per i restanti paesi.
- **Criteri accettazione:** almeno un secondo tier con crest verificati per uno o più dei paesi attualmente a tier singolo, verificato con un test dedicato che il club possa effettivamente muoversi di categoria.
- **Stima:** Media (ricerca crest + dati campionato, nessuna nuova logica di dominio).

### Trofeo di club continentale assegnabile anche "offscreen"
- **Priorità:** Bassa
- **Tipo:** Miglioramento
- **Area:** `lib/career/trophies.ts` (`rollClubTrophies`), `lib/career/loop.ts`
- **Descrizione:** oggi Champions/Europa League/Copa Libertadores si vincono solo tramite l'evento "finale continentale" (mini-gioco del rigore, 15% di probabilità per ciclo sopra OVR 78). Il piano di ricerca esterno sul gioco originale suggerisce che nell'originale il trofeo continentale di club può capitare anche senza passare dal mini-gioco esplicito. Non implementato in questa sessione (focus sui trofei di nazionale, vedi [[decisions]] "Mondiale e coppa continentale indipendenti").
- **Criteri accettazione:** `rollClubTrophies` (o una funzione dedicata) può assegnare il trofeo continentale senza richiedere che sia scattato l'evento "finale continentale" nello stesso ciclo, con probabilità coerente col resto del sistema.
- **Stima:** Piccola — riuso di `clubTrophyChance`-style formula, nessun nuovo modello dati.

### Nuovo evento lifestyle: "Sostanza misteriosa" (doping)
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `lib/career/decisions.ts` (`LIFESTYLE_DECISIONS`)
- **Descrizione:** evento osservato nell'originale ("Esplorazione aggiuntiva 5", 2026-08-06) e verificato assente nel clone: "Il medico del club offre un integratore di dubbia origine" → "Prendilo" (+5 OVR 75% / squalifica 25%) vs "Rifiuta" (nessun cambiamento). Stesso pattern già usato per `nutrition-plan`/`giant-tattoo` (opzione rischiosa con outcome pesati + opzione sicura deterministica).
- **Criteri accettazione:** nuovo generatore in `LIFESTYLE_DECISIONS` con le stesse proporzioni osservate (75%/25%), copy in italiano, test dedicato in `decisions.test.ts`.
- **Stima:** Piccola — stesso pattern di eventi lifestyle già esistenti, nessuna nuova infrastruttura.

### Nuovo evento: "Fan backlash" (contraccolpo dei tifosi)
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `lib/career/decisions.ts`
- **Descrizione:** evento nominato ma non ancora documentato in dettaglio da "Esplorazione aggiuntiva 5" (testo esatto delle opzioni non catturato in questa sessione di ricerca) — verificato assente nel clone sotto qualunque nome.
- **Criteri accettazione:** prima ricercare il testo esatto/le opzioni sul sito originale, poi implementare con lo stesso pattern degli altri generatori di categoria club-crisis/lifestyle.
- **Stima:** Piccola, ma richiede prima un giro di ricerca dedicato (testo non ancora noto).

### Club per Arabia Saudita e Qatar (completare l'espansione mondo AFC)
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `data/clubs.ts`, `.claude/research/team-crests.md`
- **Descrizione:** l'espansione mondo del 2026-08-06 (vedi [[decisions]]) ha coperto 12 dei 14 paesi originariamente pianificati — Arabia Saudita e Qatar sono stati interrotti su richiesta esplicita dell'utente a metà ricerca. Stato lasciato dalla ricerca (non trascritto in `clubs.ts`, solo nel transcript di sessione): Arabia Saudita aveva 4/8 club verificati ma mancavano proprio i big (Al-Hilal/Al-Ittihad/Al-Ahli/Al-Shabab, gli slot di prestige 3/2, serve una query disambiguata per "Al-Ittihad" che altrimenti matcha un club libico omonimo); Qatar aveva 7/8 club trovati via API ma **nessun crestUrl verificato live** (solo letto dal JSON, mai richiesto direttamente) e mancava "Al Arabi".
- **Criteri accettazione:** 8 club reali per ciascun paese con `crestUrl` verificato HTTP 200 individualmente (mai il payload JSON da solo), prestige 3/3/2/2/1/1/0/0, lega/coppa nazionale (Saudi Pro League/Saudi King Cup idLeague 4668/5649, Qatar Stars League/Emir of Qatar Cup idLeague 4663/4971 — già confermati, badge non ancora fetchati) aggiunte a `leagues`/`competition-badges.ts`.
- **Stima:** Piccola — stesso pattern già usato per gli altri 12 paesi, serve solo completare la ricerca crest interrotta.

### Pool di offerte/eventi filtrati per archetipo/shadow (parte "lettura" di §1/§3)
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** `lib/career/decisions.ts`, `lib/career/loop.ts`
- **Descrizione:** la sessione Traits/archetipo + Shadow (2026-08-06, vedi [[decisions]]) ha implementato solo la parte "scrittura" (scelte → delta → archetipo/shadow) e un moltiplicatore su formule già esistenti (award/callup) — deliberatamente esclusa la parte "lettura": un giocatore "Bandiera" che vede meno offerte di trasferimento "mercenarie", un "Mercenario" che vede offerte più ricche/meno club-progetto, sponsor "discutibili" più facili con shadow in fascia rumor (25-49). Nessuna decisione oggi legge lo stato comportamentale per pesare *quali* opzioni/offerte vengono generate — sarebbe la prima istanza di questo pattern nel codice.
- **Criteri accettazione:** almeno un pool di offerte (es. `generateTransferWindow`) pesato per archetipo dominante, verificato con l'harness (`npm run simulate`, estendendo la `pickOption` per perseguire deliberatamente un archetipo) prima di fissare qualunque peso — stesso standard già usato per OVR/award.
- **Stima:** Media — richiede prima di misurare la reachability reale di un archetipo con una `pickOption` non uniforme (vedi [[tech-debt]]), poi introdurre la prima istanza di generazione pesata da stato comportamentale.

### Relazioni NPC persistenti (§2 del documento archetipo/shadow)
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** nuovo `lib/career/relations.ts`, `types/career.ts`, `lib/career/loop.ts`, `lib/career/decisions.ts`
- **Descrizione:** terza meccanica proposta dall'utente insieme a Traits/archetipo (§1) e Shadow (§3), esplicitamente rimandata a una sessione dedicata — 3-4 relazioni leggere (allenatore/agente/rivale/mentore), ognuna un'identità stabile generata una volta + un intero −2…+2 di affinità, con eventi condizionati (es. "il mister ti chiede di cambiare ruolo", "il tuo agente propone un deal grigio" — quest'ultimo un ponte naturale verso `shadowDelta`, già esistente). L'utente stesso l'ha messa per ultima nell'ordine di implementazione ("dopo che i delta esistono").
- **Criteri accettazione:** vedi la proposta completa dell'utente in questa sessione (2026-08-06) per il modello dati (`Relation`/`RelationId`), gli eventi esempio e le regole anti-scope-creep ("max 4 relazioni", "coach si resetta al transfer", "rival nasce solo se OVR ≥ club median o dopo N cicli").
- **Stima:** Media-grande — il modello dati è piccolo, il contenuto (copy per 4 relazioni × più eventi ciascuna) è il costo reale, per stima dell'utente stesso.

### Ritiro forzato/squalifica multi-ciclo a shadow≥90
- **Priorità:** Bassa
- **Tipo:** Feature
- **Area:** `lib/career/engine.ts` (`checkRetirement`), `lib/career/shadow.ts`
- **Descrizione:** ultima riga della tabella soglie shadow proposta dall'utente (§3): sopra 90, ritiro forzato raro oppure squalifica multi-ciclo (come un `Injury` ma di tipo "sospensione"). Deliberatamente escluso dalla sessione 2026-08-06 — il pezzo più raro e rischioso da bilanciare del sistema shadow, sproporzionato rispetto all'effort "piccola-media" stimato dall'utente per il resto.
- **Criteri accettazione:** con l'harness esteso già in `simulation.ts` (bucket shadow 90+), misurare quanto è raggiungibile shadow≥90 prima di implementare l'effetto — probabilmente richiede prima di alzare la frequenza degli eventi shadow-positivi, dato che a shadow-tuning invariato la fascia 90+ risulta già ~0% su 2000 carriere casuali.
- **Stima:** Piccola una volta misurata la reachability — riuso diretto del pattern `Injury`/`tickInjury` già esistente per una sospensione multi-ciclo.

### Crescita non lineare estesa (stalli/esplosioni imprevedibili, declino precoce da sovraccarico)
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** `lib/career/potential.ts`, `lib/career/progression.ts`
- **Descrizione:** una delle 7 dinamiche "carriera realistica" proposte dall'utente il 2026-08-12
  (vedi [[decisions]], "Fit tattico + Contratti/agenti"), rimandata su richiesta esplicita.
  `potential.ts` copre già in parte questa dinamica (tetto OVR individuale con cicli "breakout"),
  ma la curva base (`progression.ts`, `GROWTH_STAGES`) resta deterministica per fascia d'età —
  nessuno stallo prolungato realmente imprevedibile (oltre al breakout esistente) né declino
  precoce collegato a un "sovraccarico" nei primi anni (es. troppi cicli consecutivi ad alta
  intensità/prestito da giovane).
- **Criteri accettazione:** da definire in una sessione dedicata — probabile estensione del
  sistema breakout esistente con un evento simmetrico di "stallo"/infortunio da sovraccarico
  giovanile, misurata con `npm run simulate` prima/dopo per non alterare la curva OVR già tarata.
- **Stima:** Media — tocca una formula già calibrata più volte in passato (vedi le sessioni di
  ricalibrazione OVR in [[decisions-archive]]), richiede lo stesso standard di verifica.

### Declino fisico → riconversione di ruolo age-based (non più solo RNG generico)
- **Priorità:** Media
- **Tipo:** Miglioramento
- **Area:** `lib/career/decisions.ts` (`generatePositionChangeDecision`), `lib/career/attributes.ts`
- **Descrizione:** stessa sessione 2026-08-12 di cui sopra. Il cambio di ruolo funzionale esiste
  già (categoria `"position-change"`, peso base 8), ma è un evento puramente casuale — non
  innescato dal reale declino degli attributi fisici (pace/physical) in età avanzata, a differenza
  della dinamica reale descritta dall'utente (un'ala che perde passo si reinventa trequartista o
  regista proprio *perché* il fisico cala, non a caso).
- **Criteri accettazione:** da definire — probabile nuovo trigger (o eleggibilità aggiuntiva)
  legato a un calo misurabile di pace/physical rispetto al picco della carriera, con
  suggerimenti di ruolo target coerenti (es. ala→trequartista, non ala→difensore).
- **Stima:** Piccola-media — riusa `POSITION_CHANGE_ADJACENCY` e `changePosition` già esistenti,
  serve solo la nuova logica di eleggibilità/trigger.

### Resilienza mentale/pressione come asse che modula le prestazioni reali
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** nuovo, distinto da `lib/career/traits.ts`/`shadow.ts`
- **Descrizione:** stessa sessione 2026-08-12 di cui sopra. `traits.ts`/`shadow.ts` coprono
  personalità/archetipo e debito morale/rischio scandalo, ma nessuno dei due modula mai le
  prestazioni in campo in base a fiducia/pressione mediatica/rapporto coi tifosi/gestione della
  panchina — la dinamica reale descritta dall'utente è distinta da entrambi: una "tenuta
  psicologica" che può far calare temporaneamente il rendimento sotto pressione (media negativi,
  panchina, fischi) o al contrario dare una spinta (fiducia, sostegno dell'ambiente).
- **Criteri accettazione:** da definire con l'utente — probabile nuovo stato temporaneo (mirror
  del pattern `Injury`, con `turnsRemaining`) che applica un moltiplicatore/malus/bonus alle
  proiezioni statistiche, innescato da eventi già esistenti (panchina, critiche, scandalo) invece
  di introdurre nuovi generatori da zero.
- **Stima:** Media-grande — è l'unica delle 3 dinamiche rimandate senza alcuna base di codice
  preesistente su cui appoggiarsi, richiede design da zero.

## Priorità
- **Alta:** —
- **Media:** alleggerimento informazioni mobile (vedi sopra); tre carriere calciatore→allenatore→presidente (vedi sopra, da approfondire prima di implementare); pool offerte/eventi filtrati per archetipo/shadow; relazioni NPC persistenti (§2, vedi sopra); crescita non lineare estesa; declino fisico→riconversione ruolo age-based; resilienza mentale/pressione (vedi sopra, 3 dinamiche dalla sessione 2026-08-12)
- **Bassa:** promozione/retrocessione estesa oltre i 4 paesi attuali; trofeo continentale di club assegnabile offscreen; nuovo evento "Sostanza misteriosa" (doping); nuovo evento "Fan backlash" (da ricercare); club per Arabia Saudita e Qatar (completare l'espansione mondo); ritiro forzato/squalifica multi-ciclo a shadow≥90 (vedi sopra); Rete Scouting/Vivaio + Staff Tecnico (gestione rosa/club, vedi sopra); Match Sharpness (esclusa per granularità, vedi sopra)

## Archiviato
- **Build Android release firmata + canale di distribuzione** — implementato 2026-08-11: keystore
  di firma generata (`keytool`, conservata fuori dal repo in `C:\Users\Gioix\keystores\myroad\`,
  mai committata), `android/app/build.gradle` legge `android/keystore.properties` (locale,
  gitignored) per firmare `assembleRelease`, `versionCode`/`versionName` ora derivati da
  `package.json` (stessa convenzione già usata per `dist/MyRoad.exe`). Nuovo
  `scripts/build-android.ps1` (mirror di `build-launcher.ps1`) genera `dist/MyRoad.apk` firmato,
  allegato alla GitHub Release come l'exe. In più, un vero controllo aggiornamenti in-app
  (`UpdateChecker.java`, chiamato da `MainActivity.onCreate`): confronta la versione installata
  con l'ultima release GitHub, propone download+installazione via il package installer di sistema
  (richiede il permesso `REQUEST_INSTALL_PACKAGES`, concesso una tantum dall'utente) — copre il
  caso "tester senza cavo/ADB" che ha motivato l'intero item. Vedi [[decisions]] per il dettaglio
  completo.
- **Icone trofeo/premio inline sulla riga della tabella carriera** — già implementata (non un nuovo item): osservata nell'originale durante un playtest dal vivo il 2026-08-06 e inizialmente registrata per errore come backlog aperto, senza verificare lo stato attuale del codice. `CareerTable.tsx` (`TrophyChip`/`AwardChip`, righe 12-36) mostra già icone trofeo/premio per riga, aggregate per `stint.ageTo` — introdotto nel commit `28d5b6f` (2026-08-06) ma non documentato esplicitamente all'epoca (stesso pattern già visto con "Momenti di carriera celebrativi", vedi [[decisions]]). Corretto durante la verifica pre-implementazione di questo stesso item.
- **Packaging come eseguibile .exe** — implementato 2026-08-05: launcher .NET/WebView2 (`launcher/CarrieraLauncher/`), committato come `dist/Carriera.exe`. Vedi [[decisions]] per la scelta tecnica e `launcher/README.md` per come rigenerarlo.
- **Integrazione stemmi club/competizioni e immagini premi via hotlink** — implementato 2026-08-05: `crestUrl` su ogni `Club` (84/84, TheSportsDB), `COMPETITION_BADGES` per campionati/coppe/coppe continentali/Mondiale/Europei, icona generica (Twemoji) per i 3 `AwardType` individuali — vedi [[decisions]] per il ragionamento sulla distinzione trademark club-vs-award.
- **Nomi reali confederazione-specifici per i trofei di nazionale** — implementato 2026-08-06: nuovo campo `confederation` su `Country` (`data/countries.ts`, `getCountry()`), `rollNationalTrophy` sceglie tra "Mondiale" e il torneo di confederazione corretto (Europei/Copa América/AFC Asian Cup/Africa Cup of Nations/CONCACAF Gold Cup), 4 nuovi badge in `competition-badges.ts` con gli URL TheSportsDB già ricercati. Vedi [[decisions]].
