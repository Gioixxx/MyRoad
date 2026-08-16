---
type: conventions
tags: [memory, conventions]
updated: [2026-08-16]
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
