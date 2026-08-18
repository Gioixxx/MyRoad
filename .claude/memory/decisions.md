---
type: decisions
tags: [memory, architecture]
updated: [2026-08-16]
---

# Decisioni Architetturali
Registro scelte tecniche con motivazioni.

> **Archiviazione 2026-08-12:** questo file aveva superato i 160KB (fuori dalla soglia di lettura
> diretta di 100KB del tool Read — errore concreto riscontrato, non solo un problema di token).
> Le decisioni dal 2026-08-04 al 2026-08-10 sono state spostate in **`decisions-archive.md`**
> ([[decisions-archive]], **non auto-caricato** — leggerlo on-demand con Grep/Read offset+limit
> quando serve contesto storico). Qui restano il template e le decisioni dal 2026-08-11 in poi.
> Quando questo file si riavvicina ai 100KB, ripetere lo stesso spostamento (le voci più vecchie
> in cima vanno in archivio, non cancellate).

## Template
### [Titolo breve]
- **Data:** [YYYY-MM-DD]
- **Decisione:** [scelta fatta]
- **Perché:** [motivazione e trade-off]
- **Alternative:** [scartate e perché]
- **Impatto:** [moduli coinvolti] — entità in [[domain]], se formalizzata vedi [[adr]]

---

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
  (stessa URL, redeploy). Nessuna release/bump di versione in questa sessione — poi inclusa nella
  v0.9.2 di una sessione parallela (vedi voce sotto), che ha rilasciato entrambe insieme.

### Correzione: overlay obiettivo "una volta sola" era per carriera, doveva essere per tipo
- **Data:** 2026-08-12
- **Decisione:** subito dopo il rilascio di v0.9.1 (overlay obiettivo mostrato una sola volta in
  assoluto per carriera, vedi voce precedente), l'utente ha corretto il requisito: "deve spuntare
  solo una volta per tipo di obiettivo", non una volta per l'intera carriera. Sostituito il flag
  globale `Player.objectiveMomentShown: boolean` con `Player.objectiveKindsCelebrated:
  CycleObjectiveKind[]` — ogni tipo di obiettivo (goals/apps/trophy/no-injury/callup/ovr-gain) ha
  la propria "prima volta" indipendente dagli altri. `objectiveResult.firstTime` in `loop.ts` ora
  controlla `!player.objectiveKindsCelebrated.includes(pendingObjective.kind)` invece del flag
  booleano. `STORAGE_VERSION` 9→10, `migratePlayerV9` (il vecchio flag non distingueva il tipo,
  riparte da lista vuota — chi ha già una carriera in corso può vedere una celebrazione in più per
  tipo, comportamento accettabile e coerente col criterio già usato per migrazioni analoghe).
- **Perché:** correzione diretta di un fraintendimento del requisito nella sessione precedente —
  nessun'altra motivazione, richiesta esplicita e specifica dell'utente.
- **Impatto:** `src/types/career.ts`, `src/lib/career/engine.ts`, `src/lib/career/loop.ts`,
  `src/lib/career/storage.ts` (migrazione), `src/lib/career/loop.test.ts` (+3 test dedicati:
  prima volta per un tipo, seconda volta stesso tipo, prima volta per un tipo diverso),
  `src/lib/career/storage.test.ts` (migrazione v8/v9→v10 aggiornata). 403 test (era 399),
  `tsc`/lint puliti. **Verificato dal vivo nel browser**: primo obiettivo di tipo "goals" mostra
  l'overlay verde, un secondo obiettivo dello stesso tipo mostra solo il banner, un terzo
  obiettivo di tipo "apps" (mai celebrato) mostra di nuovo l'overlay — tutti e 3 i casi osservati
  direttamente. Rilasciato insieme al ribilanciamento della voce precedente come **v0.9.2**
  (versionCode/FileVersion verificati prima della pubblicazione), installata e verificata anche
  sul tablet fisico via ADB.
- **Nota di processo**: durante questa sessione sono state trovate modifiche non committate ad
  opera di una sessione/lavoro parallelo (`playstyles.ts`/`trophies.ts`, già documentate nella
  voce precedente) — verificato con l'utente (`AskUserQuestion`) prima di includerle nella stessa
  release invece di assumerlo silenziosamente, dato che una build locale (`npm run build`) compila
  sempre dai file presenti su disco, committati o no.

### Fit tattico col club + contratti/agenti — 2 delle 7 dinamiche "carriera realistica" proposte dall'utente, le altre 5 mappate/rimandate
- **Data:** 2026-08-12
- **Decisione:** l'utente ha delineato 7 dinamiche reali della carriera di un calciatore (crescita
  non lineare, declino fisico/riconversione ruolo, storico infortuni permanente, resilienza
  mentale/pressione, compatibilità tattica col club, ambientamento in un nuovo campionato/Paese,
  geometria contrattuale/potere degli agenti) chiedendo un'analisi di cosa inserire nel gioco.
  Verificato lo stato del codice (`potential.ts`/`attributes.ts`/`playstyles.ts`/`injuries.ts`/
  `traits.ts`/`shadow.ts`): 4 già coperte almeno in parte, **compatibilità tattica** e
  **contratti/potere degli agenti** gap completamente scoperti — scelte dall'utente come priorità
  per questo giro (`AskUserQuestion`), le altre 3 (crescita non lineare estesa, declino
  fisico→riconversione age-based, pressione mentale/media) rimandate a [[backlog]] su richiesta
  esplicita. Due decisioni di scope confermate anch'esse con l'utente prima di implementare: la
  clausola rescissoria ha un **effetto meccanico reale** (trigger forzato, non solo un numero
  informativo) e il sistema tattico di ogni club è **derivato proceduralmente** (nessun nuovo dato
  per 220 club, mai assegnato a mano).
  1. **Compatibilità tattica** (`lib/career/tactics.ts`, nuovo): `TacticalSystem` (4 valori:
     possesso/pressing/contropiede/diretto) derivato da un hash **FNV-1a** sull'id del club — non
     un campo dati nuovo su `Club`. `playerPreferredSystem`/`tacticalFit` mappano l'attributo
     dominante/più debole del giocatore (pace→contropiede, passing→possesso, defending→pressing,
     physical→diretto; `null`/sempre "neutro" per i portieri) al sistema del club (ottimo/neutro/
     scarso). `tacticalFitMultiplier` (±8%) applicato in `projectSeasonStats`/`projectStats`
     (`progression.ts`, nuovo parametro `fitMultiplier`), calcolato in `advanceSeasons`
     (`engine.ts`). UI: chip "Fit tattico" per offerta in `OfferPanel.tsx` (nuovo prop `player`) e
     sul club attuale in `PlayerCard.tsx`. **Bug trovato e corretto durante la verifica dal vivo
     nel browser** (non da un test, dato che l'harness misura solo la distribuzione aggregata su
     220 club, non un singolo sottoinsieme): la prima versione dell'hash (somma semplice dei
     codici carattere mod 4) clusterizzava vistosamente su id strutturalmente simili — le 4
     offerte del settore giovanile spagnolo (`las-palmas`/`real-oviedo`/`eibar`/`levante`, stessa
     lunghezza/composizione dello slug) risultavano **tutte** "Ottimo", rendendo il chip inutile
     per quella decisione. Anche un hash moltiplicativo semplice (stile `String.hashCode` di Java,
     fattore 31) migliorava ma lasciava ancora 3 club su 4 sullo stesso sistema; FNV-1a (offset
     basis + XOR + moltiplicazione per il primo FNV ad ogni carattere) ha risolto la
     clusterizzazione, verificato sia via script Node ad-hoc su un campione di id reali sia di
     nuovo nel browser.
  2. **Contratti e potere degli agenti**: nuovo `Player.releaseClauseEur: number`
     (`STORAGE_VERSION` 10→11, `migratePlayerV10`, default 0). `computeReleaseClauseEur`/
     `computeSigningBonusEur` in `wallet.ts` (multiplo del `marketValueEur` già esistente, più
     alto per prestigio club/giovane età; bonus alla firma come frazione di uno stipendio annuo).
     `signWithClub` (`engine.ts`) applica il bonus **solo** su un vero cambio di club (confronto
     `player.club?.id !== club.id`), ricalcola sempre la clausola. Nuova categoria rotante
     `"agent"` (`generateAgentNegotiation` in `decisions.ts`: alza/abbassa la clausola in cambio
     di sicurezza/mobilità — nessun `option.club`, quindi la nuova clausola è impostata
     direttamente nell'effetto invece che tramite `signWithClub`). Nuova categoria **forzata**
     `"clause-activation"` (stesso pattern architetturale di `shouldTriggerScandal`/
     `shouldTriggerContinentalFinal` in `loop.ts`): `clauseActivationChance` cresce quanto più la
     clausola è "conveniente" rispetto al market value corrente (non rinegoziata verso l'alto) —
     dà un significato meccanico reale alle scelte della categoria "agent". `pickNextDecision`
     verifica prima l'esistenza di un pretendente eleggibile con una funzione pura senza RNG
     (`clauseActivationSuitorPool`, filtrata su prestigio superiore) prima di consumare il roll di
     probabilità — stesso principio già seguito da `shouldTriggerCupUpset` (condizione
     deterministica prima del roll), per non consumare RNG due volte in modo divergente scegliendo
     il pretendente due volte con esiti diversi. UI: clausola mostrata su `PlayerCard.tsx` accanto
     a stipendio/risparmi.
- **Perché:** stesso principio "harness prima, poi ritara" già consolidato nel progetto — la
  frequenza di `agent`/`clause-activation` (categorie generiche già tracciate automaticamente da
  `categoryPicks` nell'harness esistente, nessuna modifica necessaria a `simulation.ts` per
  quello) e la distribuzione del fit tattico sono state misurate con `npm run simulate` prima di
  considerare il lavoro concluso (fit tattico 21%/59%/20% ottimo/neutro/scarso, non degenere;
  clause-activation 6.5% dei cicli, tra continental-final 3.8% e cup-upset 7.4%, nello stesso
  ordine di grandezza degli altri eventi forzati esistenti — nessuna ritaratura ritenuta
  necessaria). Il bug del hash non era rilevabile dall'harness (che misura solo l'aggregato su
  tutti i 220 club) — un promemoria diretto che la verifica manuale nel browser resta necessaria
  anche quando l'harness "sembra a posto", specialmente per meccaniche il cui effetto visibile
  dipende da un sottoinsieme filtrato di dati (qui: le offerte di uno specifico paese/prestigio).
- **Alternative:** sistema tattico assegnato a mano solo ai club di prestigio più alto — proposta
  e scartata dall'utente a favore della derivazione procedurale per tutti (nessuna ricerca/
  curatela manuale). Clausola rescissoria come solo numero informativo senza trigger forzato —
  proposta e scartata dall'utente a favore dell'effetto meccanico reale.
- **Impatto:** `src/lib/career/tactics.ts` + `tactics.test.ts` (nuovi), `src/lib/career/
  progression.ts` (`fitMultiplier`), `src/lib/career/engine.ts` (`advanceSeasons`, `signWithClub`,
  `createPlayer`, `applyDelta`), `src/lib/career/wallet.ts` (+`computeReleaseClauseEur`/
  `computeSigningBonusEur`) + test, `src/lib/career/decisions.ts` (+`isAgentEligible`/
  `generateAgentNegotiation`/`clauseActivationSuitorPool`/`pickClauseActivationSuitor`/
  `clauseActivationChance`/`generateClauseActivationDecision`, +peso categoria `agent`) + test,
  `src/lib/career/loop.ts` (+`shouldTriggerClauseActivation`, wiring `availableCategories`/
  `pickNextDecision`/switch) + test, `src/types/career.ts` (+`Player.releaseClauseEur`,
  +`DecisionCategory` `"agent"`/`"clause-activation"`, +`PlayerDelta.releaseClauseEur`),
  `src/lib/career/storage.ts` (`STORAGE_VERSION` 11, `migratePlayerV10`) + test,
  `src/lib/career/simulation.ts`/`scripts/simulate-careers.ts` (+tracciamento fit tattico/
  clausola), `OfferPanel.tsx`/`PlayerCard.tsx`/`CareerGame.tsx` (UI). 446 test (era 403), `tsc`/
  lint puliti (solo i 4 warning pre-esistenti, invariati). **Verificato dal vivo nel browser** in
  una singola sessione di playtest fortunata: chip "Fit tattico" su offerte reali (che ha rivelato
  e portato al fix del bug hash sopra), clausola+bonus alla firma sul cartellino, evento
  "clause-activation" scattato naturalmente (non forzato via localStorage) con entrambi i
  percorsi verificati (accetta trasferimento / il procuratore respinge e la clausola sale
  ×1.4), evento "agent" scattato subito dopo con "Clausola più alta" verificata ×1.3 esatto.

### Simulazione mobile in browser via iframe + 3 fix di visualizzazione trovati e corretti
- **Data:** 2026-08-12
- **Decisione:** su richiesta esplicita dell'utente di aprire l'app "come su un dispositivo
  mobile", scoperto che `resize_window` del tool browser non altera il viewport di rendering
  reale in questo ambiente (`window.innerWidth` restava 1600 nonostante l'API dichiarasse
  successo — stessa limitazione già documentata l'11/08 per `resize_window`, mai aggirata prima
  d'ora). **Nuova tecnica di verifica**: iniettare un iframe 390×844 (`document.documentElement.innerHTML`
  con `<iframe style="width:390px;height:844px">` puntato a `localhost:3000`) — un iframe ha un
  proprio viewport indipendente per le media query CSS, quindi i breakpoint Tailwind rispondono
  correttamente. Giocata una carriera reale end-to-end (creazione → offerte → decisioni →
  ritiro forzato via `localStorage` age=39/41 per accelerare) più una carriera lunga giocata
  manualmente dall'utente in parallelo nella stessa tab, trovando 3 problemi:
  1. **"Storico" collassabile a ~2px** (`CareerGame.tsx:670`): `min-h-0` non condizionato a `lg:`
     sul wrapper `overflow-y-auto` della colonna Storico — stesso identico meccanismo di
     compressione già scoperto e risolto in altri punti del progetto in v0.7.1 (vedi
     [[decisions-archive]]), qui dimenticato quando Storico è stato spostato in terza colonna
     l'8/8. Riproducibile solo quando la colonna decisione è alta (es. 4 offerte) — con contenuto
     più corto il wrapper si dimensiona correttamente, il che ne aveva probabilmente mascherato
     la scoperta finora.
  2. **Bottone "Conferma identità" prima del campo obbligatorio "Ruolo in campo"**
     (`IdentityForm.tsx`): la griglia a 3 colonne (`lg:grid-cols-[auto_1fr_auto]`) collassa in
     colonna singola sotto `lg:` seguendo l'ordine del DOM, e il bottone era annidato alla fine
     della colonna campi (prima della colonna Ruolo). Fix: bottone spostato fuori dalla colonna
     campi come 4° item di griglia indipendente, con posizionamento esplicito solo su desktop
     (`lg:col-start-2 lg:row-start-2` + `lg:row-span-2` su Cartellino e Ruolo per mantenere
     l'altezza) — **ha smascherato lo stesso bug min-h-0 al punto 1** anche sul contenitore
     "Ruolo in campo" stesso (`flex min-h-0 min-w-0 flex-col gap-1.5 ...`): prima invisibile
     perché era l'ultimo elemento della griglia (il contenuto "traboccava" comunque in fondo senza
     nulla sotto da sovrapporre), ora che il bottone veniva dopo si sovrapponeva visivamente al
     selettore ruoli. Stesso fix (`lg:min-h-0`).
  3. **Nomi trofeo/premio troncati illeggibili** (`CareerSummary.tsx:377,389`, es. "Taça de
     Portugal..." senza club né età): la card "Trofei e premi" usa `truncate` (una riga, ellissi)
     su ogni voce — pensato per quando la card aveva più larghezza; con la card affiancata a
     "Nazionale" in griglia 2 colonne (fix precedente, commit `1127b09`) lo spazio si è dimezzato
     e anche un nome breve viene tagliato. Il contenitore `<ul>` ha già `overflow-y-auto`, quindi
     rimuovere `truncate` (permettendo il wrap su più righe) risolve senza bisogno di altro.
  Tutti e 3 riproducibili in modo consistente, verificati via `getBoundingClientRect()`/
  `scrollHeight` sul DOM reale (non solo a vista) prima di considerarli confermati — stesso
  standard di verifica già consolidato nel progetto per bug di layout mobile (vedi v0.7.1).
- **Perché:** la scoperta della tecnica "iframe iniettato" è il punto più riutilizzabile di questa
  sessione — sblocca la verifica mobile via breakpoint CSS reali in questo ambiente browser anche
  senza un dispositivo fisico o un vero device emulation di DevTools, cosa che finora richiedeva
  sempre un dispositivo Android reale via ADB. Il fatto che il bug min-h-0 sia stato trovato una
  SECONDA volta (dopo v0.7.1) in un punto diverso del codice conferma che è un pattern facile da
  reintrodurre per errore — ogni nuovo `min-h-0` va sempre accompagnato dal prefisso `lg:` a meno
  di un motivo esplicito per volerlo attivo anche sotto quel breakpoint.
- **Alternative:** nessuna — bug reali con causa isolata univocamente, un solo modo ragionevole di
  correggerli (allineare al pattern `lg:min-h-0` già usato ovunque nel resto del file/progetto).
- **Impatto:** `src/components/features/career/CareerGame.tsx`,
  `src/components/features/career/IdentityForm.tsx`,
  `src/components/features/career/CareerSummary.tsx`. 446 test invariati, `tsc --noEmit`/lint
  puliti. **Verificato sia su iframe 390px (ordine corretto, Storico/Ruolo non più collassati,
  trofeo leggibile) sia su una tab a piena larghezza (>1024px, layout a 3 colonne di
  `IdentityForm` invariato)** — nessuna regressione desktop.

### Pass di game-feel sul motore: infortuni/save/calendario che "mentivano" al giocatore, offerte/categorie come conseguenza dello stato, partita decisiva, relazioni NPC — release v0.11.0
- **Data:** 2026-08-12
- **Decisione:** commit `8dac3bd` (co-autore "Cursor" — la stessa dinamica già vista altre volte
  nel progetto di una sessione parallela sullo stesso working directory, qui per la prima volta
  arrivata già come **commit reale su `origin/main`**, non solo come modifiche non committate
  trovate a inizio sessione come nei casi precedenti). Trovato all'inizio di questa sessione
  mentre si eseguiva `/session-start` per un compito distinto (rilascio di una nuova versione);
  analizzato per intero (diff file-per-file di tutti i 28 file toccati) prima di procedere, dato
  che il compito richiedeva sia il rilascio sia l'aggiornamento della memoria con le sue modifiche.
  Quattro aree, tutte accomunate dal principio "il motore non deve più mentire al giocatore o
  ignorare lo stato per generare contenuto puramente casuale":
  1. **Bug corretti (comportamento sbagliato rispetto a quanto il giocatore vede/si aspetta)**:
     un ciclo passato infortunato continuava a maturare per intero le statistiche del periodo
     (presenze/gol/assist/clean sheet) — ora `scaleStatLine`/`INJURY_STATS_MULTIPLIER` (0.45) le
     riduce coerentemente, sia per un nuovo infortunio (`applyInjuryStatCut` in `loop.ts`) sia per
     un ciclo già infortunato in corso. Il salvataggio non persisteva la decisione mostrata a
     schermo (`currentDecision`/`currentCategory`) — al resume veniva ri-estratta a caso,
     potenzialmente diversa da quella lasciata; ora persistita (`STORAGE_VERSION` 11→12). I trofei
     di nazionale (Mondiale/coppa continentale) potevano essere vinti in **ogni** ciclo da
     convocato, senza legame con un calendario — ora `cycleCoversAge`/`isWorldCupAge`
     (età%4===2)/`isContinentalTournamentAge` (età dispari) in `trophies.ts` richiedono che il
     ciclo attraversi davvero l'anno del torneo, con `rollNationalTrophies` che riceve `ageFrom`
     del ciclo per verificarlo. Obiettivi di ciclo/record personali/titoli di stagione
     (`satisfaction.ts`) usavano soglie pensate per una singola stagione anche su cicli Express
     (3 stagioni) — ora tutto normalizzato per-stagione via un nuovo parametro `seasons`.
  2. **Offerte di club "curate" invece che uniformi casuali** (`pickCuratedOffers`/
     `scoreOfferClub`/`offerReasonHint` in `decisions.ts`, sostituisce `pickClubs` in tutti e 5 i
     flussi di offerta): pesa nazionalità/casa (specialmente per l'archetipo "Bandiera"), fit
     tattico (riusa `tactics.ts`, 2026-08-12 sessione precedente), salto di prestigio (specialmente
     per "Mercenario"/"Leader"), con un motivo (`offerReasonHint`) mostrato come hint sulla card.
     Il prestito ora offre anche un'opzione esplicita "resta e lotta per il posto" (prima era
     sempre un trasferimento forzato in alcuni flussi).
  3. **Frequenza delle categorie di decisione come conseguenza dello stato**
     (`categoryWeightMultiplier` in `decisions.ts`, wired in `pickDecisionCategory`): prestito
     molto più probabile da giovani/basso OVR (×1.6) e quasi mai sopra OVR 80/età 25 (×0.08);
     fine-ciclo (rinnovo) raro se già al top (×0.15) ma molto più frequente se in difficoltà
     (età≥32, shadow≥28, infortunato — ×1.8); trasferimento raro per "Bandiera"/lealtà alta
     (×0.55), frequente per "Mercenario" (×1.35); cambio ruolo ×3 se in declino fisico (vedi punto
     4). Prima tutte le categorie pesavano allo stesso modo indipendentemente da chi fosse il
     giocatore.
  4. **Nuove meccaniche**: **partita decisiva di campionato** (categoria `decisive-match`, gated
     OVR≥75/prestige club≥2/12% per ciclo) — scelta tattica reale tra 3 sistemi (possesso/pressing/
     contropiede, riusa `tactics.ts`), la vittoria assegna un vero trofeo di campionato (con
     `rollClubTrophies` che riceve un flag `skipLeague` per non assegnarlo due volte nello stesso
     ciclo). **Riconversione di ruolo da declino fisico**: nuovo `Player.attributePeaks`
     (pace/physical di picco, aggiornato ad ogni `advanceSeasons`), `isPhysicalDeclineReconversion`
     (età≥29 e calo ≥6 punti da un picco) sostituisce l'adiacenza di ruolo standard con
     `DECLINE_PREFERRED_TARGETS` mirati (es. ala→trequartista invece di ala→esterno) — prima
     implementazione concreta del backlog item "declino fisico→riconversione ruolo age-based".
     **Relazioni NPC leggere** (nuovo `lib/career/relations.ts`): mister (si azzera ad ogni cambio
     club), agente (persistente dalla creazione), rivale (spawnato quando OVR≥78 o dopo 4+ cicli
     nello stesso club) — affinità -2..+2 con eventi condizionati (il mister propone un cambio
     ruolo se affinità≥1, l'agente propone un "favore in grigio" — soldi/shadow — se affinità≤-1);
     nomi generati deterministicamente via hash FNV-1a (stessa tecnica di `tactics.ts`, non nuovi
     dati). Prima implementazione parziale del backlog item "Relazioni NPC persistenti (§2)" —
     un sottoinsieme leggero (3 relazioni fisse, non il modello `RelationId` esteso originariamente
     proposto), non ancora la versione completa. **Focus di allenamento** non più un evento
     casuale (`"training-focus"` rimosso da `availableCategories`) ma un'interazione diretta
     (click sull'attributo in `AttributesPanel`, nuovo `setTrainingFocus` nell'hook). Nuovo
     `VersionBadge.tsx` (badge versione+data fissato in basso a destra su ogni schermata, legge
     `package.json` via `src/constants/app-info.ts`).
  `STORAGE_VERSION` salita da 11 a **14** in tre migrazioni incrementali (v12: nessun campo dati,
  solo `currentDecision`/`currentCategory` nel `SavedGame` non nel `Player`; v13: `attributePeaks`
  retrocalcolato da `peaksFromAttributes`; v14: `relations` popolato da `ensureCoreRelations`).
- **Perché (di questa voce di memoria):** l'utente ha chiesto esplicitamente di rilasciare una
  nuova versione e, se possibile, aggiornare la memoria con le modifiche dell'ultimo commit — dato
  che il commit non era mai stato documentato (arrivato da una sessione parallela), l'unico modo
  di adempiere alla richiesta "aggiorna la memoria" era leggere per intero il diff e ricostruirne
  il ragionamento, non solo registrare il messaggio di commit.
- **Verifica prima del rilascio**: 501 test verdi (era 446, +55 — nessuna asserzione esistente
  modificata secondo il diff), `tsc --noEmit` pulito. **Lint**: trovati e rimossi 2 warning
  `no-unused-vars` residui in `trophies.test.ts` (`Club` import e `LOW_PRESTIGE_CLUB` non più
  usati dopo il refactor calendario-gated) prima del rilascio, commit separato `5082682` insieme
  al bump di versione — i soli 4 errori `react-hooks/set-state-in-effect` pre-esistenti restano
  invariati. **Non verificato manualmente nel browser in questa sessione** (sessione di rilascio,
  non di playtest) — nessuna delle nuove meccaniche RNG-gated (partita decisiva, relazioni NPC,
  riconversione da declino fisico, favore in grigio dell'agente) è stata osservata dal vivo; solo
  offerte curate e focus di allenamento diretto sono deterministiche e quindi a rischio più basso.
  Vedi [[tech-debt]] per la voce corrispondente.
- **Alternative:** nessuna — il compito era rilasciare quanto già implementato e documentarlo, non
  rivedere le scelte di design della sessione parallela.
- **Impatto:** 28 file (vedi diff completo per l'elenco, principalmente `lib/career/decisions.ts`
  +364, `loop.ts` +156, nuovo `lib/career/relations.ts` +154, `storage.ts`/`types/career.ts` per la
  migrazione, `AttributesPanel.tsx`/`PlayerCard.tsx`/`CareerGame.tsx`/`layout.tsx` per la UI).
  `package.json`/`package-lock.json` bump 0.10.0→**0.11.0** (minor, per il volume di feature —
  stesso criterio già usato per bundle di questa dimensione). `dist/MyRoad.exe` (FileVersion
  0.11.0.0) e `dist/MyRoad.apk` (versionCode 1100/versionName 0.11.0, firma verificata con la
  stessa chiave stabile del progetto via `apksigner verify --print-certs`) rigenerati e allegati
  alla [release GitHub v0.11.0](https://github.com/Gioixxx/MyRoad/releases/tag/v0.11.0). Build
  Android eseguita impostando `JAVA_HOME`/`ANDROID_HOME` manualmente nella sessione (stesso JBR di
  Android Studio già documentato per v0.10.0, non persistito nell'ambiente di default).

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
