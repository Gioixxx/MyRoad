import type {
  AttributeKey,
  Club,
  Decision,
  DecisionCategory,
  DecisionOption,
  DecisionOutcome,
  Injury,
  Player,
  PlayerDelta,
  Position,
} from "@/types/career";
import { clubs, clubsByCountry } from "@/data/clubs";
import { countries } from "@/data/countries";
import { clamp, type Rng } from "./progression";
import { isNationalTeamBanned, shadowMultiplier } from "./shadow";
import { ATTRIBUTE_LABELS, attributeKeysForPosition, peaksFromAttributes } from "./attributes";
import { playStyleCallupBonus } from "./playstyles";
import { tacticalFit, TACTICAL_SYSTEM_LABELS, clubTacticalSystem, playerPreferredSystem, type TacticalSystem } from "./tactics";
import { deriveArchetype } from "./traits";
import { getRelation } from "./relations";
import { POSITION_LABELS } from "./position-labels";

// ---------- Helper di selezione club ----------

function targetPrestige(ovr: number): number {
  if (ovr >= 92) return 3;
  if (ovr >= 84) return 2;
  if (ovr >= 68) return 1;
  return 0;
}

/**
 * Campionati dell'espansione mondo 2026-08-06 (CONCACAF/CAF/AFC): il prestige locale (0-3) misura
 * il rilievo del club nel proprio paese, non il livello globale del campionato — un club di
 * prestige 3 qui non compete realisticamente per un giocatore già affermato. Esclusi dal pool di
 * offerte quando il giocatore punta a un prestige ≥2 (OVR ≥84); restano pienamente eleggibili per
 * giocatori più giovani/meno quotati, dove un'offerta da questi campionati è plausibile.
 */
const EMERGING_MARKET_COUNTRIES = new Set([
  "Mexico",
  "United States",
  "Canada",
  "Morocco",
  "Senegal",
  "Nigeria",
  "Ghana",
  "Egypt",
  "Ivory Coast",
  "Japan",
  "South Korea",
  "Australia",
]);

function eligibleClubs(ovr: number, excludeId?: string): Club[] {
  const prestige = targetPrestige(ovr);
  return clubs.filter((c) => {
    if (c.id === excludeId) return false;
    if (prestige >= 2 && EMERGING_MARKET_COUNTRIES.has(c.country)) return false;
    return Math.abs(c.prestige - prestige) <= 1;
  });
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickClubs(pool: Club[], count: number, rng: Rng): Club[] {
  return shuffle(pool, rng).slice(0, count);
}

function scoreOfferClub(player: Player, club: Club): number {
  const archetype = deriveArchetype(player.traits, player.shadow).primary;
  let score = 1;
  if (club.country === player.nationality) {
    score += archetype === "flagbearer" ? 8 : 3;
  } else if (archetype === "mercenary") {
    score += 3;
  }
  const fit = tacticalFit(player, club);
  if (fit === "ottimo") score += 4;
  if (fit === "scarso") score += archetype === "problem" ? 3 : -2;
  const target = targetPrestige(player.ovr);
  if (club.prestige > target) {
    score += archetype === "mercenary" || archetype === "leader" ? 5 : 2;
  }
  if (club.prestige >= 2 && archetype === "leader") score += 2;
  return score;
}

/** Motivo in italiano per un'offerta club (hint sulla card). */
export function offerReasonHint(
  player: Pick<Player, "nationality" | "attributes" | "position" | "ovr">,
  club: Club,
): string {
  const reasons: string[] = [];
  if (club.country === player.nationality) reasons.push("Club di casa");
  const fit = tacticalFit(player, club);
  if (fit === "ottimo") reasons.push("Fit ottimo");
  else if (fit === "scarso") reasons.push("Fit scarso");
  const target = targetPrestige(player.ovr);
  if (club.prestige > target) reasons.push("Salto di categoria");
  else if (club.prestige < target) reasons.push("Progetto");
  return reasons.join(" · ") || "Nuovo ambiente";
}

/**
 * Seleziona fino a `count` club dal pool privilegiando casa, fit tattico ottimo e step-up di
 * prestigio, poi il punteggio da archetipo. Non esclude i restanti: riempie i posti rimasti.
 */
export function pickCuratedOffers(player: Player, pool: Club[], count: number, rng: Rng): Club[] {
  if (pool.length <= count) return shuffle(pool, rng);
  const remaining = [...pool];
  const picked: Club[] = [];

  const takeBest = (predicate: (club: Club) => boolean) => {
    if (picked.length >= count) return;
    const candidates = remaining.filter(predicate);
    if (candidates.length === 0) return;
    const ranked = candidates
      .map((club) => ({ club, score: scoreOfferClub(player, club) + rng() }))
      .sort((a, b) => b.score - a.score);
    const chosen = ranked[0]!.club;
    picked.push(chosen);
    remaining.splice(
      remaining.findIndex((c) => c.id === chosen.id),
      1,
    );
  };

  takeBest((c) => c.country === player.nationality);
  takeBest((c) => tacticalFit(player, c) === "ottimo");
  takeBest((c) => c.prestige > targetPrestige(player.ovr));

  while (picked.length < count && remaining.length > 0) {
    const ranked = remaining
      .map((club) => ({ club, score: scoreOfferClub(player, club) + rng() * 2 }))
      .sort((a, b) => b.score - a.score);
    const chosen = ranked[0]!.club;
    picked.push(chosen);
    remaining.splice(
      remaining.findIndex((c) => c.id === chosen.id),
      1,
    );
  }

  return shuffle(picked, rng);
}

/** Riga "perché no" per il cartellino (nazionale / clausola). `null` se non c'è nulla da dire. */
export function prospectStatusLine(player: Player): string | null {
  const parts: string[] = [];
  if (!player.nationalTeam.called && player.ovr < NATIONAL_CALLUP_OVR_BASELINE) {
    parts.push(`Nazionale da OVR ${NATIONAL_CALLUP_OVR_BASELINE}`);
  }
  if (player.releaseClauseEur > 0 && player.marketValueEur > 0) {
    const bargainRatio = Math.max(player.marketValueEur / player.releaseClauseEur - 1, 0);
    parts.push(bargainRatio > 0 ? "Clausola conveniente" : "Blindato");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ---------- Helper per costruire decisioni/opzioni ----------

function outcome(
  weight: number,
  resultText: string,
  ovrDelta = 0,
  extra?: Partial<PlayerDelta>,
): DecisionOutcome {
  return { weight, effect: { ...(ovrDelta ? { ovrDelta } : {}), ...extra }, resultText };
}

/** Outcome che infortuna il giocatore invece di applicare solo un malus OVR testuale. */
function injuryOutcome(
  weight: number,
  resultText: string,
  injury: Injury,
  extra?: Partial<PlayerDelta>,
): DecisionOutcome {
  return { weight, effect: { injury, ...extra }, resultText };
}

function signOption(
  id: string,
  label: string,
  club: Club,
  resultText: string,
  extra?: Partial<PlayerDelta>,
): DecisionOption {
  return { id, label, club, outcomes: [outcome(100, resultText, 0, extra)] };
}

function withHint(option: DecisionOption, hint: string): DecisionOption {
  return { ...option, hint };
}

function isPlayingTimeBrief(player: Player): boolean {
  const kind = player.currentObjective?.kind;
  return kind === "goals" || kind === "apps";
}

function stayBriefHint(player: Player, fallback: string): string {
  return isPlayingTimeBrief(player) ? "Insegui il brief del mister" : fallback;
}

function leaveBriefHint(player: Player, fallback: string): string {
  if (!isPlayingTimeBrief(player)) return fallback;
  return fallback.length > 0 ? `${fallback} · Lasci il brief del mister` : "Lasci il brief del mister";
}

/**
 * Peso (%) dell'outcome più favorevole di un'opzione, per mostrare una probabilità reale
 * accanto all'hint testuale. `null` se l'opzione è deterministica (un solo outcome) — non c'è
 * nulla da mostrare. "Favorevole" = ovrDelta più alto; a parità, priorità a chi non infortuna e
 * poi a savingsDelta/popularityDelta più alti.
 */
export function favorableOutcomeWeight(option: DecisionOption): number | null {
  if (option.outcomes.length < 2) return null;
  const best = option.outcomes.reduce((a, b) => {
    const aOvr = a.effect.ovrDelta ?? 0;
    const bOvr = b.effect.ovrDelta ?? 0;
    if (aOvr !== bOvr) return aOvr > bOvr ? a : b;
    const aInjury = a.effect.injury ? 1 : 0;
    const bInjury = b.effect.injury ? 1 : 0;
    if (aInjury !== bInjury) return aInjury < bInjury ? a : b;
    const aSecondary = (a.effect.savingsDelta ?? 0) + (a.effect.popularityDelta ?? 0);
    const bSecondary = (b.effect.savingsDelta ?? 0) + (b.effect.popularityDelta ?? 0);
    return aSecondary >= bSecondary ? a : b;
  });
  return best.weight;
}

// ---------- Offerta iniziale (settore giovanile) ----------

export function generateAcademyOffer(
  identity: Pick<Player, "nationality">,
  rng: Rng = Math.random,
): Decision {
  const homeClubs = clubsByCountry(identity.nationality).filter((c) => c.prestige <= 1);
  const pool = homeClubs.length >= 4 ? homeClubs : clubs.filter((c) => c.prestige <= 1);
  const offers = pickClubs(pool, 4, rng);
  return {
    id: "academy-offer",
    category: "transfer",
    title: "Offerta dal settore giovanile",
    description:
      "Quattro club vogliono aggiungerti al loro progetto giovanile. Scegli dove inizia la tua carriera.",
    options: offers.map((c) =>
      signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Inizi la carriera al ${c.name}.`),
    ),
  };
}

// ---------- Pool statico di eventi lifestyle/narrativi (nessuna dipendenza dal club) ----------

export const LIFESTYLE_DECISIONS: Decision[] = [
  {
    id: "nutrition-plan",
    category: "lifestyle",
    title: "Piano alimentare",
    description:
      "Un nutrizionista propone di cambiare la tua dieta. Potrebbe migliorare le prestazioni o ritorcersi contro di te.",
    options: [
      {
        id: "follow-plan",
        label: "Segui il piano",
        hint: "Possibile crescita OVR · rischio di calo",
        outcomes: [
          outcome(60, "Il nuovo regime alimentare ti dà una marcia in più.", 3, {
            traitsDelta: { discipline: -1 },
          }),
          outcome(40, "Il cambio di dieta ti destabilizza in campo.", -2, {
            traitsDelta: { discipline: -3 },
          }),
        ],
      },
      {
        id: "keep-diet",
        label: "Mantieni la tua dieta",
        hint: "Nessun rischio",
        outcomes: [outcome(100, "Nessun cambiamento.", 0, { traitsDelta: { discipline: 5 } })],
      },
    ],
  },
  {
    id: "giant-tattoo",
    category: "lifestyle",
    title: "Tatuaggio enorme",
    description: "Uno studio propone di tatuarti un'aquila gigante sul petto.",
    options: [
      {
        id: "accept-tattoo",
        label: "Accetta",
        hint: "Piccolo boost · rischio di stop",
        outcomes: [
          outcome(70, "Ti senti più sicuro di te in campo.", 1, { traitsDelta: { discipline: -1 } }),
          outcome(30, "Il tatuaggio si infetta e ti costringe a fermarti.", -2, {
            traitsDelta: { discipline: -3 },
          }),
        ],
      },
      {
        id: "reject-tattoo",
        label: "Rifiuta",
        hint: "Nessun rischio",
        outcomes: [outcome(100, "Nulla succede.", 0, { traitsDelta: { discipline: 5 } })],
      },
    ],
  },
  {
    id: "mysterious-substance",
    category: "lifestyle",
    title: "Sostanza misteriosa",
    description: "Il medico del club ti offre un integratore di dubbia origine.",
    options: [
      {
        id: "take-it",
        label: "Prendilo",
        hint: "Forte crescita OVR · rischio squalifica",
        outcomes: [
          outcome(75, "L'integratore funziona, ti senti molto più forte.", 5, {
            traitsDelta: { discipline: -4 },
            shadowDelta: 26,
            shadowFlags: { doped: true },
          }),
          injuryOutcome(
            25,
            "Risulti positivo ai controlli antidoping e vieni squalificato.",
            { label: "Squalifica per doping", turnsRemaining: 2, ovrPenalty: 4 },
            { traitsDelta: { discipline: -4 }, shadowDelta: 40, shadowFlags: { doped: true } },
          ),
        ],
      },
      {
        id: "reject-it",
        label: "Rifiuta",
        hint: "Nessun rischio",
        outcomes: [
          outcome(100, "Nessun cambiamento.", 0, {
            traitsDelta: { discipline: 7 },
            shadowDelta: -5,
          }),
        ],
      },
    ],
  },
  {
    id: "double-sessions",
    category: "lifestyle",
    title: "Doppie sedute",
    description: "Due allenamenti al giorno per migliorare le prestazioni.",
    options: [
      {
        id: "train-hard",
        label: "Allenati duramente",
        hint: "Crescita OVR · rischio infortunio",
        outcomes: [
          outcome(65, "Diventi titolare per la prossima stagione.", 2),
          injuryOutcome(35, "Un infortunio ti tiene lontano dai campi.", {
            label: "Distorsione alla caviglia",
            turnsRemaining: 2,
            ovrPenalty: 4,
          }),
        ],
      },
      {
        id: "reduce-load",
        label: "Riduci il carico",
        hint: "Calo OVR lieve · nessun rischio fisico",
        outcomes: [outcome(100, "Giochi con meno minutaggio.", -1)],
      },
    ],
  },
  {
    id: "extra-camp",
    category: "lifestyle",
    title: "Ritiro speciale",
    description: "Un ritiro speciale può darti una spinta, ma lo sforzo extra si fa sentire.",
    options: [
      {
        id: "attend-camp",
        label: "Partecipa",
        hint: "Forte crescita OVR · rischio infortunio",
        outcomes: [
          outcome(65, "Il ritiro speciale ti dà una marcia in più.", 4),
          injuryOutcome(35, "Lo sforzo extra si fa sentire.", {
            label: "Affaticamento fisico",
            turnsRemaining: 2,
            ovrPenalty: 3,
          }),
        ],
      },
      {
        id: "usual-preparation",
        label: "Preparazione abituale",
        hint: "Nessun rischio",
        outcomes: [outcome(100, "Nessun cambiamento.")],
      },
    ],
  },
  {
    id: "indecent-proposal",
    category: "lifestyle",
    title: "Proposta indecente",
    description: "La compagna di un compagno di squadra ti fa un'avance.",
    options: [
      {
        id: "proceed",
        label: "Accetta",
        hint: "Boost motivazionale · rischio scandalo",
        outcomes: [
          outcome(50, "L'euforia ti dà motivazione extra.", 2),
          outcome(50, "Vieni scoperto e lo scandalo ti pesa addosso.", -3),
        ],
      },
      {
        id: "reject",
        label: "Rifiuta",
        hint: "Nessun rischio",
        outcomes: [outcome(100, "Nulla succede.")],
      },
    ],
  },
  {
    id: "finish-high-school",
    category: "lifestyle",
    title: "Diploma di scuola superiore",
    description: "Devi decidere se proseguire gli studi in parallelo alla carriera calcistica.",
    options: [
      {
        id: "study",
        label: "Continua gli studi",
        hint: "Nessun impatto sportivo · sicurezza per il futuro",
        outcomes: [outcome(100, "Ti diplomi bilanciando scuola e calcio.")],
      },
      {
        id: "focus-football",
        label: "Abbandona la scuola per concentrarti sul calcio",
        hint: "Più tempo per allenarti",
        outcomes: [outcome(100, "Dedichi tutto il tuo tempo al pallone.", 2)],
      },
    ],
  },
  {
    id: "honesty-test",
    category: "lifestyle",
    title: "Test di onestà",
    description:
      "Trovi per sbaglio informazioni riservate sulla formazione avversaria prima di una partita decisiva.",
    options: [
      {
        id: "report-it",
        label: "Segnala tutto allo staff",
        hint: "Rispetto dello spogliatoio · nessun vantaggio",
        outcomes: [
          outcome(100, "Il tuo gesto viene apprezzato dallo spogliatoio.", 1, {
            traitsDelta: { discipline: 5, leadership: 7 },
            shadowDelta: -5,
          }),
        ],
      },
      {
        id: "use-it",
        label: "Usa le informazioni a tuo vantaggio",
        hint: "Vantaggio in campo · rischio se scoperto",
        outcomes: [
          outcome(50, "Sfrutti l'informazione e brilli in campo.", 3, {
            shadowDelta: 14,
            shadowFlags: { leakedTactics: true },
          }),
          outcome(50, "Vieni scoperto e la tua reputazione ne risente.", -3, {
            shadowDelta: 14,
            shadowFlags: { leakedTactics: true },
          }),
        ],
      },
    ],
  },
];

// ---------- Generatori dipendenti dal club corrente ----------

export function generateTransferWindow(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare una finestra di mercato");
  }
  const currentClub = player.club;
  const offers = pickCuratedOffers(player, eligibleClubs(player.ovr, currentClub.id), 3, rng);
  return {
    id: `transfer-window-${player.age}`,
    category: "transfer",
    title: "Finestra di mercato",
    description:
      "Sono arrivate offerte dopo l'ultima stagione. Puoi accettarne una o restare al tuo club.",
    options: [
      ...offers.map((c) =>
        withHint(
          signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Ti trasferisci al ${c.name}.`, {
            traitsDelta: { ambition: 4, loyalty: -2 },
          }),
          leaveBriefHint(player, offerReasonHint(player, c)),
        ),
      ),
      withHint(
        signOption("stay", `Resta al ${currentClub.name}`, currentClub, `Resti al ${currentClub.name}.`, {
          traitsDelta: { loyalty: 4 },
        }),
        stayBriefHint(player, "Continuità"),
      ),
    ],
  };
}

/** Alcune finestre di prestito nell'originale non offrono l'opzione "resta" — qui il prestito
 * è una proposta: si può restare a lottare per il posto. */
export function generateLoanOffer(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare un'offerta di prestito");
  }
  const offers = pickCuratedOffers(
    player,
    eligibleClubs(Math.max(player.ovr - 8, 0), player.club.id),
    4,
    rng,
  );
  return {
    id: `loan-offer-${player.age}`,
    category: "loan",
    title: "Proposta di prestito",
    description:
      "Il club propone un prestito per farti giocare con più continuità. Puoi accettare o restare a lottare per il posto.",
    options: [
      ...offers.map((c) =>
        withHint(
          signOption(`loan-${c.id}`, `Vai in prestito al ${c.name}`, c, `Vai in prestito al ${c.name}.`),
          offerReasonHint(player, c),
        ),
      ),
      withHint(
        signOption(
          "stay",
          `Resta e lotta per il posto al ${player.club.name}`,
          player.club,
          `Resti al ${player.club.name} e lotti per il posto.`,
        ),
        "Continuità",
      ),
    ],
  };
}

export function generateLoanReturn(
  player: Player,
  parentClub: Club,
  rng: Rng = Math.random,
): Decision {
  const offers = pickCuratedOffers(player, eligibleClubs(player.ovr, player.club?.id ?? parentClub.id), 3, rng);
  const options: DecisionOption[] = offers.map((c) =>
    withHint(
      signOption(`loan-${c.id}`, `Vai in prestito al ${c.name}`, c, `Vai in prestito al ${c.name}.`),
      offerReasonHint(player, c),
    ),
  );
  if (player.club) {
    options.push(
      signOption(
        "sign-permanent",
        `Firma a titolo definitivo per il ${player.club.name}`,
        player.club,
        `Firmi a titolo definitivo per il ${player.club.name}.`,
      ),
    );
  }
  return {
    id: `loan-return-${player.age}`,
    category: "loan-return",
    title: "Ritorno dal prestito",
    description: `Sei tornato al ${parentClub.name}, ma non rientri più nei piani. Puoi ripartire in prestito o firmare a titolo definitivo per il club dove hai giocato.`,
    options,
  };
}

export function generateClubCrisis(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare una crisi di squadra");
  }
  const [alternative] = pickCuratedOffers(player, eligibleClubs(player.ovr, player.club.id), 1, rng);
  return {
    id: `club-crisis-${player.age}`,
    category: "club-crisis",
    title: "Crisi di squadra",
    description: "La squadra attraversa un momento difficile e un altro club si fa avanti.",
    options: [
      {
        id: "stay-and-fight",
        label: `Resta e lotta al ${player.club.name}`,
        club: player.club,
        hint: stayBriefHint(player, "Lealtà · calo OVR"),
        outcomes: [
          outcome(100, "Meno possibilità di vincere qualcosa quest'anno.", -2, {
            traitsDelta: { leadership: 9, loyalty: 4 },
            relationsDelta: { coach: 1 },
          }),
        ],
      },
      withHint(
        signOption("leave", `Vai al ${alternative.name}`, alternative, `Ti trasferisci al ${alternative.name}.`, {
          traitsDelta: { ambition: 3, loyalty: -3 },
          shadowDelta: 19,
          shadowFlags: { fanBetrayed: true },
          relationsDelta: { coach: -1 },
        }),
        leaveBriefHint(player, offerReasonHint(player, alternative)),
      ),
    ],
  };
}

export function generateCompetitionForSpot(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const [alternative] = pickClubs(eligibleClubs(player.ovr, player.club.id), 1, rng);
  return {
    id: `competition-for-spot-${player.age}`,
    category: "club-crisis",
    title: "Concorrenza per il tuo posto",
    description: "Il club ha ingaggiato un altro giocatore per contendersi il tuo ruolo.",
    options: [
      {
        id: "compete",
        label: "Fatti valere",
        club: player.club,
        hint: stayBriefHint(player, "Possibile crescita · rischio panchina"),
        outcomes: [
          outcome(50, "Ti guadagni il posto da titolare.", 1),
          outcome(50, "Finisci in panchina, giochi meno.", -2),
        ],
      },
      withHint(
        signOption("leave", `Firma per ${alternative.name}`, alternative, `Lasci subito per il ${alternative.name}.`),
        leaveBriefHint(player, "Trasferimento immediato"),
      ),
    ],
  };
}

export function generateControversialStatement(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const weaker = clubs.filter(
    (c) => c.id !== player.club!.id && c.prestige < player.club!.prestige,
  );
  const pool = weaker.length > 0 ? weaker : eligibleClubs(player.ovr, player.club.id);
  const [alternative] = pickClubs(pool, 1, rng);
  return {
    id: `controversial-statement-${player.age}`,
    category: "club-crisis",
    title: "Dichiarazione controversa",
    description: "Critichi pubblicamente l'allenatore dopo una sconfitta pesante.",
    options: [
      {
        id: "apologize",
        label: "Scusati pubblicamente",
        club: player.club,
        outcomes: [
          outcome(100, "Ti scusi ma il minutaggio cala.", -1, {
            traitsDelta: { showmanship: 5 },
            shadowDelta: 6,
            relationsDelta: { coach: 1 },
          }),
        ],
      },
      signOption("leave", `Firma per ${alternative.name}`, alternative, `Lasci per il ${alternative.name}.`, {
        traitsDelta: { showmanship: 5, ambition: 2, loyalty: -2 },
        shadowDelta: 6,
        relationsDelta: { coach: -1 },
      }),
    ],
  };
}

/** Variante social del post/dichiarazione controversa — stesso schema, contesto diverso. */
export function generateControversialPost(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const weaker = clubs.filter(
    (c) => c.id !== player.club!.id && c.prestige < player.club!.prestige,
  );
  const pool = weaker.length > 0 ? weaker : eligibleClubs(player.ovr, player.club.id);
  const [alternative] = pickClubs(pool, 1, rng);
  return {
    id: `controversial-post-${player.age}`,
    category: "club-crisis",
    title: "Post controverso",
    description: "Un tuo post sui social scatena polemiche alla vigilia di una partita importante.",
    options: [
      {
        id: "delete-post",
        label: "Cancella il post e scusati",
        club: player.club,
        outcomes: [
          outcome(100, "Cancelli il post, ma il caso mediatico ti pesa addosso.", -1, {
            traitsDelta: { showmanship: 5 },
            shadowDelta: 6,
            relationsDelta: { coach: 1 },
          }),
        ],
      },
      signOption("leave", `Firma per ${alternative.name}`, alternative, `Lasci per il ${alternative.name}.`, {
        traitsDelta: { showmanship: 5, ambition: 2, loyalty: -2 },
        shadowDelta: 6,
        relationsDelta: { coach: -1 },
      }),
    ],
  };
}

export function isClubPriorityEligible(player: Player): boolean {
  if (!player.club) return false;
  return Boolean(player.club.competitions.cup || player.club.competitions.continental);
}

/** Scegliere se dare priorità al campionato o alla coppa (nome reale mostrato in card). */
export function generateClubPriority(player: Player): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const club = player.club;
  const cupName = club.competitions.continental ?? club.competitions.cup!;
  return {
    id: `club-priority-${player.age}`,
    category: "club-crisis",
    title: "Priorità della squadra",
    description: `Il mister ti chiede su cosa concentrare gli sforzi: il ${club.competitions.league} o ${cupName}.`,
    options: [
      {
        id: "prioritize-league",
        label: `Punta sul ${club.competitions.league}`,
        club,
        hint: "Più possibilità in campionato · meno in coppa",
        outcomes: [outcome(100, `Ti concentri sul ${club.competitions.league}.`, 1)],
      },
      {
        id: "prioritize-cup",
        label: `Punta su ${cupName}`,
        club,
        hint: "Più possibilità in coppa · meno in campionato",
        outcomes: [outcome(100, `Ti concentri su ${cupName}.`, 1)],
      },
    ],
  };
}

export function generateEndOfCycle(player: Player, rng: Rng = Math.random): Decision {
  const offers = pickCuratedOffers(player, eligibleClubs(player.ovr, player.club?.id), 3, rng);
  return {
    id: `end-of-cycle-${player.age}`,
    category: "end-of-cycle",
    title: "Fine stagione",
    description: "Il tuo club ha deciso di non rinnovarti. Scegli il prossimo passo della carriera.",
    options: [
      ...offers.map((c) =>
        withHint(
          signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Firmi per il ${c.name}.`),
          offerReasonHint(player, c),
        ),
      ),
      {
        id: "retire",
        label: "Ritirati",
        retire: true,
        outcomes: [outcome(100, "Chiudi la carriera da professionista.")],
      },
    ],
  };
}

// ---------- Eventi condizionati dal contesto (paese del club / nazionalità) ----------

const TAX_TROUBLE_MIN_AGE = 21;
/** In patria l'Agenzia delle Entrate ti nota solo con un patrimonio già visibile. */
const TAX_TROUBLE_HOME_SAVINGS_EUR = 500_000;

/**
 * Grane fiscali: una tantum, non a inizio carriera. All'estero basta il contratto in un altro
 * paese; in patria serve un patrimonio alto — altrimenti `narrative` resta aperta per tutta
 * la carriera (club !== null) e l'evento diventa rumore di fondo.
 */
export function isTaxTroubleEligible(player: Player): boolean {
  if (!player.club) return false;
  if (player.age < TAX_TROUBLE_MIN_AGE) return false;
  if (player.shadowFlags?.taxEvaded || player.shadowFlags?.taxTroubleOccurred) return false;
  if (player.club.country !== player.nationality) return true;
  return player.wallet.savingsEur >= TAX_TROUBLE_HOME_SAVINGS_EUR;
}

export function generateTaxTrouble(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const foreignClubs = clubs.filter((c) => c.country !== player.club!.country);
  const [alternative] = pickClubs(
    foreignClubs.length > 0 ? foreignClubs : eligibleClubs(player.ovr, player.club.id),
    1,
    rng,
  );
  return {
    id: `tax-trouble-${player.age}`,
    category: "narrative",
    title: `Grane fiscali in ${player.club.country}`,
    description: "Un'indagine fiscale mette in dubbio il tuo futuro nel paese.",
    options: [
      {
        id: "stay",
        label: `Resta al ${player.club.name}`,
        club: player.club,
        outcomes: [
          outcome(100, "La distrazione ti pesa addosso.", -3, {
            shadowDelta: 21,
            shadowFlags: { taxEvaded: true, taxTroubleOccurred: true },
          }),
        ],
      },
      signOption("leave", `Vai al ${alternative.name}`, alternative, `Lasci per il ${alternative.name}.`, {
        shadowFlags: { taxTroubleOccurred: true },
      }),
    ],
  };
}

export function isReturnHomeEligible(player: Player): boolean {
  if (!player.club || player.club.country === player.nationality) return false;
  return clubsByCountry(player.nationality).length > 0;
}

export function generateReturnHome(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const homeClubs = clubsByCountry(player.nationality);
  const [homeClub] = pickClubs(homeClubs, 1, rng);
  return {
    id: `return-home-${player.age}`,
    category: "narrative",
    title: "Richiamo da casa",
    description: "La tua famiglia ti chiede di tornare nel tuo paese d'origine.",
    options: [
      {
        id: "stay",
        label: `Resta al ${player.club.name}`,
        club: player.club,
        outcomes: [outcome(100, "Il rapporto con la famiglia si incrina.", -5)],
      },
      signOption("return", `Torna al ${homeClub.name}`, homeClub, `Torni al ${homeClub.name}.`),
    ],
  };
}

export function isUnexpectedProspectEligible(player: Player): boolean {
  return player.club !== null && player.age <= 20 && player.club.prestige <= 1;
}

/** Mentore (crescita lenta ma solida) vs "cerca una via d'uscita" (trasferimento immediato). */
export function generateUnexpectedProspect(player: Player, rng: Rng = Math.random): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const [biggerClub] = pickClubs(eligibleClubs(player.ovr + 10, player.club.id), 1, rng);
  return {
    id: `unexpected-prospect-${player.age}`,
    category: "narrative",
    title: "Prospetto inatteso",
    description:
      "Un ex giocatore ti nota e si offre come mentore, ma un procuratore ti propone di cercare subito una squadra più ambiziosa.",
    options: [
      {
        id: "accept-mentor",
        label: "Accetta il mentore",
        club: player.club,
        hint: "Crescita costante nel tempo",
        outcomes: [
          outcome(100, "Il mentore ti guida con pazienza: cresci con calma ma in modo solido.", 3),
        ],
      },
      signOption(
        "look-for-way-out",
        `Cerca una via d'uscita al ${biggerClub.name}`,
        biggerClub,
        `Il procuratore ti porta subito al ${biggerClub.name}.`,
      ),
    ],
  };
}

export function isTriumphantReturnEligible(player: Player): boolean {
  if (!player.club) return false;
  const firstClub = player.clubHistory[0]?.club;
  if (!firstClub) return false;
  return player.age >= 32 && firstClub.id !== player.club.id;
}

/** Offerta di tornare al primo club della carriera per chiuderla lì dove è iniziata. */
export function generateTriumphantReturn(player: Player): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare questo evento");
  }
  const firstClub = player.clubHistory[0]?.club;
  if (!firstClub) {
    throw new Error("Serve un primo club in clubHistory per generare questo evento");
  }
  return {
    id: `triumphant-return-${player.age}`,
    category: "narrative",
    title: "Ritorno trionfale",
    description: `Il ${firstClub.name}, il club dove tutto è iniziato, ti offre di tornare per chiudere lì la carriera.`,
    options: [
      {
        id: "stay",
        label: `Resta al ${player.club.name}`,
        club: player.club,
        outcomes: [outcome(100, "Rimani dove sei: i tifosi di casa restano in attesa.")],
      },
      signOption(
        "return",
        `Torna al ${firstClub.name}`,
        firstClub,
        `Torni al ${firstClub.name} per chiudere la carriera dove è iniziata.`,
      ),
    ],
  };
}

// ---------- Cambio nazionalità ("nonno di un altro paese") ----------

const NATIONALITY_SWITCH_MIN_AGE = 18;
const NATIONALITY_SWITCH_MAX_AGE = 26;

/**
 * Eleggibile solo prima della prima convocazione: una volta rappresentata una nazionale
 * maggiore, le regole FIFA reali non permettono più di cambiare — evita così di dover decidere
 * cosa fare di trofei/statistiche di nazionale già accumulati, perché a quel punto non esistono.
 */
export function isNationalitySwitchEligible(player: Player): boolean {
  return (
    !player.nationalTeam.called &&
    !player.hasSwitchedNationality &&
    player.age >= NATIONALITY_SWITCH_MIN_AGE &&
    player.age <= NATIONALITY_SWITCH_MAX_AGE
  );
}

export function generateNationalitySwitch(player: Player, rng: Rng = Math.random): Decision {
  const alternatives = countries.filter((c) => c.name !== player.nationality);
  const newCountryName = shuffle(alternatives, rng)[0]?.name ?? player.nationality;
  return {
    id: `nationality-switch-${player.age}`,
    category: "narrative",
    title: "Un nonno di un altro paese",
    description: `Scopri di avere un nonno ${newCountryName}: potresti essere eleggibile per giocare con quella nazionale invece che con la tua.`,
    options: [
      {
        id: "stay",
        label: "Resta fedele alla tua nazionalità",
        outcomes: [outcome(100, "Decidi di restare fedele alla nazionalità di sempre.")],
      },
      {
        id: "switch",
        label: `Scegli la nazionalità ${newCountryName}`,
        newNationality: newCountryName,
        outcomes: [outcome(100, `Cambi nazionalità sportiva: da oggi rappresenti ${newCountryName}.`)],
      },
    ],
  };
}

// ---------- Convocazione in nazionale ----------

const NATIONAL_CALLUP_OVR_BASELINE = 79;
const NATIONAL_CALLUP_OVR_DIVISOR = 35;
const NATIONAL_CALLUP_CHANCE_CAP = 0.45;

/** Probabilità di convocazione per ciclo — soglia più generosa dell'originale (vedi piano). */
export function nationalCallupChance(ovr: number): number {
  if (ovr < NATIONAL_CALLUP_OVR_BASELINE) return 0;
  return clamp(
    (ovr - NATIONAL_CALLUP_OVR_BASELINE) / NATIONAL_CALLUP_OVR_DIVISOR,
    0,
    NATIONAL_CALLUP_CHANCE_CAP,
  );
}

export function rollNationalCallup(player: Player, rng: Rng = Math.random): boolean {
  if (player.nationalTeam.called) return false;
  if (isNationalTeamBanned(player.shadow)) return false;
  const chance = clamp(
    nationalCallupChance(player.ovr) * shadowMultiplier(player.shadow) + playStyleCallupBonus(player.playStyles),
    0,
    1,
  );
  return rng() < chance;
}

// ---------- Coppa continentale — rigore decisivo ----------

export function penaltyScoreChance(ovr: number): number {
  return clamp(0.55 + (ovr - 70) / 200, 0.4, 0.85);
}

interface ContinentalFinalTemplate {
  id: string;
  title: string;
  description: (competition: string) => string;
  winText: (competition: string) => string;
  loseText: (competition: string) => string;
  labelA: string;
  labelB: string;
}

/**
 * Varianti narrative dello stesso momento (finale decisa da un'unica azione, esito binario) —
 * gli `id` delle opzioni restano sempre "left"/"right": PenaltyShootout.tsx li usa per
 * l'animazione, quindi nessuna modifica UI è necessaria cambiando solo testo/label qui.
 */
const CONTINENTAL_FINAL_TEMPLATES: ContinentalFinalTemplate[] = [
  {
    id: "penalty",
    title: "Rigore decisivo",
    description: (c) => `Devi decidere la finale di ${c} dal dischetto.`,
    winText: (c) => `Gol! Vinci la finale di ${c}.`,
    loseText: (c) => `Il portiere para il rigore. Perdi la finale di ${c}.`,
    labelA: "Sinistra",
    labelB: "Destra",
  },
  {
    id: "header-90",
    title: "Colpo di testa al 90'",
    description: (c) => `Un cross arriva in area nell'ultimo minuto della finale di ${c}: hai una sola occasione.`,
    winText: (c) => `Stacchi più in alto di tutti: gol! Vinci la finale di ${c}.`,
    loseText: (c) => `Il pallone esce di un soffio. Perdi la finale di ${c}.`,
    labelA: "Anticipa in tuffo",
    labelB: "Stacca di forza",
  },
  {
    id: "shootout-last-kick",
    title: "Ultimo rigore della serie",
    description: (c) => `Serie di rigori sul 5-5: dal tuo tiro dipende la finale di ${c}.`,
    winText: (c) => `Angolo perfetto, portiere spiazzato: vinci la finale di ${c}!`,
    loseText: (c) => `Il portiere intuisce l'angolo. Perdi la finale di ${c}.`,
    labelA: "Angolo basso",
    labelB: "Angolo alto",
  },
];

export function generateContinentalFinalDecision(
  player: Player,
  competition: string,
  rng: Rng = Math.random,
): Decision {
  const template =
    CONTINENTAL_FINAL_TEMPLATES[Math.floor(rng() * CONTINENTAL_FINAL_TEMPLATES.length)] ??
    CONTINENTAL_FINAL_TEMPLATES[0];
  const scoreChance = Math.round(penaltyScoreChance(player.ovr) * 100);
  const outcomes = (): DecisionOutcome[] => [
    { ...outcome(scoreChance, template.winText(competition)), continentalWin: true },
    outcome(100 - scoreChance, template.loseText(competition), -1),
  ];
  return {
    id: `continental-final-${template.id}-${player.age}`,
    category: "continental-final",
    title: template.title,
    description: template.description(competition),
    options: [
      { id: "left", label: template.labelA, hint: "Vittoria continentale · rischio delusione", outcomes: outcomes() },
      { id: "right", label: template.labelB, hint: "Vittoria continentale · rischio delusione", outcomes: outcomes() },
    ],
  };
}

// ---------- Sorpresa di coppa — "Giant Killer" ----------

/** Scarto minimo di prestige richiesto per considerare un club avversario una "corazzata". */
const CUP_UPSET_OPPONENT_PRESTIGE_GAP = 2;

/**
 * Cerca un avversario molto più quotato per la sorpresa di coppa — stesso paese se possibile
 * (fallback su un pool globale se il paese non ha un club abbastanza forte, difensivo: con la
 * distribuzione di prestige 3/3/2/2/1/1/0/0 usata per ogni paese, il fallback resta teorico).
 */
export function pickCupUpsetOpponent(club: Club, rng: Rng = Math.random): Club {
  const sameCountryGiants = clubsByCountry(club.country).filter(
    (c) => c.id !== club.id && c.prestige >= club.prestige + CUP_UPSET_OPPONENT_PRESTIGE_GAP,
  );
  const globalGiants = clubs.filter((c) => c.id !== club.id && c.prestige >= 2);
  const pool = sameCountryGiants.length > 0 ? sameCountryGiants : globalGiants;
  const chosen = pickClubs(pool, 1, rng)[0];
  return chosen ?? clubs.reduce((best, c) => (c.prestige > best.prestige ? c : best), club);
}

const CUP_UPSET_BASE_CHANCE = 0.28;
const CUP_UPSET_OVR_BASELINE = 65;
const CUP_UPSET_OVR_DIVISOR = 250;
const CUP_UPSET_GAP_PENALTY = 0.03;
const CUP_UPSET_CHANCE_FLOOR = 0.15;
const CUP_UPSET_CHANCE_CAP = 0.45;

/**
 * Probabilità di completare la sorpresa — deliberatamente sotto il 50%, è per definizione un
 * evento improbabile. Valori provvisori, da confermare con l'harness (npm run simulate) come
 * ogni altra costante probabilistica in questo file.
 */
export function cupUpsetWinChance(ovr: number, clubPrestige: number, opponentPrestige: number): number {
  const gap = opponentPrestige - clubPrestige;
  const base = CUP_UPSET_BASE_CHANCE + Math.max(ovr - CUP_UPSET_OVR_BASELINE, 0) / CUP_UPSET_OVR_DIVISOR;
  return clamp(base - gap * CUP_UPSET_GAP_PENALTY, CUP_UPSET_CHANCE_FLOOR, CUP_UPSET_CHANCE_CAP);
}

interface CupUpsetTemplate {
  id: string;
  title: string;
  description: (opponent: string, cup: string) => string;
  winText: (opponent: string, cup: string) => string;
  loseText: (opponent: string, cup: string) => string;
  labelA: string;
  labelB: string;
}

/**
 * Varianti narrative dello stesso momento (stesso schema della finale continentale, ma qui è il
 * club sottodotato a sfidare una corazzata) — gli `id` delle opzioni restano "left"/"right":
 * PenaltyShootout.tsx li usa per l'animazione, nessuna modifica UI necessaria.
 */
const CUP_UPSET_TEMPLATES: CupUpsetTemplate[] = [
  {
    id: "penalty",
    title: "Sorpresa di coppa",
    description: (opp, cup) =>
      `Il ${opp}, corazzata del torneo, è avanti di un gol nei minuti finali di ${cup}. Hai un rigore per pareggiare e ribaltare tutto.`,
    winText: (opp, cup) => `Gol! Il tuo club sovverte il pronostico e batte il ${opp} in ${cup}.`,
    loseText: (opp, cup) => `Il portiere del ${opp} para tutto. Il sogno finisce qui in ${cup}.`,
    labelA: "Angolo basso",
    labelB: "Angolo alto",
  },
  {
    id: "breakaway",
    title: "Contropiede all'ultimo respiro",
    description: (opp, cup) =>
      `Contro ogni pronostico sei solo davanti al portiere del ${opp}, nel recupero di ${cup}.`,
    winText: (opp, cup) => `Freddezza assoluta: batti il portiere e regali l'impresa contro il ${opp} in ${cup}!`,
    loseText: (opp, cup) => `Il portiere del ${opp} chiude lo specchio. Niente impresa in ${cup}.`,
    labelA: "Tiro sul primo palo",
    labelB: "Pallonetto",
  },
];

/** Popularità di consolazione alla sconfitta — piccola, la sorpresa mancata resta comunque un momento sentito. */
const CUP_UPSET_LOSS_POPULARITY_BONUS = 3;

export function generateCupUpsetDecision(
  player: Player,
  opponent: Club,
  cup: string,
  rng: Rng = Math.random,
): Decision {
  const template =
    CUP_UPSET_TEMPLATES[Math.floor(rng() * CUP_UPSET_TEMPLATES.length)] ?? CUP_UPSET_TEMPLATES[0];
  const winChance = Math.round(
    cupUpsetWinChance(player.ovr, player.club?.prestige ?? 0, opponent.prestige) * 100,
  );
  const outcomes = (): DecisionOutcome[] => [
    { ...outcome(winChance, template.winText(opponent.name, cup)), cupUpsetWin: true },
    economicOutcome(100 - winChance, template.loseText(opponent.name, cup), {
      popularityDelta: CUP_UPSET_LOSS_POPULARITY_BONUS,
    }),
  ];
  return {
    id: `cup-upset-${template.id}-${player.age}`,
    category: "cup-upset",
    title: template.title,
    description: template.description(opponent.name, cup),
    options: [
      { id: "left", label: template.labelA, hint: "Sorpresa di coppa · rischio delusione", outcomes: outcomes() },
      { id: "right", label: template.labelB, hint: "Sorpresa di coppa · rischio delusione", outcomes: outcomes() },
    ],
  };
}

const DECISIVE_MATCH_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede"];

export function decisiveMatchWinWeight(player: Player, system: TacticalSystem): number {
  let win = 40;
  const preferred = playerPreferredSystem(player.attributes, player.position);
  if (preferred === system) win += 14;
  if (player.club && clubTacticalSystem(player.club) === system) win += 10;
  if (player.club && tacticalFit(player, player.club) === "ottimo" && preferred === system) win += 6;
  return clamp(win, 28, 72);
}

function decisiveMatchHint(player: Player, system: TacticalSystem): string {
  const preferred = playerPreferredSystem(player.attributes, player.position);
  const clubSystem = player.club ? clubTacticalSystem(player.club) : null;
  if (preferred === system && clubSystem === system) return "Il tuo stile · sistema della squadra";
  if (preferred === system) return "Il tuo stile";
  if (clubSystem === system) return "Sistema della squadra";
  return "Scelta tattica";
}

export function generateDecisiveMatchDecision(player: Player): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare una partita decisiva");
  }
  const league = player.club.competitions.league;
  const trophyBrief =
    player.currentObjective?.kind === "trophy"
      ? " Il mister ha chiesto un trofeo: questa partita può chiudere il brief."
      : "";
  return {
    id: `decisive-match-${player.age}`,
    category: "decisive-match",
    title: "Partita decisiva",
    description: `Ultima giornata: il ${player.club.name} si gioca ${league}. Il mister ti chiede come affrontare la partita.${trophyBrief}`,
    options: DECISIVE_MATCH_SYSTEMS.map((system) => {
      const win = decisiveMatchWinWeight(player, system);
      return {
        id: `tactic-${system}`,
        label: TACTICAL_SYSTEM_LABELS[system],
        hint: decisiveMatchHint(player, system),
        outcomes: [
          {
            ...outcome(win, `Il piano funziona: sollevi il trofeo di ${league}.`),
            leagueWin: true,
          },
          outcome(100 - win, "Il piano non basta: il titolo sfuma all'ultimo."),
        ],
      };
    }),
  };
}

// ---------- Sponsor/endorsement ----------

const SPONSOR_ELIGIBILITY_POPULARITY = 25;

export function isSponsorEligible(player: Pick<Player, "popularity">): boolean {
  return player.popularity >= SPONSOR_ELIGIBILITY_POPULARITY;
}

function economicOutcome(
  weight: number,
  resultText: string,
  effect: Pick<PlayerDelta, "savingsDelta" | "popularityDelta" | "traitsDelta" | "shadowDelta" | "relationsDelta">,
): DecisionOutcome {
  return { weight, effect, resultText };
}

interface SponsorDealTemplate {
  id: string;
  title: string;
  description: string;
  savingsGain: number;
}

const SPONSOR_DEAL_TEMPLATES: SponsorDealTemplate[] = [
  {
    id: "sportswear-brand",
    title: "Contratto con un brand sportivo",
    description: "Un marchio di scarpe sportive ti propone un contratto da testimonial.",
    savingsGain: 150_000,
  },
  {
    id: "energy-drink",
    title: "Testimonial di una bibita energetica",
    description: "Un'azienda di bevande energetiche vuole il tuo volto in campagna pubblicitaria.",
    savingsGain: 90_000,
  },
  {
    id: "watch-brand",
    title: "Ambasciatore di un marchio di orologi",
    description: "Un marchio di orologi di lusso ti propone di diventarne ambasciatore.",
    savingsGain: 220_000,
  },
  {
    id: "streaming-platform",
    title: "Serie documentario su una piattaforma streaming",
    description: "Una piattaforma di streaming vuole produrre un documentario sulla tua carriera.",
    savingsGain: 180_000,
  },
  {
    id: "video-game-cover",
    title: "Copertina di un videogioco di calcio",
    description: "Un editore di videogiochi ti propone la copertina del prossimo capitolo della serie.",
    savingsGain: 130_000,
  },
];

export function generateSponsorDeal(player: Player, rng: Rng = Math.random): Decision {
  const template =
    SPONSOR_DEAL_TEMPLATES[Math.floor(rng() * SPONSOR_DEAL_TEMPLATES.length)] ??
    SPONSOR_DEAL_TEMPLATES[0];
  return {
    id: `sponsor-${template.id}-${player.age}`,
    category: "sponsor",
    title: template.title,
    description: template.description,
    options: [
      {
        id: "accept",
        label: "Accetta",
        hint: "Guadagno assicurato · popolarità incerta",
        outcomes: [
          economicOutcome(70, "L'accordo va in porto: incassi e popolarità in crescita.", {
            savingsDelta: template.savingsGain,
            popularityDelta: 4,
            traitsDelta: { showmanship: 4 },
          }),
          economicOutcome(30, "Un dettaglio del contratto genera polemiche.", {
            savingsDelta: template.savingsGain,
            popularityDelta: -3,
            traitsDelta: { showmanship: 4 },
          }),
        ],
      },
      {
        id: "decline",
        label: "Rifiuta",
        hint: "Nessun rischio",
        outcomes: [economicOutcome(100, "Rifiuti l'offerta, nulla cambia.", {})],
      },
    ],
  };
}

// ---------- Scandalo forzato e redenzione (debito morale) ----------

/**
 * Evento forzato (non passa dal pick di categoria normale, vedi `shouldTriggerScandal` in
 * `shadow.ts` e il wiring in `loop.ts`) quando il debito morale supera la soglia di scandalo.
 */
export function generateScandalDecision(player: Player): Decision {
  return {
    id: `scandal-${player.age}`,
    category: "scandal",
    title: "Scandalo mediatico",
    description: "Una serie di voci sul tuo conto esplode sui media: la stampa chiede una presa di posizione.",
    options: [
      {
        id: "come-clean",
        label: "Gestisci con trasparenza",
        hint: "Ripulisci la tua immagine · popolarità in calo",
        outcomes: [
          outcome(100, "Affronti la stampa a viso aperto: la vicenda si sgonfia lentamente.", 0, {
            shadowDelta: -12,
            popularityDelta: -5,
            shadowFlags: { scandalOccurred: true },
          }),
        ],
      },
      {
        id: "deny-everything",
        label: "Nega tutto",
        hint: "Nessuna ammissione · il caso resta aperto",
        outcomes: [
          outcome(100, "Neghi ogni accusa, ma la stampa non molla la presa.", 0, {
            shadowDelta: 5,
            popularityDelta: -10,
            shadowFlags: { scandalOccurred: true },
          }),
        ],
      },
    ],
  };
}

/** Evento narrativo unico, eleggibile solo dopo uno scandalo affrontato e sceso sotto soglia (vedi `isRedemptionEligible` in `shadow.ts`). */
export function generateRedemptionDecision(player: Player): Decision {
  return {
    id: `redemption-${player.age}`,
    category: "narrative",
    title: "Riabilitazione pubblica",
    description: "Dopo mesi lontano dai riflettori, hai l'occasione di raccontare la tua versione e voltare pagina.",
    options: [
      {
        id: "public-rehabilitation",
        label: "Racconta la tua storia",
        outcomes: [
          outcome(100, "Il pubblico apprezza la tua onestà: la pagina è voltata.", 0, {
            popularityDelta: 6,
            shadowFlags: { redeemed: true },
          }),
        ],
      },
    ],
  };
}

// ---------- Cambio di ruolo (funzionale, non più cosmetico) ----------

/** Ruoli "vicini" raggiungibili in un cambio — mai GK↔outfield, cambio troppo drastico e
 * fuori scope. Gli attributi non vengono rimappati: restano gli stessi numeri, ma da quel
 * momento si ripesano da soli per il nuovo ruolo (vedi deriveOvrFromAttributes/ROLE_WEIGHTS). */
const POSITION_CHANGE_ADJACENCY: Partial<Record<Position, Position[]>> = {
  LB: ["LM", "CB"],
  RB: ["RM", "CB"],
  CB: ["CDM"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "CAM"],
  CAM: ["CM"],
  LM: ["LW", "LB"],
  RM: ["RW", "RB"],
  LW: ["LM"],
  RW: ["RM"],
  ST: ["CAM"],
};

/** Target preferiti quando il calo fisico innesca la riconversione (può uscire dall'adiacenza stretta). */
const DECLINE_PREFERRED_TARGETS: Partial<Record<Position, Position[]>> = {
  LW: ["CAM", "LM"],
  RW: ["CAM", "RM"],
  ST: ["CAM"],
  LM: ["CAM", "CM"],
  RM: ["CAM", "CM"],
  LB: ["CB"],
  RB: ["CB"],
};

const PHYSICAL_DECLINE_MIN_AGE = 29;
const PHYSICAL_DECLINE_DROP = 6;

export function isPhysicalDeclineReconversion(player: Player): boolean {
  if (player.position === "GK" || player.age < PHYSICAL_DECLINE_MIN_AGE) return false;
  if (player.attributes.kind !== "outfield") return false;
  const peaks = player.attributePeaks ?? peaksFromAttributes(player.attributes);
  const paceDrop = peaks.pace - player.attributes.pace;
  const physDrop = peaks.physical - player.attributes.physical;
  return paceDrop >= PHYSICAL_DECLINE_DROP || physDrop >= PHYSICAL_DECLINE_DROP;
}

export function generatePositionChangeDecision(player: Player, rng: Rng = Math.random): Decision {
  const decline = isPhysicalDeclineReconversion(player);
  const adjacent = POSITION_CHANGE_ADJACENCY[player.position] ?? [];
  const preferred = DECLINE_PREFERRED_TARGETS[player.position];
  const targets = decline && preferred ? preferred : adjacent;
  const options: DecisionOption[] = targets.map((newPosition) => ({
    id: `switch-to-${newPosition}`,
    label: `Diventa ${POSITION_LABELS[newPosition]}`,
    hint: decline
      ? "Meno dipendenza dalla corsa · adattamento costoso in OVR"
      : "Più minutaggio nel nuovo ruolo · adattamento costoso in OVR",
    newPosition,
    outcomes: [
      outcome(100, `Ti riadatti al ruolo di ${POSITION_LABELS[newPosition]}: serve tempo per l'ambientamento.`, -2),
    ],
  }));
  options.push({
    id: "reject-position",
    label: "Rifiuta",
    hint: "Meno minutaggio · mantieni il ruolo",
    outcomes: [outcome(100, "Giochi con meno minutaggio.")],
  });
  return {
    id: `position-change-${player.age}-${Math.round(rng() * 1000)}`,
    category: "position-change",
    title: decline ? "Riconversione di ruolo" : "Cambio di ruolo",
    description: decline
      ? "Il fisico non è più quello di una volta. Il mister ti propone un ruolo meno dipendente dalla corsa."
      : "Il mister ha bisogno che tu copra un'altra posizione.",
    options,
  };
}

export function isCoachRoleRequestEligible(player: Player): boolean {
  if (player.position === "GK") return false;
  const coach = getRelation(player, "coach");
  if (!coach || coach.affinity < 1) return false;
  const targets = POSITION_CHANGE_ADJACENCY[player.position] ?? [];
  return targets.length > 0;
}

/** Il mister, se c'è affinità, chiede un cambio ruolo — evento condizionato nel pool club-crisis. */
export function generateCoachRoleRequest(player: Player): Decision {
  const coach = getRelation(player, "coach");
  const coachName = coach?.name ?? "Il mister";
  const adjacent = POSITION_CHANGE_ADJACENCY[player.position] ?? [];
  const options: DecisionOption[] = adjacent.map((newPosition) => ({
    id: `switch-to-${newPosition}`,
    label: `Diventa ${POSITION_LABELS[newPosition]}`,
    hint: "Fiducia del mister · adattamento costoso in OVR",
    newPosition,
    outcomes: [
      outcome(100, `${coachName} ti sposta a ${POSITION_LABELS[newPosition]}: serve tempo per l'ambientamento.`, -2, {
        relationsDelta: { coach: 1 },
      }),
    ],
  }));
  options.push({
    id: "reject-coach-role",
    label: "Rifiuta",
    hint: "Mantieni il ruolo · il mister non la prende bene",
    outcomes: [outcome(100, `Rifiuti la proposta di ${coachName}.`, 0, { relationsDelta: { coach: -1 } })],
  });
  return {
    id: `coach-role-request-${player.age}`,
    category: "club-crisis",
    title: "Il mister ti chiede il cambio ruolo",
    description: `${coachName} si fida di te e ti chiede di coprire un'altra posizione.`,
    options,
  };
}

export function isAgentGreyDealEligible(player: Player): boolean {
  const agent = getRelation(player, "agent");
  return Boolean(agent && agent.affinity <= -1);
}

/** L'agente, se l'affinità è bassa, propone un accordo opaco — evento condizionato nel pool narrative. */
export function generateAgentGreyDeal(player: Player): Decision {
  const agent = getRelation(player, "agent");
  const agentName = agent?.name ?? "Il tuo procuratore";
  return {
    id: `agent-grey-deal-${player.age}`,
    category: "narrative",
    title: "Un favore in grigio",
    description: `${agentName} ti propone un accordo opaco: soldi subito, poche domande.`,
    options: [
      {
        id: "accept-grey",
        label: "Accetta",
        hint: "Soldi subito · debito morale",
        outcomes: [
          economicOutcome(100, `Incassi in silenzio. ${agentName} non dimentica il favore.`, {
            savingsDelta: 80_000,
            shadowDelta: 12,
            relationsDelta: { agent: 1 },
          }),
        ],
      },
      {
        id: "refuse-grey",
        label: "Rifiuta",
        hint: "Niente soldi · l'agente se la prende",
        outcomes: [
          economicOutcome(100, `Rifiuti. ${agentName} non la prende bene.`, {
            relationsDelta: { agent: -1 },
          }),
        ],
      },
    ],
  };
}

// ---------- Focus di allenamento (crescita mirata degli attributi) ----------

export function generateTrainingFocusDecision(player: Player): Decision {
  const keys = attributeKeysForPosition(player.position);
  const options: DecisionOption[] = keys.map((key: AttributeKey) => ({
    id: `focus-${key}`,
    label: `Concentrati su: ${ATTRIBUTE_LABELS[key]}`,
    hint: "Crescita più rapida su questo attributo nella prossima stagione",
    trainingFocus: key,
    outcomes: [outcome(100, `Ti alleni con priorità su ${ATTRIBUTE_LABELS[key]}.`, 0, {
      traitsDelta: { discipline: 2 },
    })],
  }));
  options.push({
    id: "focus-balanced",
    label: "Allenamento bilanciato",
    hint: "Crescita uniforme su tutti gli attributi",
    trainingFocus: null,
    outcomes: [outcome(100, "Ti alleni in modo equilibrato su tutti gli aspetti del gioco.")],
  });
  return {
    id: `training-focus-${player.age}`,
    category: "training-focus",
    title: "Piano di allenamento",
    description: "Il preparatore ti chiede su cosa vuoi concentrarti nella prossima stagione.",
    options,
  };
}

// ---------- Procuratore: negoziazione della clausola rescissoria ----------

export function isAgentEligible(player: Pick<Player, "club" | "releaseClauseEur">): boolean {
  return player.club !== null && player.releaseClauseEur > 0;
}

const AGENT_CLAUSE_UP_MULTIPLIER = 1.3;
const AGENT_CLAUSE_DOWN_MULTIPLIER = 0.7;

/** Negoziazione col procuratore: alza/abbassa la clausola in cambio di sicurezza/mobilità di
 * mercato — non è una firma (nessun `option.club`), quindi la nuova clausola va impostata
 * direttamente nell'effetto invece di lasciarla ricalcolare da `signWithClub`. */
export function generateAgentNegotiation(player: Pick<Player, "age" | "releaseClauseEur" | "relations">): Decision {
  const higherClause = Math.round((player.releaseClauseEur * AGENT_CLAUSE_UP_MULTIPLIER) / 1000) * 1000;
  const lowerClause = Math.round((player.releaseClauseEur * AGENT_CLAUSE_DOWN_MULTIPLIER) / 1000) * 1000;
  const agent = getRelation(player, "agent");
  const agentName = agent?.name ?? "Il tuo procuratore";
  return {
    id: `agent-negotiation-${player.age}`,
    category: "agent",
    title: agent ? agent.name : "Il tuo procuratore",
    description: `${agentName} propone di rinegoziare i termini contrattuali col club.`,
    options: [
      {
        id: "raise-clause",
        label: "Clausola più alta",
        hint: "Il club ti blinda · meno libertà di mercato",
        outcomes: [
          outcome(100, "Il club accetta di blindarti con una clausola più alta.", 0, {
            releaseClauseEur: higherClause,
            traitsDelta: { loyalty: 4, ambition: -2 },
            relationsDelta: { agent: 1 },
          }),
        ],
      },
      {
        id: "lower-clause",
        label: "Clausola più bassa",
        hint: "Più libertà di mercato · più occhi dai rivali",
        outcomes: [
          outcome(100, "Il procuratore ottiene una clausola più bassa: più margine per un futuro trasferimento.", 0, {
            releaseClauseEur: lowerClause,
            traitsDelta: { ambition: 4, loyalty: -2 },
            relationsDelta: { agent: 1 },
          }),
        ],
      },
      {
        id: "leave-clause-as-is",
        label: "Lascia invariato",
        hint: "Nessun cambiamento",
        outcomes: [outcome(100, "Decidi di non toccare i termini del contratto per ora.")],
      },
    ],
  };
}

// ---------- Attivazione forzata della clausola rescissoria ----------

const CLAUSE_ACTIVATION_BASE_CHANCE = 0.05;
const CLAUSE_ACTIVATION_BARGAIN_SCALAR = 0.08;
const CLAUSE_ACTIVATION_CHANCE_CAP = 0.3;
const CLAUSE_ACTIVATION_REJECT_CLAUSE_MULTIPLIER = 1.4;

/** Pool di potenziali pretendenti (prestigio superiore al club corrente) — nessun RNG, per
 * poter verificare l'esistenza di un pretendente prima di consumare un roll (stesso principio
 * già seguito da `shouldTriggerCupUpset`, che verifica una condizione deterministica). */
export function clauseActivationSuitorPool(player: Pick<Player, "club" | "ovr">): Club[] {
  if (!player.club) return [];
  return eligibleClubs(player.ovr, player.club.id).filter((c) => c.prestige > player.club!.prestige);
}

/** Un pretendente di prestigio superiore, scelto a caso nel pool — `null` se il pool è vuoto. */
export function pickClauseActivationSuitor(player: Player, rng: Rng = Math.random): Club | null {
  const [suitor] = pickClubs(clauseActivationSuitorPool(player), 1, rng);
  return suitor ?? null;
}

/**
 * Probabilità che un rivale attivi la clausola in questo ciclo — più la clausola è "conveniente"
 * rispetto al market value corrente (non rinegoziata verso l'alto, vedi categoria "agent" sopra),
 * più il rischio sale. Dà un significato meccanico reale alle scelte fatte nella negoziazione.
 */
export function clauseActivationChance(player: Pick<Player, "marketValueEur" | "releaseClauseEur">): number {
  if (player.releaseClauseEur <= 0) return 0;
  const bargainRatio = Math.max(player.marketValueEur / player.releaseClauseEur - 1, 0);
  return clamp(
    CLAUSE_ACTIVATION_BASE_CHANCE + bargainRatio * CLAUSE_ACTIVATION_BARGAIN_SCALAR,
    0,
    CLAUSE_ACTIVATION_CHANCE_CAP,
  );
}

/** Evento forzato (non passa dal pick di categoria normale, vedi `shouldTriggerClauseActivation`
 * in `loop.ts`): un club rivale deposita la clausola rescissoria del giocatore. */
export function generateClauseActivationDecision(player: Player, suitor: Club): Decision {
  if (!player.club) {
    throw new Error("Serve un club corrente per generare l'attivazione della clausola");
  }
  const currentClub = player.club;
  return {
    id: `clause-activation-${player.age}`,
    category: "clause-activation",
    title: "Clausola rescissoria attivata",
    description: `Il ${suitor.name} deposita la tua clausola rescissoria al ${currentClub.name} e chiede la cessione immediata.`,
    options: [
      signOption(
        "accept-clause-transfer",
        `Accetta il trasferimento al ${suitor.name}`,
        suitor,
        `Il trasferimento si chiude in poche ore: sei un nuovo giocatore del ${suitor.name}.`,
        { traitsDelta: { ambition: 6, loyalty: -4 } },
      ),
      {
        id: "reject-clause-transfer",
        label: `Resta al ${currentClub.name}`,
        hint: "Il procuratore respinge l'offerta · clausola rinegoziata verso l'alto",
        outcomes: [
          outcome(
            100,
            `Il tuo procuratore convince il ${currentClub.name} a blindarti con una clausola più alta.`,
            0,
            {
              releaseClauseEur: Math.round(
                (player.releaseClauseEur * CLAUSE_ACTIVATION_REJECT_CLAUSE_MULTIPLIER) / 1000,
              ) * 1000,
              popularityDelta: 3,
              traitsDelta: { loyalty: 5 },
            },
          ),
        ],
      },
    ],
  };
}

// ---------- Selezione pesata della categoria, con penalità anti-ripetizione ----------

const BASE_CATEGORY_WEIGHTS: Partial<Record<DecisionCategory, number>> = {
  transfer: 25,
  loan: 12,
  "loan-return": 8,
  "position-change": 8,
  "club-crisis": 12,
  "end-of-cycle": 10,
  lifestyle: 18,
  // Nonostante 6 generatori (5 + cambio nazionalità/redenzione), ognuno resta filtrato
  // individualmente per eleggibilità: un peso più alto qui non li fa scattare troppo spesso,
  // solo li rende visibili quando sono davvero disponibili — confermato con l'harness (npm run
  // simulate, sessione di bilanciamento 2026-08-10): frequenza osservata ~7% dei cicli totali,
  // in linea con l'eleggibilità gating atteso, nessun aggiustamento di peso necessario.
  narrative: 12,
  sponsor: 10,
  // Confermato con l'harness (npm run simulate, sessione di bilanciamento 2026-08-10): ~8% dei
  // cicli totali, in linea col peso nominale una volta scontata l'alternanza con le altre
  // categorie — nessun aggiustamento necessario.
  "training-focus": 14,
  // Peso provvisorio, da confermare con l'harness (npm run simulate) — vedi sessione
  // "Compatibilità tattica + Contratti/Agenti".
  agent: 10,
};

const DEFAULT_CATEGORY_WEIGHT = 5;
const REPEAT_PENALTY = 0.15;
const OBJECTIVE_MISS_CRISIS_MULTIPLIER = 1.4;
const OBJECTIVE_MISS_END_CYCLE_MULTIPLIER = 1.3;
const OBJECTIVE_MET_TRANSFER_MULTIPLIER = 0.75;

/** Pressione del brief del mister sul ciclo successivo (campi di LoopContext, niente import circolare). */
export interface ObjectivePressure {
  lastObjectiveMet?: boolean;
  objectiveMissStreak?: number;
}

/** Moltiplicatore di peso in base allo stato del giocatore — prestito/rinnovo/mercato come conseguenze. */
export function categoryWeightMultiplier(
  category: DecisionCategory,
  player?: Player,
  pressure?: ObjectivePressure,
): number {
  let multiplier = 1;
  if (player) {
    if (category === "loan") {
      if (player.age <= 21 && player.ovr < 70) multiplier = 1.6;
      else if (player.ovr >= 80 || player.age >= 25) multiplier = 0.08;
      else multiplier = 0.5;
    } else if (category === "end-of-cycle") {
      const prestige = player.club?.prestige ?? 0;
      if (player.ovr >= 82 && prestige >= 2 && !player.injury) multiplier = 0.15;
      else if (player.age >= 32 || player.shadow >= 28 || player.injury) multiplier = 1.8;
      else if (player.ovr < 60) multiplier = 1.4;
      else multiplier = 0.6;
    } else if (category === "transfer") {
      const archetype = deriveArchetype(player.traits, player.shadow).primary;
      if (archetype === "flagbearer" || player.traits.loyalty >= 58) multiplier = 0.55;
      else if (archetype === "mercenary") multiplier = 1.35;
    } else if (category === "position-change") {
      multiplier = isPhysicalDeclineReconversion(player) ? 3 : 1;
    }
  }
  const streak = pressure?.objectiveMissStreak ?? 0;
  if (category === "club-crisis" && streak >= 1) multiplier *= OBJECTIVE_MISS_CRISIS_MULTIPLIER;
  if (category === "end-of-cycle" && streak >= 2) multiplier *= OBJECTIVE_MISS_END_CYCLE_MULTIPLIER;
  if (category === "transfer" && pressure?.lastObjectiveMet === true) {
    multiplier *= OBJECTIVE_MET_TRANSFER_MULTIPLIER;
  }
  return multiplier;
}

export function pickDecisionCategory(
  availableCategories: DecisionCategory[],
  recentCategories: DecisionCategory[],
  rng: Rng = Math.random,
  player?: Player,
  pressure?: ObjectivePressure,
): DecisionCategory {
  if (availableCategories.length === 0) {
    throw new Error("Serve almeno una categoria disponibile per scegliere una decisione");
  }
  const weighted = availableCategories.map((category) => {
    const base =
      (BASE_CATEGORY_WEIGHTS[category] ?? DEFAULT_CATEGORY_WEIGHT) *
      categoryWeightMultiplier(category, player, pressure);
    const weight = recentCategories.includes(category) ? base * REPEAT_PENALTY : base;
    return { category, weight };
  });
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  const roll = rng() * total;
  let cumulative = 0;
  for (const w of weighted) {
    cumulative += w.weight;
    if (roll < cumulative) return w.category;
  }
  return weighted[weighted.length - 1].category;
}
