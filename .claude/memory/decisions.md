---
type: decisions
tags: [memory, architecture]
updated: [2026-08-12]
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
