import type {
  ArchetypeId,
  Club,
  GameSpeed,
  RelationAffinity,
  ShadowFlags,
  Traits,
  Trophy,
  Wallet,
} from "@/types/career";
import type { TacticalSystem } from "@/lib/career/tactics";
import type { LeagueZone } from "@/lib/shared/league-season";

export interface CoachIdentity {
  lastName: string;
  nationality: string;
  preferredSystem: TacticalSystem;
}

export type LeagueFinish =
  | "relegated"
  | "relegation-battle"
  | "mid-table"
  | "continental-qualification"
  | "title";

export type CupRun = "none" | "quarterfinal" | "semifinal" | "final" | "won";
export type ContinentalRun = "none" | "group-stage" | "knockout" | "semifinal" | "final" | "won";

export interface CoachSeasonOutcome {
  /** Etichetta derivata dalla zona — **solo** per la matematica di reputazione/boardConfidence
   * (rank 0-4 via `LEAGUE_FINISH_RANK`), mai come sorgente di copy: `continental` e `promotion`
   * condividono lo stesso rank ma sono zone narrativamente diverse, vedi `zone`. */
  leagueFinish: LeagueFinish;
  /** Zona reale del piazzamento — fonte di verità per copy/UI (vedi piano "Due classifiche",
   * criticità 2: non leggere `leagueFinish` per testo utente). */
  zone: LeagueZone;
  /** Piazzamento 1..leagueSize tirato da `rollLeaguePosition`. */
  position: number;
  leagueSize: number;
  cupRun: CupRun;
  continentalRun?: ContinentalRun;
}

export interface CoachStint {
  club: Club;
  ageFrom: number;
  ageTo: number;
  outcome: CoachSeasonOutcome;
  /** Reputazione dell'allenatore alla fine di questa stagione (per la riga storica). */
  reputation: number;
  /** Raggruppa le stint create nello stesso ciclo (1 stagione Intense, 2 Normal, 3 Express) —
   * campo opzionale additivo, assente sulle stint pre-migrazione dove una stint = un ciclo per
   * definizione. Vedi `lib/shared/club-tenure.ts::cyclesAtClub` per come consumarlo. */
  cycleId?: number;
  /** Movimento di categoria applicato **in questa stagione specifica** (non a fine ciclo) — una
   * retrocessione a metà di un ciclo Express fa giocare le stagioni successive nel tier sotto. */
  clubTierChange?: "promoted" | "relegated" | null;
}

export type CoachRelationId = "board" | "press" | "captain" | "rival";

/** NPC di carriera dell'allenatore: società (reset a ogni incarico), stampa (reset a ogni
 * incarico), capitano (reset solo su vero cambio club), rivale (persiste, segue la carriera). */
export interface CoachRelation {
  id: CoachRelationId;
  name: string;
  affinity: RelationAffinity;
}

export type CoachAwardType = "manager-of-the-season" | "manager-of-the-year";

export interface CoachAward {
  type: CoachAwardType;
  age: number;
  club?: Club;
}

export type CoachSeasonTitleId =
  | "miracle"
  | "champion"
  | "cupSpecialist"
  | "continentalGlory"
  | "steadyHand"
  | "underFire"
  | "sacked"
  | "toughSeason";

export interface CoachSeasonTitleEntry {
  age: number;
  id: CoachSeasonTitleId;
  label: string;
}

export type CoachCycleObjectiveKind = "league-finish" | "cup-run" | "no-sacking" | "reputation-gain";

/** Obiettivo societario per il ciclo corrente. */
export interface CoachCycleObjective {
  id: string;
  label: string;
  kind: CoachCycleObjectiveKind;
  target: number;
}

/** Record personali dell'allenatore, aggiornati ciclo per ciclo. */
export interface CoachPersonalRecords {
  peakReputation: number;
  bestLeagueFinish: LeagueFinish | null;
  longestTenureClub: number;
}

export interface Coach extends CoachIdentity {
  age: number;
  /** 0-99, sostituisce l'OVR del calciatore — sale E scende in base a quanto si sovra/
   * sottoperforma il prestigio del club (vedi lib/coach-career/engine.ts). */
  reputation: number;
  /** Tetto individuale di reputazione — mirror di Player.potential. */
  reputationCeiling: number;
  club: Club | null;
  clubHistory: CoachStint[];
  trophies: Trophy[];
  awards: CoachAward[];
  retired: boolean;
  wallet: Wallet;
  /** 0-100. */
  popularity: number;
  /** 0-100, per-incarico — risorsa che alimenta il rischio di esonero, reset ad ogni nuovo
   * club (non sul rinnovo con lo stesso club). 0 finché non si ha un club. */
  boardConfidence: number;
  traits: Traits;
  shadow: number;
  shadowFlags?: ShadowFlags;
  seasonTitles: CoachSeasonTitleEntry[];
  currentObjective: CoachCycleObjective | null;
  objectiveKindsCelebrated?: CoachCycleObjectiveKind[];
  records: CoachPersonalRecords;
  relations: CoachRelation[];
  /** Contatore di cicli (non stagioni) — usato solo come sorgente di `CoachStint.cycleId`,
   * opzionale additivo, assente/`undefined` su un save pre-migrazione (equivale a 0). */
  cyclesPlayed?: number;
}

/** Effetto applicabile all'allenatore da un outcome di decisione. */
export interface CoachDelta {
  reputationDelta?: number;
  boardConfidenceDelta?: number;
  popularityDelta?: number;
  savingsDelta?: number;
  traitsDelta?: Partial<Traits>;
  shadowDelta?: number;
  shadowFlags?: Partial<ShadowFlags>;
  relationsDelta?: Partial<Record<CoachRelationId, number>>;
  /** Se true, l'opzione porta a un esonero (applicato genericamente da resolveCoachCycle). */
  sacked?: boolean;
}

export type CoachDecisionCategory =
  | "job-search"
  | "board-brief"
  | "tactical-identity"
  | "press-conference"
  | "transfer-window-budget"
  | "captain-relations"
  | "board-crisis"
  | "end-of-cycle"
  | "cup-run"
  | "continental-campaign"
  | "scandal"
  | "rival-clash"
  | "narrative";

export interface CoachDecisionOutcome {
  weight: number;
  effect: CoachDelta;
  resultText: string;
}

export interface CoachDecisionOption {
  id: string;
  label: string;
  hint?: string;
  club?: Club;
  retire?: boolean;
  newSystem?: TacticalSystem;
  /** Moltiplicatore temporaneo (default 1) applicato al roll della stagione corrente — usato
   * dalle scelte tattiche pre-corsa in coppa/campagna continentale (Fase B). */
  outcomeBonus?: number;
  outcomes: CoachDecisionOutcome[];
}

export interface CoachDecision {
  id: string;
  category: CoachDecisionCategory;
  title: string;
  description: string;
  options: CoachDecisionOption[];
}

/** Riepilogo leggero di una carriera da allenatore conclusa, per l'archivio dedicato. */
export interface ArchivedCoachCareer {
  id: string;
  lastName: string;
  nationality: string;
  peakReputation: number;
  trophyCount: number;
  awardCount: number;
  retiredAge: number;
  retiredAtIso: string;
  finalSavingsEur: number;
  finalPopularity: number;
  careerTitle: string;
  clubsManaged: number;
  bestLeagueFinish: LeagueFinish | null;
  archetypeId?: ArchetypeId;
  shadowTitle?: string | null;
}

export type { GameSpeed };
