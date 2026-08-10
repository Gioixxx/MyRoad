---
type: backlog
tags: [memory, backlog]
updated: [2026-08-10]
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

### Build Android release firmata + canale di distribuzione
- **Priorità:** Media
- **Tipo:** Feature
- **Area:** `android/`, packaging
- **Descrizione:** oggi esiste solo l'APK di debug (non firmato, generato con `assembleDebug`) usato per il primo test su tablet — vedi [[decisions]]. Serve decidere: generare un keystore per una build `assembleRelease` firmata (necessario per aggiornare l'app nel tempo senza disinstallare — Android rifiuta un update con firma diversa), e se distribuirla via GitHub Release come `dist/MyRoad.exe` (nessun auto-updater equivalente pronto, l'utente dovrebbe reinstallare a mano ad ogni versione) oppure valutare altro canale.
- **Criteri accettazione:** keystore generato e conservato in modo sicuro (mai committato), build `assembleRelease` firmata funzionante, un APK allegato a una GitHub Release come per l'exe.
- **Stima:** Piccola-media — la parte tecnica (gradle signing config) è breve, il grosso è decidere e documentare il processo di conservazione del keystore.

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

## Priorità
- **Alta:** —
- **Media:** pool offerte/eventi filtrati per archetipo/shadow; relazioni NPC persistenti (§2, vedi sopra)
- **Bassa:** promozione/retrocessione estesa oltre i 4 paesi attuali; trofeo continentale di club assegnabile offscreen; nuovo evento "Sostanza misteriosa" (doping); nuovo evento "Fan backlash" (da ricercare); club per Arabia Saudita e Qatar (completare l'espansione mondo); ritiro forzato/squalifica multi-ciclo a shadow≥90 (vedi sopra)

## Archiviato
- **Icone trofeo/premio inline sulla riga della tabella carriera** — già implementata (non un nuovo item): osservata nell'originale durante un playtest dal vivo il 2026-08-06 e inizialmente registrata per errore come backlog aperto, senza verificare lo stato attuale del codice. `CareerTable.tsx` (`TrophyChip`/`AwardChip`, righe 12-36) mostra già icone trofeo/premio per riga, aggregate per `stint.ageTo` — introdotto nel commit `28d5b6f` (2026-08-06) ma non documentato esplicitamente all'epoca (stesso pattern già visto con "Momenti di carriera celebrativi", vedi [[decisions]]). Corretto durante la verifica pre-implementazione di questo stesso item.
- **Packaging come eseguibile .exe** — implementato 2026-08-05: launcher .NET/WebView2 (`launcher/CarrieraLauncher/`), committato come `dist/Carriera.exe`. Vedi [[decisions]] per la scelta tecnica e `launcher/README.md` per come rigenerarlo.
- **Integrazione stemmi club/competizioni e immagini premi via hotlink** — implementato 2026-08-05: `crestUrl` su ogni `Club` (84/84, TheSportsDB), `COMPETITION_BADGES` per campionati/coppe/coppe continentali/Mondiale/Europei, icona generica (Twemoji) per i 3 `AwardType` individuali — vedi [[decisions]] per il ragionamento sulla distinzione trademark club-vs-award.
- **Nomi reali confederazione-specifici per i trofei di nazionale** — implementato 2026-08-06: nuovo campo `confederation` su `Country` (`data/countries.ts`, `getCountry()`), `rollNationalTrophy` sceglie tra "Mondiale" e il torneo di confederazione corretto (Europei/Copa América/AFC Asian Cup/Africa Cup of Nations/CONCACAF Gold Cup), 4 nuovi badge in `competition-badges.ts` con gli URL TheSportsDB già ricercati. Vedi [[decisions]].
