---
type: conventions
tags: [memory, conventions]
updated: [2026-08-18]
---

# Convenzioni Locali
Pattern e regole specifiche del progetto. Workaround che generano debito → [[tech-debt]].

## Lingua
- **Tutta l'interfaccia utente e i testi visibili sono in italiano** (richiesta esplicita dell'utente) — label, messaggi di errore, copy dei bottoni, nomi delle decisioni/eventi.
- Codice, commenti, nomi di variabili/funzioni restano in inglese come da standard.
- I nomi propri (club, competizioni, nazionalità) restano nella loro forma reale/originale (es. "Champions League", non tradotto).

## RNG testabile
- Ogni funzione del motore che usa casualità accetta un parametro `rng: Rng = Math.random` opzionale (tipo `() => number`), per permettere test deterministici passando un RNG finto. Pattern usato in `progression.ts`, `engine.ts`, `decisions.ts` — mantenerlo per ogni nuova funzione probabilistica.

## Struttura cartelle
- `lib/career/`: dominio puro, zero dipendenze da React — nessun file qui deve importare da `components/`.
- `components/ui/`: primitive generiche (Button, Card, Field, SegmentedControl) — nessuna logica di dominio.
- `components/features/career/`: componenti specifici del gioco, possono importare da `lib/career/` e `data/`.
- Test co-locati (`*.test.ts`/`*.test.tsx` accanto al file), mai in cartella `tests/` separata.

## Design tokens
- `constants/design-tokens.ts` è la fonte di verità TypeScript; `app/globals.css` duplica gli stessi valori come CSS custom properties (necessario per Tailwind v4 `@theme inline` + dark mode via classe). Se si cambia un colore, aggiornare **entrambi** i file.
- `--color-pitch` (verde campo) è **sempre verde**, non segue light/dark — usarlo per qualunque elemento che rappresenta un campo da calcio o una maglia. Non usare `--color-primary` per quello (cambia colore col tema).

## Vincoli noti
- Il piano di implementazione dettagliato vive fuori dal repo: `C:\Users\Gioix\.claude\plans\piped-bouncing-cocke.md` — leggerlo prima di riprendere lo sviluppo.
- Stemmi dei club: solo hotlink a URL esterni se mai implementati, mai download/salvataggio di loghi nel repo (rischio copyright su marchi registrati).
- **Test di layout mobile in browser (Claude in Chrome)**: `resize_window` del tool browser non altera il vero viewport di rendering in questo ambiente (`window.innerWidth` resta quello desktop nonostante l'API dichiari successo, verificato empiricamente il 2026-08-12) — non fidarsi del suo esito per verificare breakpoint Tailwind. Tecnica che funziona: iniettare un iframe con `width`/`height` fissi (es. 390×844) nella pagina via `document.documentElement.innerHTML`, puntato allo stesso `localhost:3000` — un iframe ha un proprio viewport CSS indipendente, quindi le media query rispondono correttamente. Vedi [[decisions]] per il caso reale che ha portato a questa scoperta.
- **Overlay con timer di auto-dismiss (pattern `MomentOverlay`/`CoachMomentOverlay`) richiede una `key` esplicita dal chiamante ad ogni nuovo "moment"** (es. `key={`moment-${momentIndex}-${moment.kind}`}`) — senza remount, il timer interno del componente precedente resta vivo e il countdown del nuovo moment eredita tempo già trascorso, facendolo sparire prima del previsto (o subito, se il moment precedente era quasi scaduto). Bug reale trovato il 2026-08-16 su `CoachMomentOverlay` (mancava la `key`, presente invece nell'equivalente calciatore) da un agente di QA — verificare sempre che ogni nuovo componente overlay-con-timer venga montato con una key legata all'identità del moment corrente, non solo con una condizione booleana.
- **Tradurre un codice interno in un'etichetta italiana: preferire sempre una label-map di sola visualizzazione (`Record<T, string>`, es. `POSITION_LABELS`, `AWARD_LABELS`, `ARCHETYPE_LABELS`, `COACH_SEASON_TITLE_LABELS`) piuttosto che rinominare i valori del tipo sottostante.** Vale soprattutto quando il valore è già persistito (localStorage/Supabase) o usato come chiave di logica altrove (`Record<T, ...>` esaustivi, `Set<T>`, confronti `===`) — rinominare i valori stessi richiederebbe una migrazione dati reale oltre al refactor di ogni sito di logica, per un cambiamento che nell'intento dell'utente è quasi sempre solo estetico. Caso reale: etichette ruoli calciatore tradotte in sigle italiane (2026-08-18, `POSITION_LABELS` in `src/lib/career/position-labels.ts`) senza toccare il tipo `Position` — vedi [[decisions]].
- **Claude in Chrome opera sul browser reale dell'utente, non su un profilo isolato**: qualunque `localStorage`/dato di test scritto durante una sessione di verifica (identità, salvataggi, pubblicazioni in classifica) è **reale**, persiste tra sessioni, e — per la classifica globale — può finire sul DB Supabase di produzione condiviso con un'altra app dell'utente. Va sempre ripulito esplicitamente a fine test (chiavi `carriera:save`/`carriera:coach-save`/entry di archivio), e per qualunque test che possa arrivare al ritiro/pubblicazione va installato **prima** l'override `window.fetch` che blocca le richieste verso `supabase.co` (vedi [[decisions]], sessione QA 2026-08-18) — non a posteriori. Lezione imparata da 3 episodi reali in una singola sessione (2 pubblicazioni accidentali in classifica, 1 salvataggio "Test" dimenticato che ha causato un fraintendimento dell'utente in una sessione successiva) — vedi [[tech-debt]] per il gap strutturale (nessun modo lato UI/env di disabilitare la pubblicazione durante i test).
- **Tecnica per riprodurre deterministicamente uno scenario RNG-gated nel browser**: sovrascrivere `window.Math.random = () => X` via `javascript_tool` prima di innescare l'azione — ma attenzione, un singolo valore fisso `X` si applica a **ogni** chiamata `Math.random()` nell'intero ciclo (crescita OVR, trofei, infortuni, retrocessione, ecc. tutti insieme), quindi un valore troppo basso (es. `0`) può far scattare contemporaneamente eventi che nel gioco reale sarebbero mutuamente rari/esclusivi (es. vittoria del campionato che blocca la retrocessione nello stesso ciclo, vedi `applyClubTierMovement` in `club-progression.ts`) invece del solo scenario che si vuole isolare — va scelto un valore intermedio che soddisfi la sola soglia di probabilità voluta (`rng() < chance`) restando sopra le altre. Caso reale: BUG-02, isolare la retrocessione senza il trofeo ha richiesto `0.05` invece di `0` dopo un primo tentativo fallito — vedi [[decisions]].
