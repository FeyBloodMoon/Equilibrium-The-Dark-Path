// ---------- Core game types ----------

export type Grade = "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";

export type View = "intro" | "city" | "shop" | "guild" | "forest" | "combat";

export interface StatBlock {
  dmgMin: number;
  dmgMax: number;
  hp: number;
  def: number; // % 0..90
  agi: number; // % 0..90
  crit: number; // %
  critMult: number; // x
  wis: number;
}

export type Slot = "weapon" | "armor" | "charm";

export interface ItemStats {
  dmgMin?: number;
  dmgMax?: number;
  hp?: number;
  def?: number;
  agi?: number;
  crit?: number;
  critMult?: number;
  wis?: number;
}

export interface Item {
  id: string;
  slot: Slot;
  base: string; // base name, e.g. "Меч"
  grade: Grade;
  level: number;
  stats: ItemStats;
  modifier?: string; // prefix text
  modDesc?: string; // what modifier gives
  value: number;
}

export type PotionId = "hp_s" | "hp_m" | "hp_l" | "mp_s" | "mp_m" | "mp_l";

export interface PotionDef {
  id: PotionId;
  name: string;
  kind: "hp" | "mp";
  power: number; // flat heal/mana
  price: number;
}

export type StoneGrade = Exclude<Grade, "SSS">; // F..SS

export interface Player {
  name: string;
  classId: import("./classes").ClassId;
  gender: import("./classes").Gender;
  level: number;
  xp: number;
  gold: number;
  skillPoints: number;
  skills: Record<string, number>;
  equipment: Partial<Record<Slot, Item>>;
  autoPotion: boolean;
  sound: boolean;
}

export interface DerivedExtras {
  spellPower: number; // %
  greed: number; // %
  lifesteal: number; // %
}

export interface Inventory {
  items: Item[];
  potions: Record<PotionId, number>;
  stones: Record<StoneGrade, number>;
  materials: Record<string, number>;
}

// ---------- Monsters & locations ----------

export interface MonsterDef {
  id: string;
  name: string;
  icon: string; // lucide key used by UI map
  hpMul: number;
  dmgMul: number;
  defAdd: number;
  agiAdd: number;
  critAdd: number;
  materialId: string;
  materialName: string;
}

export interface LocationW {
  id: string;
  name: string;
  desc: string;
  tier: number; // 0..4
  minLvl: number;
  maxLvl: number;
  img: string;
  accent: string;
  monsters: MonsterDef[];
}

export interface RuntimeMonster {
  base: MonsterDef;
  name: string;
  level: number;
  elite: boolean;
  maxHp: number;
  hp: number;
  dmgMin: number;
  dmgMax: number;
  def: number;
  agi: number;
  crit: number;
  critMult: number;
  xp: number;
  stoneGrade: StoneGrade;
}

// ---------- Guild ----------

export interface Quest {
  id: string;
  grade: Grade;
  kind: "kill" | "elite" | "stones" | "materials";
  title: string;
  targetLabel: string;
  monsterId?: string;
  materialId?: string;
  stoneGrade?: StoneGrade;
  need: number;
  progress: number;
  rewardGold: number;
  rewardXp: number;
  status: "board" | "active" | "done";
}

export interface MercLootEntry {
  stones: Partial<Record<StoneGrade, number>>;
  materials: Record<string, number>;
}

export interface MercCandidate {
  id: string;
  name: string;
  level: number;
  grade: Grade;
  reliability: number; // 10..100
  baseCost: number;
}

export interface Merc {
  id: string;
  name: string;
  level: number;
  grade: Grade;
  reliability: number;
  cost: number;
  locationId: string;
  sentAt: number;
  returnAt: number;
  loot: MercLootEntry;
}

// ---------- Combat ----------

export type LogKind =
  | "info"
  | "player"
  | "monster"
  | "crit"
  | "dodge"
  | "loot"
  | "level"
  | "potion"
  | "spell"
  | "death"
  | "elite";

export interface LogEntry {
  id: number;
  kind: LogKind;
  text: string;
}

export interface SessionLoot {
  xp: number;
  gold: number;
  stones: Partial<Record<StoneGrade, number>>;
  materials: Record<string, number>;
  items: Item[];
}

export interface Floater {
  id: number;
  side: "player" | "monster";
  text: string;
  kind: "hit" | "crit" | "dodge" | "heal" | "spell" | "potion";
}

export interface CombatState {
  locationId: string;
  phase: "search" | "fight" | "result";
  monster: RuntimeMonster | null;
  playerHp: number;
  playerMana: number;
  turn: "player" | "monster";
  log: LogEntry[];
  session: SessionLoot;
  kills: number;
  nextActionAt: number;
  floater: Floater | null;
  buff: { mult: number; turns: number; name: string } | null;
  result: null | {
    type: "dead" | "fled";
    lostGold: number;
    lostXp: number;
    keptGold: number;
    keptStones: number;
  };
}

export type SoundName =
  | "hit"
  | "crit"
  | "dodge"
  | "potion"
  | "spell"
  | "heal"
  | "coin"
  | "level"
  | "death"
  | "elite"
  | "click"
  | "buy";
