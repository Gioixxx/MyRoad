import type { AwardType } from "@/types/career";

/**
 * Immagini per i 3 premi individuali — scelta esplicita dell'utente (2026-08-08) di usare
 * immagini reali invece dell'unica icona generica identica usata in precedenza per tutti e 3,
 * accettando il rischio di marchio non mitigato da una fonte "as is" come TheSportsDB (vedi
 * .claude/research/team-crests.md sezione 6 per la valutazione).
 * - "ballon-dor": illustrazione dettagliata del vero trofeo (Wikimedia Commons, CC BY-SA 4.0).
 * - "player-of-the-season": nessun trofeo reale unico riconoscibile esiste (concetto generico,
 *   non un premio con un unico proprietario). Un candidato trovato su Wikimedia Commons
 *   ("Golden trophy.svg") riproduceva però chiaramente la sagoma della Coppa del Mondo (spirale +
 *   base verde) — fuorviante dato che il vero trofeo Mondiale è già mostrato altrove
 *   nell'app (COMPETITION_TROPHIES) — quindi si resta sulla coppa generica Twemoji già in uso.
 * - "top-scorer": la foto reale trovata (Golden Boot Premier League) mostra il logo dello
 *   sponsor "Barclays" in evidenza — rischio di marchio giudicato eccessivo dall'utente, quindi
 *   qui si resta su un'icona Twemoji generica (medaglia d'oro) invece di un'immagine reale.
 */
const TWEMOJI_TROPHY_URL = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3c6.svg";

export const AWARD_IMAGES: Record<AwardType, string> = {
  "ballon-dor": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Icone_ballon_d%27or.svg",
  "top-scorer": "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f947.svg",
  "player-of-the-season": TWEMOJI_TROPHY_URL,
};
