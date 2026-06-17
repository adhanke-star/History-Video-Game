/**
 * TypeScript declaration file for IDE autocomplete + type checking.
 * This file is NOT used at runtime — it provides types for editors (VSCode, etc).
 * Reference via: // @ts-check + /** @type {import('./types').Campaign} */
 */

/** The global game state object. */
interface GameState {
  campaign: Campaign | null;
  mode: 'menu' | 'battle' | 'campaign' | 'desk';
}

/** A campaign save — the full persistent state for one playthrough. */
interface Campaign {
  side: 'US' | 'CS';
  iron: boolean;
  idx: number;
  funds: number;
  recovery: boolean;
  completed: string[];
  roster: RosterUnit[];
  nextId: number;
  stats: CampaignStats;
  recoveryLossCount: number;
  recoveryMode: boolean;
  flipAtk: boolean;
  captured: string[];
  /** The President's Desk state (created by presInit). */
  president?: PresidentState;
  /** The 1864 Clock state (created by clkInit). */
  clock?: ClockState;
  /** The War Room state (created by wrInit). */
  warroom?: WarRoomState;
  /** The Muster Roll state (created by mrInit). */
  muster?: any;
  /** The Economy/Finance state (created by econInit). */
  economy?: EconomyState;
  /** The Blockade/Diplomacy state (created by blockadeInit). */
  blockade?: any;
  /** The Production state (created by prodInit). */
  production?: any;
  /** The Manpower state (created by manpowerInit). */
  manpower?: any;
  /** The Victory Paths state (created by vicInit). */
  victory?: any;
  /** The Cabinet/Advisor state (created by cabInit). */
  cabinet?: any;
  /** The Morale state (created by moraleInit). */
  morale?: any;
  /** The Command/Generals state (created by cmdInit). */
  command?: any;
}

interface CampaignStats {
  battles: number;
  won: number;
  infl: number;
  suff: number;
}

interface RosterUnit {
  id: string;
  type: 'inf' | 'cav' | 'art';
  weapon: string | null;
  xp: number;
  name: string | null;
}

/** The President's Desk state sub-object (C.president). */
interface PresidentState {
  date: StrategicDate;
  head: PresidentHead;
  cabinet: CabinetMember[];
  pendingChoices: any[];
  onboarded: boolean;
  turn: number;
  log: string[];
}

interface StrategicDate {
  year: number;
  month: number;
}

interface PresidentHead {
  name: string;
  title: string;
  seat: string;
}

interface CabinetMember {
  role: string;
  name: string;
  domain: 'war' | 'treasury' | 'state' | 'navy';
  delegated: boolean;
}

/** The 1864 Clock state sub-object (C.clock). */
interface ClockState {
  weariness: number;
  capital: number;
  intervention: number;
  year: number;
  elected: boolean;
  resolved1864: boolean;
  bonds: number;
  log: string[];
}

/** The War Room state sub-object (C.warroom). */
interface WarRoomState {
  nodes: Record<string, number>;
}

/** The Economy/Finance state sub-object (C.economy). */
interface EconomyState {
  inflation: number;
  mix: any;
  lastTurn: any;
}

/** Battle descriptor passed to OnResolve functions. */
interface BattleDescriptor {
  bd?: { name: string; year?: number };
  name?: string;
  playerSide?: 'US' | 'CS';
  casualties?: Record<string, number>;
}

/** Tactical field state (__FIELD). */
interface FieldState {
  phases: PhaseData[] | null;
  phaseIdx: number;
  phaseScore: { US: number; CS: number };
  phaseLog: PhaseLogEntry[];
  battleCas: { US: number; CS: number };
  units: FieldUnit[];
  _scenTop: ScenarioData | null;
  scenData: any;
  terrain: any;
  objective: { x: number; z: number; r: number; name: string };
  holdToWin: number;
  timeLimit: number;
  attacker: 'US' | 'CS';
  defender: 'US' | 'CS';
  _atkCautious: boolean;
  fog: boolean;
  _fogSpecified: boolean;
  reinforce: any[];
  autoBoth: boolean;
  winner: 'US' | 'CS' | 'draw' | null;
  winBy: string | null;
  phase: 'deploy' | 'battle' | 'over' | 'interphase';
  paused: boolean;
  playerSide: 'US' | 'CS';
}

interface PhaseData {
  name: string;
  terrain?: any;
  objective: { x: number; z: number; r: number; name: string };
  attacker?: 'US' | 'CS';
  defender?: 'US' | 'CS';
  oob?: { US: any[]; CS: any[] };
  reinforcements?: any[];
  holdToWinSec?: number;
  timeLimitSec?: number;
  scoreWeight?: number;
  teaching?: any;
  transition?: { lead?: string };
  assaultDoctrine?: string;
  defaultFog?: boolean;
  leaders?: any;
  supply?: any;
}

interface PhaseLogEntry {
  idx: number;
  name: string;
  winner: 'US' | 'CS' | 'draw';
  winBy: string;
  usCas: number;
  csCas: number;
}

interface ScenarioData {
  name: string;
  date?: string;
  attacker?: 'US' | 'CS';
  phases?: PhaseData[];
  holdToWinSec?: number;
  timeLimitSec?: number;
  terrain?: any;
  defaultFog?: boolean;
  objective?: { x: number; z: number; r: number; name: string };
  leaders?: any;
  supply?: any;
  brief?: { attack: string; defend: string };
  sides?: any;
  endNote?: string;
  teaching?: any;
}

interface FieldUnit {
  id: string;
  side: 'US' | 'CS';
  name: string;
  arm: 'inf' | 'cav' | 'art';
  weapon: string;
  men: number;
  maxMen: number;
  alive: boolean;
  ai: boolean;
  x: number;
  z: number;
  facing: number;
  morale: number;
  fatigue: number;
}

export {
  GameState, Campaign, CampaignStats, RosterUnit,
  PresidentState, StrategicDate, PresidentHead, CabinetMember,
  ClockState, WarRoomState, EconomyState,
  BattleDescriptor,
  FieldState, PhaseData, PhaseLogEntry, ScenarioData, FieldUnit
};
