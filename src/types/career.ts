export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "ST";

export type OutfieldAttributeKey = "pace" | "shooting" | "passing" | "defending" | "physical";
export type GoalkeeperAttributeKey = "reflexes" | "handling" | "kicking" | "positioning";
export type AttributeKey = OutfieldAttributeKey | GoalkeeperAttributeKey;

export interface OutfieldAttributes {
  kind: "outfield";
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
}

export interface GoalkeeperAttributes {
  kind: "goalkeeper";
  reflexes: number;
  handling: number;
  kicking: number;
  positioning: number;
}

/** Attributi granulari (1-99), set diverso per portiere vs giocatore di movimento. */
export type Attributes = OutfieldAttributes | GoalkeeperAttributes;

export type PreferredFoot = "left" | "right";

export type GameSpeed = "intense" | "normal" | "express";

export interface PlayerIdentity {
  lastName: string;
  number: number;
  foot: PreferredFoot;
  nationality: string;
  position: Position;
}

export interface ClubCompetitions {
  league: string;
  cup?: string;
  continental?: string;
}

export interface Club {
  id: string;
  name: string;
  country: string;
  /** 1 = massima divisione del paese, 2 = seconda, ecc. Mutabile (retrocessione/promozione). */
  tier: number;
  /** 0-3 stelle, come nell'originale — influenza probabilità di trofei e soglie di offerta. */
  prestige: 0 | 1 | 2 | 3;
  competitions: ClubCompetitions;
  /** Hotlink allo stemma ufficiale (TheSportsDB) — mai scaricato/salvato nel repo. */
  crestUrl: string;
}

export interface StatLine {
  apps: number;
  goals: number;
  assists: number;
  /** Valorizzato solo per i portieri (Position "GK"). */
  goalsAgainst?: number;
  /** Valorizzato solo per i portieri (Position "GK"). */
  cleanSheets?: number;
}

export interface ClubStint {
  club: Club;
  ageFrom: number;
  ageTo: number;
  type: "permanent" | "loan";
  stats: StatLine;
  /** OVR del giocatore alla fine di questo ciclo (per la riga storica della career table). */
  ovr: number;
}

export interface Trophy {
  competition: string;
  /** undefined se vinto con la nazionale */
  club?: Club;
  age: number;
}

export type AwardType = "player-of-the-season" | "ballon-dor" | "top-scorer";

export interface Award {
  type: AwardType;
  age: number;
  club?: Club;
}

export interface NationalTeamStats extends StatLine {
  called: boolean;
}

export type RelationId = "coach" | "agent" | "rival";
export type RelationAffinity = -2 | -1 | 0 | 1 | 2;

/** NPC di carriera: mister (reset al transfer), agente (persistente), rivale (gated). */
export interface Relation {
  id: RelationId;
  name: string;
  affinity: RelationAffinity;
}

/** Infortunio attivo: tiene fuori il giocatore per N cicli con un malus OVR temporaneo. */
export interface Injury {
  label: string;
  turnsRemaining: number;
  ovrPenalty: number;
}

/** Portafoglio del giocatore: stipendio corrente e risparmi accumulati. */
export interface Wallet {
  salaryEurPerCycle: number;
  savingsEur: number;
}

/** Soglia OVR già celebrata, con età al momento del traguardo (per la timeline). */
export interface OvrMilestone {
  ovr: number;
  age: number;
}

/** Record personali aggiornati ciclo per ciclo. */
export interface PersonalRecords {
  bestSeasonGoals: number;
  bestSeasonAssists: number;
  bestSeasonApps: number;
  /** Valorizzato solo per i portieri (Position "GK"). */
  bestSeasonCleanSheets?: number;
  peakMarketValueEur: number;
  firstCallupAge: number | null;
}

export type SeasonTitleId =
  | "giantKiller"
  | "champion"
  | "ballondorSeason"
  | "nationalHero"
  | "ironWall"
  | "revelation"
  | "comeback"
  | "workhorse"
  | "toughYear"
  | "steady";

export interface SeasonTitleEntry {
  age: number;
  id: SeasonTitleId;
  label: string;
}

export type CycleObjectiveKind =
  | "goals"
  | "apps"
  | "trophy"
  | "no-injury"
  | "callup"
  | "ovr-gain";

/** Obiettivo del ciclo corrente, mostrato sul cartellino e valutato a fine ciclo. */
export interface CycleObjective {
  id: string;
  label: string;
  kind: CycleObjectiveKind;
  target: number;
}

/** Vettori di personalità nascosti, 0-100, spostati dagli outcome delle scelte. */
export interface Traits {
  loyalty: number;
  ambition: number;
  showmanship: number;
  discipline: number;
  leadership: number;
}

/** Stile di carriera derivato a runtime da `traits`/`shadow` (vedi `deriveArchetype`). */
export type ArchetypeId = "flagbearer" | "mercenary" | "showman" | "pro" | "leader" | "problem";

/** Flag narrativi/di bookkeeping legati al debito morale (`shadow`). */
export interface ShadowFlags {
  doped?: boolean;
  leakedTactics?: boolean;
  taxEvaded?: boolean;
  /** Bookkeeping: le grane fiscali sono già uscite in questa carriera (anche se si è partiti). */
  taxTroubleOccurred?: boolean;
  fanBetrayed?: boolean;
  /** Bookkeeping interno per l'eleggibilità alla redenzione — non narrativo. */
  scandalOccurred?: boolean;
  redeemed?: boolean;
}

export interface Player extends PlayerIdentity {
  age: number;
  ovr: number;
  marketValueEur: number;
  career: StatLine;
  club: Club | null;
  clubHistory: ClubStint[];
  nationalTeam: NationalTeamStats;
  trophies: Trophy[];
  awards: Award[];
  retired: boolean;
  injury: Injury | null;
  wallet: Wallet;
  /** Reputazione/popolarità continua, 0-100. */
  popularity: number;
  milestonesReached: OvrMilestone[];
  records: PersonalRecords;
  /** Ultimi titoli di stagione (cap applicato nel dominio). */
  seasonTitles: SeasonTitleEntry[];
  currentObjective: CycleObjective | null;
  /** Tipi di obiettivo di ciclo per cui l'overlay celebrativo è già stato mostrato una volta in
   * questa carriera — dalla seconda volta in poi per lo stesso tipo resta solo il banner. */
  objectiveKindsCelebrated?: CycleObjectiveKind[];
  /** true se il giocatore ha già cambiato nazionalità una volta (evento non ripetibile). */
  hasSwitchedNationality?: boolean;
  /** Vettori di personalità, 0-100 ciascuno, punto di partenza neutro (50). */
  traits: Traits;
  /** Debito morale privato e cumulativo, 0-100, default 0. */
  shadow: number;
  shadowFlags?: ShadowFlags;
  /** Tetto OVR individuale (30-99) — sostituisce il vecchio tetto fisso 99 uguale per tutti. */
  potential: number;
  /** Attributi granulari, coerenti col ruolo corrente — si ripesano da soli su cambio ruolo. */
  attributes: Attributes;
  /** Attributo su cui si concentra la crescita del prossimo ciclo, o null per allenamento bilanciato. */
  trainingFocus: AttributeKey | null;
  /** Picco di velocità/fisico visto in carriera — per la riconversione di ruolo da declino. */
  attributePeaks?: { pace: number; physical: number };
  /** Stili di gioco sbloccati (soglia su un attributo) — vedi lib/career/playstyles.ts. Nome
   * deliberatamente diverso da `traits` (personalità/archetipo), concetto non correlato. */
  playStyles: PlayStyleId[];
  /** Clausola rescissoria col club corrente, in EUR — ricalcolata ad ogni firma (0 se mai
   * firmato o pre-migrazione). Vedi lib/career/wallet.ts (computeReleaseClauseEur). */
  releaseClauseEur: number;
  /** Relazioni NPC leggere (mister, agente, rivale) — max 3. */
  relations: Relation[];
}

/** Tratto distintivo sbloccabile quando un attributo supera una soglia — dà un bonus concreto
 * a una formula esistente (proiezione gol/assist, chance trofeo/callup, infortuni). */
export type PlayStyleId = "curler" | "playmaker" | "sprinter" | "brickwall" | "targetman" | "catlike";

/** Effetto applicabile al giocatore da un outcome di decisione. */
export interface PlayerDelta {
  ovrDelta?: number;
  popularityDelta?: number;
  savingsDelta?: number;
  /** undefined = nessuna modifica, null = guarigione esplicita, oggetto = nuovo infortunio. */
  injury?: Injury | null;
  traitsDelta?: Partial<Traits>;
  shadowDelta?: number;
  shadowFlags?: Partial<ShadowFlags>;
  /** Raro, per eventi narrativi futuri — non ancora prodotto da nessun generatore. */
  potentialDelta?: number;
  attributesDelta?: Partial<Record<AttributeKey, number>>;
  /** Se presente, nuovo valore assoluto della clausola rescissoria (non un delta). */
  releaseClauseEur?: number;
  /** Spostamento di affinità per relazione esistente (clamp -2..+2). */
  relationsDelta?: Partial<Record<RelationId, number>>;
}

export type DecisionCategory =
  | "transfer"
  | "loan"
  | "loan-return"
  | "position-change"
  | "club-crisis"
  | "end-of-cycle"
  | "lifestyle"
  | "continental-final"
  | "cup-upset"
  | "narrative"
  | "sponsor"
  /** Categoria forzata (mai nel pool normale) quando `shadow` supera la soglia di scandalo. */
  | "scandal"
  | "training-focus"
  /** Negoziazione col procuratore (clausola/stipendio) — rotazione normale. */
  | "agent"
  /** Categoria forzata (mai nel pool normale): un club rivale attiva la clausola rescissoria. */
  | "clause-activation"
  /** Categoria forzata: partita decisiva di campionato (scelta tattica). */
  | "decisive-match";

export interface DecisionOutcome {
  /** Peso relativo tra gli outcome della stessa opzione — i pesi di un'opzione sommano a 100. */
  weight: number;
  effect: PlayerDelta;
  resultText: string;
  /** true solo sull'outcome che rappresenta la vittoria di una finale continentale. */
  continentalWin?: boolean;
  /** true solo sull'outcome che rappresenta la vittoria di una sorpresa di coppa ("Giant Killer"). */
  cupUpsetWin?: boolean;
  /** true solo sull'outcome che rappresenta la vittoria della partita decisiva di campionato. */
  leagueWin?: boolean;
}

export interface DecisionOption {
  id: string;
  label: string;
  /** Hint soft sul trade-off (solo UI, senza pesi numerici). */
  hint?: string;
  /** Se presente, selezionare questa opzione firma il giocatore per questo club (anche "resta"). */
  club?: Club;
  /** Se true, selezionare questa opzione termina la carriera (es. "Retire" in end-of-cycle). */
  retire?: boolean;
  /** Se presente, selezionare questa opzione cambia la nazionalità del giocatore. */
  newNationality?: string;
  /** Se presente (anche null per "allenamento bilanciato"), imposta il focus di allenamento. */
  trainingFocus?: AttributeKey | null;
  /** Se presente, selezionare questa opzione cambia il ruolo in campo del giocatore. */
  newPosition?: Position;
  /** Un solo outcome (peso 100) = esito deterministico. Più outcome = esito probabilistico. */
  outcomes: DecisionOutcome[];
}

export interface Decision {
  id: string;
  category: DecisionCategory;
  title: string;
  description: string;
  options: DecisionOption[];
}

/** Riepilogo leggero di una carriera conclusa, per l'archivio multi-carriera. */
export interface ArchivedCareer {
  id: string;
  lastName: string;
  nationality: string;
  position: Position;
  peakOvr: number;
  trophyCount: number;
  awardCount: number;
  retiredAge: number;
  retiredAtIso: string;
  careerApps: number;
  careerGoals: number;
  careerAssists: number;
  finalSavingsEur: number;
  finalPopularity: number;
  /** Miglior titolo di stagione della carriera, o fallback narrativo. */
  careerTitle: string;
  /** Archetipo dominante a fine carriera, se emerso (vedi `deriveArchetype`). */
  archetypeId?: ArchetypeId;
  /** Titolo derivato dal debito morale finale ("Carriera controversa"/"Dal buio alla luce"), se applicabile. */
  shadowTitle?: string | null;
}
