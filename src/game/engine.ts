import {
  ARMOR_BASES,
  CHARM_BASES,
  GRADE_MULT,
  GRADES,
  LOCATIONS,
  MERC_DURATION_MIN,
  MERC_NAMES,
  MERC_TITLES,
  MODIFIERS,
  QUEST_GOLD_BASE,
  STONE_GRADES,
  STONE_VALUE,
  WEAPON_BASES,
} from "./data";
import { getClass } from "./classes";
import type { ClassId } from "./classes";
import type {
  DerivedExtras,
  Grade,
  Inventory,
  Item,
  ItemStats,
  MercCandidate,
  MercLootEntry,
  Player,
  Quest,
  RuntimeMonster,
  Slot,
  StatBlock,
  StoneGrade,
} from "./types";

export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const chance = (pct: number) => Math.random() * 100 < pct;
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// ---------- Player stats ----------

export function xpForLevel(level: number): number {
  return Math.round(48 * Math.pow(level, 1.5) + 34 * level);
}

export function baseStats(level: number, classId: ClassId = "warrior"): StatBlock {
  const c = getClass(classId);
  const n = level - 1;
  return {
    dmgMin: Math.round(c.base.dmgMin + c.growth.dmgMin * n),
    dmgMax: Math.round(c.base.dmgMax + c.growth.dmgMax * n),
    hp: Math.round(c.base.hp + c.growth.hp * n),
    def: c.base.def + c.growth.def * n,
    agi: c.base.agi + c.growth.agi * n,
    crit: c.base.crit + c.growth.crit * n,
    critMult: c.base.critMult,
    wis: Math.round(c.base.wis + c.growth.wis * n),
  };
}

/** Bonuses granted by the allocated skill tree */
export function skillExtras(player: Player): DerivedExtras & { stats: Partial<StatBlock> } {
  const cls = getClass(player.classId);
  const stats: Partial<StatBlock> = {};
  let spellPower = 0;
  let greed = 0;
  let lifesteal = 0;
  cls.skills.forEach((node) => {
    const rank = player.skills?.[node.id] ?? 0;
    if (rank <= 0) return;
    (Object.entries(node.bonus) as [keyof StatBlock, number][]).forEach(([k, v]) => {
      stats[k] = (stats[k] ?? 0) + v * rank;
    });
    spellPower += (node.spellPower ?? 0) * rank;
    greed += (node.greed ?? 0) * rank;
    lifesteal += (node.lifesteal ?? 0) * rank;
  });
  return { stats, spellPower, greed, lifesteal };
}

export function playerExtras(player: Player): DerivedExtras {
  const { spellPower, greed, lifesteal } = skillExtras(player);
  return { spellPower, greed, lifesteal };
}

export function playerStats(player: Player): StatBlock {
  const s = baseStats(player.level, player.classId);
  const sk = skillExtras(player).stats;
  (Object.entries(sk) as [keyof StatBlock, number][]).forEach(([k, v]) => {
    s[k] = (s[k] as number) + v;
  });
  (Object.values(player.equipment) as (Item | undefined)[]).forEach((item) => {
    if (!item) return;
    const it = item.stats;
    s.dmgMin += it.dmgMin ?? 0;
    s.dmgMax += it.dmgMax ?? 0;
    s.hp += it.hp ?? 0;
    s.def += it.def ?? 0;
    s.agi += it.agi ?? 0;
    s.crit += it.crit ?? 0;
    s.critMult += it.critMult ?? 0;
    s.wis += it.wis ?? 0;
  });
  s.def = clamp(s.def, 0, 90);
  s.agi = clamp(s.agi, 0, 90);
  s.crit = clamp(s.crit, 0, 95);
  return s;
}

export const maxMana = (stats: StatBlock) => Math.round(stats.wis * 10);

// ---------- Combat math ----------

export interface StrikeResult {
  dmg: number;
  crit: boolean;
  dodged: boolean;
  final: number;
}

export function rollStrike(att: StatBlock, defenderAgi: number, defenderDef: number): StrikeResult {
  if (chance(defenderAgi)) {
    return { dmg: 0, crit: false, dodged: true, final: 0 };
  }
  let dmg = rand(att.dmgMin, att.dmgMax);
  let crit = false;
  if (chance(att.crit)) {
    dmg *= att.critMult;
    crit = true;
  }
  const final = Math.max(1, Math.round(dmg * (100 - clamp(defenderDef, 0, 90)) / 100));
  return { dmg, crit, dodged: false, final };
}

export function applyDamage(currentHp: number, rawDmg: number, def: number): number {
  // ост.здор = тек.здор - (урон * (100 - защита) / 100)
  const remaining = currentHp - rawDmg * ((100 - clamp(def, 0, 90)) / 100);
  return Math.max(0, Math.round(remaining));
}

// ---------- Grade rolls ----------

export function rollShopGrade(playerLevel: number): Grade {
  const maxIdx = clamp(1 + Math.floor(playerLevel / 2), 1, GRADES.length - 1);
  const weights = Array.from({ length: maxIdx + 1 }, (_, i) => 1 / Math.pow(i + 1.6, 1.35));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return GRADES[i];
  }
  return GRADES[maxIdx];
}

export function rollMercGrade(): Grade {
  const weights = [30, 24, 18, 11, 8, 5, 2.5, 1, 0.5];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return GRADES[i];
  }
  return "F";
}

// ---------- Item generation ----------

export function itemValue(grade: Grade, level: number, stats: ItemStats): number {
  const statScore =
    ((stats.dmgMin ?? 0) + (stats.dmgMax ?? 0)) * 6 +
    (stats.hp ?? 0) * 0.55 +
    (stats.def ?? 0) * 14 +
    (stats.agi ?? 0) * 12 +
    (stats.crit ?? 0) * 10 +
    (stats.critMult ?? 0) * 120 +
    (stats.wis ?? 0) * 12;
  return Math.max(8, Math.round((16 + level * 7) * Math.pow(GRADE_MULT[grade], 1.35) * 0.4 + statScore));
}

export function genItem(slot: Slot, grade: Grade, level: number, withModifier = false): Item {
  const pool = slot === "weapon" ? WEAPON_BASES : slot === "armor" ? ARMOR_BASES : CHARM_BASES;
  const base = pick(pool);
  const g = GRADE_MULT[grade];
  const stats = base.make(g, level);
  let modifier: string | undefined;
  let modDesc: string | undefined;
  if (withModifier) {
    const mod = pick(MODIFIERS);
    mod.apply(stats, level);
    modifier = mod.prefix;
    modDesc = mod.desc;
  }
  const value = Math.round(itemValue(grade, level, stats) * (withModifier ? 1.35 : 1));
  return { id: uid(), slot, base: base.base, grade, level, stats, modifier, modDesc, value };
}

export function itemName(item: Item): string {
  return item.modifier ? `${item.modifier} ${item.base.toLowerCase()}` : item.base;
}

// ---------- Monster generation ----------

export function locationForLevel(level: number) {
  return (
    [...LOCATIONS].reverse().find((l) => level >= l.minLvl) ?? LOCATIONS[0]
  );
}

export function stoneGradeForTier(tier: number, luck = 0): StoneGrade {
  const roll = Math.random() + luck;
  let idx: number;
  if (roll < 0.4) idx = tier - 1;
  else if (roll < 0.82) idx = tier;
  else if (roll < 0.97) idx = tier + 1;
  else idx = tier + 2;
  return STONE_GRADES[clamp(idx, 0, STONE_GRADES.length - 1)];
}

export function genMonster(locationId: string): RuntimeMonster {
  const loc = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];
  const def = pick(loc.monsters);
  const level = randInt(loc.minLvl, loc.maxLvl);
  const elite = chance(9);

  let hp = (34 + 8.6 * level + randInt(0, 12)) * def.hpMul;
  let dmgMin = (0.8 + 0.72 * level) * def.dmgMul;
  let dmgMax = (2 + 1.45 * level) * def.dmgMul;
  let defn = clamp(1.7 * level + def.defAdd, 0, 80);
  let agi = clamp(1.5 * level + def.agiAdd, 0, 90);
  let crit = clamp(5 + level + def.critAdd, 0, 60);
  let xp = Math.round(14 + 6 * level);

  if (elite) {
    hp *= 2.5;
    dmgMin *= 3;
    dmgMax *= 3;
    defn = clamp(defn * 2, 0, 90);
    xp = Math.round(xp * 2.5);
  }
  const stoneIdx = STONE_GRADES.indexOf(stoneGradeForTier(loc.tier));

  return {
    base: def,
    name: elite ? `★ ${def.name}` : def.name,
    level,
    elite,
    maxHp: Math.round(hp),
    hp: Math.round(hp),
    dmgMin: Math.round(dmgMin),
    dmgMax: Math.round(Math.max(dmgMax, dmgMin + 1)),
    def: defn,
    agi,
    crit,
    critMult: 2,
    xp,
    stoneGrade: STONE_GRADES[clamp(stoneIdx + (elite ? 1 : 0), 0, STONE_GRADES.length - 1)],
  };
}

// ---------- Shop stock ----------

export function genShopStock(playerLevel: number, count = 6): Item[] {
  const items: Item[] = [];
  const slots: Slot[] = ["weapon", "armor", "charm"];
  for (let i = 0; i < count; i++) {
    const slot = slots[i % 3];
    const lvl = randInt(Math.max(1, playerLevel - 2), playerLevel);
    items.push(genItem(slot, rollShopGrade(playerLevel), lvl));
  }
  return items;
}

// ---------- Quests ----------

export function genQuestBoard(playerLevel: number, kept: Quest[], boardSize = 7): Quest[] {
  return [...kept, ...Array.from({ length: boardSize }, () => genQuest(playerLevel))];
}

export function genQuest(playerLevel: number): Quest {
  const maxGradeIdx = clamp(1 + Math.floor(playerLevel / 3), 1, GRADES.length - 1);
  const gIdx = clamp(Math.floor(Math.pow(Math.random(), 0.75) * (maxGradeIdx + 1)), 0, GRADES.length - 1);
  const grade = GRADES[gIdx];
  const tier = clamp(Math.round(gIdx / 2), 0, LOCATIONS.length - 1);
  const loc = LOCATIONS[clamp(tier + randInt(-1, 1), 0, LOCATIONS.length - 1)];
  const monster = pick(loc.monsters);

  const goldBase = QUEST_GOLD_BASE[grade];
  const rollKind: Quest["kind"] =
    gIdx >= 7 && chance(60) ? "elite" : Math.random() < 0.62 ? "kill" : Math.random() < 0.5 ? "stones" : "materials";

  if (rollKind === "kill") {
    const needN = 3 + gIdx * 2 + randInt(0, 3);
    return {
      id: uid(),
      grade,
      kind: "kill",
      title: `Истребление: ${monster.name}`,
      targetLabel: `Убить: ${monster.name}`,
      monsterId: monster.id,
      need: needN,
      progress: 0,
      rewardGold: Math.round(goldBase * (1 + needN * 0.09)),
      rewardXp: Math.round(goldBase * 0.9),
      status: "board",
    };
  }
  if (rollKind === "elite") {
    const needN = gIdx >= 8 ? 3 : randInt(1, 2);
    return {
      id: uid(),
      grade,
      kind: "elite",
      title: `Особая цель: ${monster.name}`,
      targetLabel: `Убить особого монстра в локации «${loc.name}»`,
      monsterId: `${loc.id}`,
      need: needN,
      progress: 0,
      rewardGold: Math.round(goldBase * (1.6 + needN * 0.4)),
      rewardXp: Math.round(goldBase * 1.6),
      status: "board",
    };
  }
  if (rollKind === "stones") {
    const sg = STONE_GRADES[clamp(tier, 0, STONE_GRADES.length - 1)];
    const needN = 3 + gIdx + randInt(0, 2);
    return {
      id: uid(),
      grade,
      kind: "stones",
      title: `Заказ гильдии: камни класса ${sg}`,
      targetLabel: `Сдать камни чудовищ класса ${sg}`,
      stoneGrade: sg,
      need: needN,
      progress: 0,
      rewardGold: Math.round(goldBase * (1 + needN * 0.22)),
      rewardXp: Math.round(goldBase * 0.7),
      status: "board",
    };
  }
  const needN = 2 + gIdx + randInt(0, 3);
  return {
    id: uid(),
    grade,
    kind: "materials",
    title: `Редкие товары: ${monster.materialName}`,
    targetLabel: `Сдать: ${monster.materialName}`,
    materialId: monster.materialId,
    need: needN,
    progress: 0,
    rewardGold: Math.round(goldBase * (1.1 + needN * 0.16)),
    rewardXp: Math.round(goldBase * 0.7),
    status: "board",
  };
}

// ---------- Mercenaries ----------

/** Надёжность зависит от ранга: F ~10-26, SSS ~92-100 */
export function reliabilityForGrade(grade: Grade): number {
  const gIdx = GRADES.indexOf(grade);
  const min = 10 + gIdx * 10;
  const max = min + 16;
  return clamp(Math.round(rand(min, max)), 10, 100);
}

export function genMercCandidate(playerLevel: number): MercCandidate {
  const level = randInt(1, playerLevel);
  const grade = rollMercGrade();
  const name = `${pick(MERC_NAMES)} «${pick(MERC_TITLES)}»`;
  const reliability = reliabilityForGrade(grade);
  const baseCost = mercPrice(level, grade, reliability, 0);
  return { id: uid(), name, level, grade, reliability, baseCost };
}

export const mercDurationMs = (tier: number) =>
  (MERC_DURATION_MIN[clamp(tier, 0, MERC_DURATION_MIN.length - 1)] ?? 5) * 60 * 1000;

const mercKills = (level: number, gIdx: number, minutes: number) =>
  Math.max(2, Math.round(minutes * (1.8 + gIdx * 0.55) * (1 + level * 0.01)));

const mercStoneChance = (gIdx: number) => 35 + gIdx * 4;

/** Средняя цена камня, который наёмник принесёт из локации данного тира */
function avgStoneValue(tier: number): number {
  const at = (off: number) => STONE_VALUE[STONE_GRADES[clamp(tier + off, 0, STONE_GRADES.length - 1)]];
  return at(-1) * 0.4 + at(0) * 0.42 + at(1) * 0.15 + at(2) * 0.03;
}

/** Ожидаемая рыночная ценность похода — от неё гильдия и считает цену контракта */
export function expectedMercValue(level: number, grade: Grade, tier: number): number {
  const gIdx = GRADES.indexOf(grade);
  const minutes = MERC_DURATION_MIN[clamp(tier, 0, MERC_DURATION_MIN.length - 1)];
  const kills = mercKills(level, gIdx, minutes);
  const matValue = 5 + 4 * tier;
  return Math.round(
    kills * ((mercStoneChance(gIdx) / 100) * avgStoneValue(tier) + 0.78 * 2 * matValue)
  );
}

/**
 * Цена контракта: доля от ожидаемой добычи, зависящая от надёжности.
 * rel 100% → окупается с прибылью, rel 30% и ниже → чистая авантюра.
 */
export function mercPrice(level: number, grade: Grade, reliability: number, tier: number): number {
  return Math.round(expectedMercValue(level, grade, tier) * (0.25 + reliability / 200));
}

export const mercCostFor = (candidate: MercCandidate, tier: number) =>
  mercPrice(candidate.level, candidate.grade, candidate.reliability, tier);

/** Наёмник приносит ТОЛЬКО камни чудовищ и материалы монстров */
export function simulateMercRun(level: number, grade: Grade, locationId: string): MercLootEntry {
  const gIdx = GRADES.indexOf(grade);
  const luck = gIdx * 0.02;
  const loc = LOCATIONS.find((l) => l.id === locationId) ?? locationForLevel(level);
  const minutes = MERC_DURATION_MIN[clamp(loc.tier, 0, MERC_DURATION_MIN.length - 1)];
  const kills = mercKills(level, gIdx, minutes);
  const stones: Partial<Record<StoneGrade, number>> = {};
  const materials: Record<string, number> = {};

  for (let i = 0; i < kills; i++) {
    if (chance(mercStoneChance(gIdx))) {
      const sg = stoneGradeForTier(loc.tier, luck);
      stones[sg] = (stones[sg] ?? 0) + 1;
    }
    if (chance(78)) {
      const m = pick(loc.monsters);
      materials[m.materialId] = (materials[m.materialId] ?? 0) + randInt(1, 3);
    }
  }
  return { stones, materials };
}

// ---------- Misc ----------

export function emptyInventory(): Inventory {
  return {
    items: [],
    potions: { hp_s: 2, hp_m: 0, hp_l: 0, mp_s: 1, mp_m: 0, mp_l: 0 },
    stones: { F: 0, E: 0, D: 0, C: 0, B: 0, A: 0, S: 0, SS: 0 },
    materials: {},
  };
}

export function sellableItems(stats: ItemStats): string[] {
  const parts: string[] = [];
  if (stats.dmgMin || stats.dmgMax)
    parts.push(`Урон ${stats.dmgMin ?? 0}–${stats.dmgMax ?? 0}`);
  if (stats.hp) parts.push(`HP ${stats.hp > 0 ? "+" : ""}${stats.hp}`);
  if (stats.def) parts.push(`Защ ${stats.def > 0 ? "+" : ""}${stats.def}%`);
  if (stats.agi) parts.push(`Ловк ${stats.agi > 0 ? "+" : ""}${stats.agi}%`);
  if (stats.crit) parts.push(`Крит +${stats.crit}%`);
  if (stats.critMult) parts.push(`Крит.урон +${stats.critMult.toFixed(2)}x`);
  if (stats.wis) parts.push(`Мудр +${stats.wis}`);
  return parts;
}
