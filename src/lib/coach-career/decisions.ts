import type { Club } from "@/types/career";
import type {
  Coach,
  CoachDecision,
  CoachDecisionOption,
  CoachDecisionOutcome,
  CoachDelta,
  LeagueFinish,
} from "@/types/coach";
import { clamp, type Rng } from "@/lib/career/progression";
import { clubs } from "@/data/clubs";
import { TACTICAL_SYSTEM_LABELS, type TacticalSystem } from "@/lib/career/tactics";
import { expectedLeagueFinishRank, LEAGUE_FINISH_ORDER } from "./season-outcome";
import { rollCoachCycleObjective } from "./coach-satisfaction";

function outcome(weight: number, resultText: string, extra?: Partial<CoachDelta>): CoachDecisionOutcome {
  return { weight, effect: { ...extra }, resultText };
}

function signOption(id: string, label: string, club: Club, resultText: string): CoachDecisionOption {
  return { id, label, club, outcomes: [outcome(100, resultText)] };
}

function withHint(option: CoachDecisionOption, hint: string): CoachDecisionOption {
  return { ...option, hint };
}

/** Fascia di prestigio club a cui l'allenatore può ambire in base alla reputazione — stesso
 * ruolo di `targetPrestige(ovr)` per il calciatore, soglie proprie perché la reputazione parte
 * da 35 (non 50) e cresce più lentamente. */
function coachTargetPrestige(reputation: number): number {
  if (reputation >= 85) return 3;
  if (reputation >= 65) return 2;
  if (reputation >= 45) return 1;
  return 0;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pool di club coerenti con la reputazione corrente (±1 fascia di prestigio); se la fascia
 * attesa non ha club disponibili (es. `minPrestige` più alto della fascia stessa), allarga a
 * qualunque club per non lasciare mai un job-search/end-of-cycle senza offerte. */
function eligibleClubs(reputation: number, excludeId?: string, minPrestige = 0): Club[] {
  const target = Math.max(coachTargetPrestige(reputation), minPrestige);
  const pool = clubs.filter(
    (c) => c.id !== excludeId && c.prestige >= minPrestige && Math.abs(c.prestige - target) <= 1,
  );
  if (pool.length > 0) return pool;
  return clubs.filter((c) => c.id !== excludeId && c.prestige >= minPrestige);
}

function pickClubs(pool: Club[], count: number, rng: Rng): Club[] {
  return shuffle(pool, rng).slice(0, count);
}

const LEAGUE_FINISH_SHORT_LABELS: Record<LeagueFinish, string> = {
  relegated: "Rischio retrocessione",
  "relegation-battle": "Lotta salvezza",
  "mid-table": "Piazzamento tranquillo",
  "continental-qualification": "Corsa europea",
  title: "Corsa al titolo",
};

/** Stesso distinguo di `objectiveLabelFor` in `coach-satisfaction.ts`: a rank 3 fuori dal tier 1
 * non c'è nessuna coppa europea in palio, solo la promozione. */
const SHORT_PROMOTION_LABEL = "Corsa promozione";

/** Anticipazione (solo UI) del livello di pressione atteso a un club, senza esporre la formula. */
function offerHint(club: Club, reputation: number): string {
  const rank = clamp(Math.round(expectedLeagueFinishRank(club.prestige, reputation)), 0, 4);
  const finish = LEAGUE_FINISH_ORDER[rank];
  const label = finish === "continental-qualification" && club.tier > 1 ? SHORT_PROMOTION_LABEL : LEAGUE_FINISH_SHORT_LABELS[finish];
  return `Ci si aspetta: ${label}`;
}

const JOB_SEARCH_OFFERS = 3;

/**
 * Offerte di lavoro — forzata quando `coach.club === null` (mirror di `!player.club` calciatore).
 * A differenza del calciatore non esiste un'opzione "resta svincolato": la lista di club
 * eleggibili non è mai vuota (fallback su tutti i club se la fascia di prestigio attesa non ha
 * candidati), quindi si sceglie sempre un club concreto.
 */
export function generateJobOffers(coach: Coach, rng: Rng = Math.random): CoachDecision {
  const offers = pickClubs(eligibleClubs(coach.reputation), JOB_SEARCH_OFFERS, rng);
  return {
    id: `job-search-${coach.age}`,
    category: "job-search",
    title: "Offerte di lavoro",
    description: "Sei svincolato. Quale panchina accetti?",
    options: offers.map((c) =>
      withHint(signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Firmi per il ${c.name}.`), offerHint(c, coach.reputation)),
    ),
  };
}

const END_OF_CYCLE_OFFERS = 2;

/** Fine ciclo: rinnova, cerca un club più grande, o ritirati — richiede un club corrente (mirror
 * esatto di `generateEndOfCycle` calciatore). */
export function generateCoachEndOfCycle(coach: Coach, rng: Rng = Math.random): CoachDecision {
  if (!coach.club) {
    throw new Error("generateCoachEndOfCycle richiede un club corrente");
  }
  const club = coach.club;
  const offers = pickClubs(eligibleClubs(coach.reputation, club.id, club.prestige), END_OF_CYCLE_OFFERS, rng);

  return {
    id: `end-of-cycle-${coach.age}`,
    category: "end-of-cycle",
    title: "Fine stagione",
    description: "Il contratto è in scadenza. Scegli il prossimo passo della carriera.",
    options: [
      {
        id: "renew",
        label: `Rinnova con il ${club.name}`,
        hint: "Resti alla guida del club, nessun nuovo mandato societario",
        outcomes: [outcome(100, "La società ti conferma alla guida del club.", { popularityDelta: 1 })],
      },
      ...offers.map((c) =>
        withHint(
          signOption(`sign-${c.id}`, `Firma per ${c.name}`, c, `Lasci il ${club.name} e firmi per il ${c.name}.`),
          offerHint(c, coach.reputation),
        ),
      ),
      {
        id: "retire",
        label: "Ritirati",
        retire: true,
        outcomes: [outcome(100, "Chiudi la carriera da allenatore.")],
      },
    ],
  };
}

/**
 * Brief societario per il ciclo — un'unica opzione (mirror concettuale di come il calciatore
 * riceve `currentObjective` come roll automatico a fine ciclo, reso qui un evento a sé stante per
 * dare peso narrativo alla pressione societaria). L'obiettivo mostrato è deterministico
 * (`rollCoachCycleObjective` non usa RNG), quindi il testo generato qui e l'obiettivo
 * effettivamente impostato da `resolveCoachCycle` restano sempre coerenti.
 */
export function generateBoardBrief(coach: Coach): CoachDecision {
  if (!coach.club) {
    throw new Error("generateBoardBrief richiede un club corrente");
  }
  const objective = rollCoachCycleObjective(coach.club, coach.reputation);
  return {
    id: `board-brief-${coach.age}`,
    category: "board-brief",
    title: "Il brief della società",
    description: objective.label,
    options: [
      {
        id: "accept-brief",
        label: "Accetta il brief",
        outcomes: [outcome(100, "Prendi nota dell'obiettivo stagionale della società.")],
      },
    ],
  };
}

const TACTICAL_SYSTEMS: TacticalSystem[] = ["possesso", "pressing", "contropiede", "diretto"];

/** Identità tattica dell'allenatore — mirror di `generateTrainingFocusDecision` calciatore. */
export function generateTacticalIdentityDecision(coach: Coach): CoachDecision {
  const options: CoachDecisionOption[] = TACTICAL_SYSTEMS.map((system) => ({
    id: `system-${system}`,
    label: `Adotta: ${TACTICAL_SYSTEM_LABELS[system]}`,
    hint: system === coach.preferredSystem ? "Identità attuale" : "Cambia identità tattica",
    newSystem: system,
    outcomes: [outcome(100, `Adotti ${TACTICAL_SYSTEM_LABELS[system]} come identità di gioco.`)],
  }));
  return {
    id: `tactical-identity-${coach.age}`,
    category: "tactical-identity",
    title: "Identità tattica",
    description: "Che impronta tattica vuoi dare alla squadra nella prossima stagione?",
    options,
  };
}

// ---------- Fase B: pressione societaria, varietà, coppe, scandalo ----------

/**
 * Crisi societaria — **forzata** quando `boardConfidence` scende sotto la soglia d'allarme (vedi
 * `shouldTriggerBoardCrisis` in loop.ts). L'esonero (`sacked: true`) è applicato genericamente da
 * `resolveCoachCycle`, stesso principio dei flag `retire`/`club`/`newSystem` sulle altre opzioni.
 */
export function generateBoardCrisisDecision(coach: Coach): CoachDecision {
  return {
    id: `board-crisis-${coach.age}`,
    category: "board-crisis",
    title: "Crisi societaria",
    description: "La fiducia della società è ai minimi termini.",
    options: [
      {
        id: "ask-for-time",
        label: "Chiedi tempo alla società",
        hint: "Rischio di esonero moderato",
        outcomes: [
          outcome(60, "La società ti concede un'ultima chance.", { boardConfidenceDelta: 15 }),
          outcome(40, "La pazienza è finita: sei stato esonerato.", { sacked: true }),
        ],
      },
      {
        id: "resign",
        label: "Offri le dimissioni",
        hint: "Esci con dignità",
        outcomes: [
          outcome(100, "Ti dimetti prima che sia la società a esonerarti.", { sacked: true, popularityDelta: 5 }),
        ],
      },
      {
        id: "all-in",
        label: "Punta tutto sulla prossima gara",
        hint: "Tutto o niente",
        outcomes: [
          outcome(30, "Una vittoria pesante ti salva la panchina.", { boardConfidenceDelta: 30, reputationDelta: 2 }),
          outcome(70, "Il rischio non paga: sei stato esonerato.", { sacked: true }),
        ],
      },
    ],
  };
}

/** Conferenza stampa — categoria ordinaria (non forzata), mirror di "controversial-statement". */
export function generatePressConferenceDecision(coach: Coach): CoachDecision {
  return {
    id: `press-conference-${coach.age}`,
    category: "press-conference",
    title: "Conferenza stampa",
    description: "I giornalisti aspettano una tua dichiarazione sulla stagione in corso.",
    options: [
      {
        id: "speak-freely",
        label: "Parla senza filtri",
        hint: "Rischio mediatico",
        outcomes: [
          outcome(60, "Le tue parole dirette conquistano tifosi e stampa.", { popularityDelta: 4 }),
          outcome(40, "Una frase di troppo finisce in prima pagina.", { shadowDelta: 8, popularityDelta: -3 }),
        ],
      },
      {
        id: "stay-vague",
        label: "Resta sul vago",
        hint: "Nessun rischio, nessun guadagno",
        outcomes: [outcome(100, "Una conferenza stampa anonima, senza scossoni.", { popularityDelta: -1 })],
      },
    ],
  };
}

/** Confronto col capitano — mirror concettuale di "coach-role-request" calciatore, invertito
 * (qui è il capitano a rivolgersi all'allenatore). */
export function generateCaptainRelationsDecision(coach: Coach): CoachDecision {
  return {
    id: `captain-relations-${coach.age}`,
    category: "captain-relations",
    title: "Il capitano chiede un confronto",
    description: "Il capitano porta a te le richieste dello spogliatoio.",
    options: [
      {
        id: "listen",
        label: "Ascolta le sue richieste",
        hint: "Rapporto più solido con lo spogliatoio",
        outcomes: [
          outcome(100, "Accogli le richieste del capitano: il gruppo si compatta.", {
            relationsDelta: { captain: 1 },
            reputationDelta: 1,
          }),
        ],
      },
      {
        id: "assert-authority",
        label: "Fai valere la tua autorità",
        hint: "La società apprezza il polso fermo",
        outcomes: [
          outcome(100, "Tieni la linea: qualcuno nello spogliatoio storce il naso.", {
            relationsDelta: { captain: -1 },
            boardConfidenceDelta: 3,
          }),
        ],
      },
    ],
  };
}

/** Sessione di mercato astratta — mai una vera rosa, solo una scelta di tier di spesa con un
 * effetto immediato (non un mercato di trasferimento simulato). */
export function generateTransferBudgetDecision(coach: Coach): CoachDecision {
  return {
    id: `transfer-budget-${coach.age}`,
    category: "transfer-window-budget",
    title: "Sessione di mercato",
    description: "La società ti chiede come orientare il budget per la rosa.",
    options: [
      {
        id: "invest-youth",
        label: "Investi sui giovani",
        hint: "Costruisci per il futuro",
        outcomes: [outcome(100, "Punti su un progetto a lungo termine.", { popularityDelta: 1 })],
      },
      {
        id: "marquee-signing",
        label: "Un colpo ad effetto",
        hint: "Spesa alta, aspettative alte",
        outcomes: [
          outcome(100, "Un acquisto di richiamo accende l'entusiasmo dei tifosi.", {
            popularityDelta: 3,
            savingsDelta: -20_000,
            boardConfidenceDelta: -3,
          }),
        ],
      },
      {
        id: "balance-books",
        label: "Tieni i conti in ordine",
        hint: "La società apprezza la prudenza",
        outcomes: [
          outcome(100, "Gestisci il budget con prudenza.", { savingsDelta: 15_000, boardConfidenceDelta: 3 }),
        ],
      },
    ],
  };
}

/** Scelta tattica pre-corsa in coppa/campagna continentale — condivisa dai due generatori sotto,
 * `outcomeBonus` nudge il roll della stagione corrente (vedi `advanceSeasons`), mai una vera
 * rosa/mercato simulato. */
const CUP_RUN_APPROACHES: { id: string; label: string; hint: string; bonus: number }[] = [
  { id: "attack", label: "Gioco d'attacco", hint: "Rischio alto, spinta massima", bonus: 1.15 },
  { id: "balance", label: "Equilibrio tattico", hint: "Approccio bilanciato", bonus: 1.08 },
  { id: "low-block", label: "Blocco basso", hint: "Difendi il risultato", bonus: 1.03 },
];

function buildRunApproachOptions(): CoachDecisionOption[] {
  return CUP_RUN_APPROACHES.map((a) => ({
    id: a.id,
    label: a.label,
    hint: a.hint,
    outcomeBonus: a.bonus,
    outcomes: [outcome(100, `Prepari la squadra puntando su: ${a.label.toLowerCase()}.`)],
  }));
}

/** Corsa in coppa nazionale — **forzata** quando il club ha una coppa nazionale (vedi
 * `shouldTriggerCupRun` in loop.ts). L'esito reale (quanto si va avanti) resta deciso da
 * `rollCoachSeasonOutcome` nello stesso ciclo — questa decisione ne nudge solo la probabilità. */
export function generateCupRunDecision(coach: Coach): CoachDecision {
  return {
    id: `cup-run-${coach.age}`,
    category: "cup-run",
    title: "Corsa in coppa",
    description: "Il club è in corsa per la coppa nazionale: come vuoi approcciare la stagione?",
    options: buildRunApproachOptions(),
  };
}

/** Campagna continentale — **forzata**, stesso principio di `generateCupRunDecision`. */
export function generateContinentalCampaignDecision(coach: Coach): CoachDecision {
  return {
    id: `continental-campaign-${coach.age}`,
    category: "continental-campaign",
    title: "Campagna continentale",
    description: "Il club è atteso da una campagna europea: come vuoi impostarla?",
    options: buildRunApproachOptions(),
  };
}

/** Scandalo mediatico — **forzata**, riusa interamente le soglie di `lib/career/shadow.ts` senza
 * modifiche (solo il testo è allenatore-flavored: tattiche vendute alla stampa, liti nello
 * spogliatoio, invece di doping/tradimenti da giocatore). */
export function generateCoachScandalDecision(coach: Coach): CoachDecision {
  return {
    id: `scandal-${coach.age}`,
    category: "scandal",
    title: "Scandalo mediatico",
    description:
      "Voci su presunte tattiche vendute alla stampa e liti nello spogliatoio esplodono sui media.",
    options: [
      {
        id: "come-clean",
        label: "Gestisci con trasparenza",
        hint: "Ripulisci la tua immagine · popolarità in calo",
        outcomes: [
          outcome(100, "Affronti la stampa a viso aperto: la vicenda si sgonfia lentamente.", {
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
          outcome(100, "Neghi ogni accusa, ma la stampa non molla la presa.", {
            shadowDelta: 5,
            popularityDelta: -10,
            shadowFlags: { scandalOccurred: true },
          }),
        ],
      },
    ],
  };
}
