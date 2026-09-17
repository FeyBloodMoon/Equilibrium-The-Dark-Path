import type { StatBlock } from "./types";

export type ClassId = "warrior" | "rogue" | "mage" | "paladin" | "ranger" | "berserker";
export type Gender = "male" | "female";

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  branch: 0 | 1;
  tier: number; // 0..3 position in branch
  maxRank: number;
  /** stat bonus per rank */
  bonus: Partial<Record<keyof StatBlock, number>>;
  /** % bonus to spell power per rank */
  spellPower?: number;
  /** % bonus to loot / gold find per rank */
  greed?: number;
  /** lifesteal % per rank */
  lifesteal?: number;
}

export type SpellType = "damage" | "heal" | "buff";

export interface ClassSpell {
  id: string;
  name: string;
  icon: string;
  mana: number;
  minLevel: number;
  type: SpellType;
  desc: string;
  /** damage = wisScale*wis + weaponScale*avgWeaponDamage + lvlScale*level */
  wisScale?: number;
  weaponScale?: number;
  lvlScale?: number;
  defIgnore?: number; // 0..1 fraction of monster defense ignored
  critBonus?: number;
  healPct?: number; // % of max hp
  healWis?: number;
  buffMult?: number; // damage multiplier while active
  buffTurns?: number;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;
  desc: string;
  color: string;
  accent: string;
  base: {
    hp: number;
    dmgMin: number;
    dmgMax: number;
    def: number;
    agi: number;
    crit: number;
    critMult: number;
    wis: number;
  };
  growth: {
    hp: number;
    dmgMin: number;
    dmgMax: number;
    def: number;
    agi: number;
    crit: number;
    wis: number;
  };
  spells: ClassSpell[];
  skills: SkillNode[];
  playstyle: string[];
}

export const CLASSES: ClassDef[] = [
  {
    id: "warrior",
    name: "Воин",
    title: "Стена из стали",
    desc: "Классический боец: много здоровья и защиты, надёжный урон. Прощает ошибки новичкам.",
    color: "#e2e8f0",
    accent: "#94a3b8",
    base: { hp: 125, dmgMin: 2, dmgMax: 4, def: 4, agi: 1, crit: 5, critMult: 2, wis: 5 },
    growth: { hp: 18, dmgMin: 1.2, dmgMax: 2.2, def: 0.8, agi: 0.35, crit: 0.3, wis: 1.2 },
    playstyle: ["Высокое здоровье", "Сильная защита", "Стабильный урон"],
    spells: [
      {
        id: "cleave",
        name: "Рассекающий удар",
        icon: "swords",
        mana: 14,
        minLevel: 1,
        type: "damage",
        desc: "Мощный удар оружием, игнорирует 30% защиты врага.",
        weaponScale: 2.1,
        lvlScale: 1.2,
        defIgnore: 0.3,
      },
      {
        id: "shieldwall",
        name: "Боевой клич",
        icon: "shield",
        mana: 22,
        minLevel: 4,
        type: "buff",
        desc: "+60% урона на 4 хода.",
        buffMult: 1.6,
        buffTurns: 4,
      },
      {
        id: "execute",
        name: "Казнь",
        icon: "skull",
        mana: 34,
        minLevel: 9,
        type: "damage",
        desc: "Добивающий удар с огромным шансом крита.",
        weaponScale: 3.2,
        lvlScale: 2.4,
        critBonus: 45,
      },
    ],
    skills: [
      { id: "w_tough", name: "Закалка", desc: "+22 здоровья", branch: 0, tier: 0, maxRank: 5, bonus: { hp: 22 } },
      { id: "w_plate", name: "Тяжёлый доспех", desc: "+2% защиты", branch: 0, tier: 1, maxRank: 5, bonus: { def: 2 } },
      { id: "w_second", name: "Второе дыхание", desc: "+2% вампиризма", branch: 0, tier: 2, maxRank: 3, bonus: {}, lifesteal: 2 },
      { id: "w_bulwark", name: "Оплот", desc: "+45 здоровья и +2% защиты", branch: 0, tier: 3, maxRank: 3, bonus: { hp: 45, def: 2 } },
      { id: "w_strength", name: "Сила удара", desc: "+2 к мин. и +3 к макс. урону", branch: 1, tier: 0, maxRank: 5, bonus: { dmgMin: 2, dmgMax: 3 } },
      { id: "w_precision", name: "Точность", desc: "+2% крит. шанса", branch: 1, tier: 1, maxRank: 5, bonus: { crit: 2 } },
      { id: "w_warcry", name: "Ярость боя", desc: "+15% силы умений", branch: 1, tier: 2, maxRank: 4, bonus: {}, spellPower: 15 },
      { id: "w_slayer", name: "Истребитель", desc: "+0.15x крит. урона", branch: 1, tier: 3, maxRank: 4, bonus: { critMult: 0.15 } },
    ],
  },
  {
    id: "rogue",
    name: "Разбойник",
    title: "Тень с клинком",
    desc: "Уклонение и критические удары. Хрупок, но уходит от ударов и режет по слабым местам.",
    color: "#c4b5fd",
    accent: "#8b5cf6",
    base: { hp: 92, dmgMin: 2, dmgMax: 5, def: 0, agi: 6, crit: 11, critMult: 2.1, wis: 7 },
    growth: { hp: 11, dmgMin: 1.4, dmgMax: 2.6, def: 0.2, agi: 1.1, crit: 0.7, wis: 1.4 },
    playstyle: ["Максимальный уворот", "Частые криты", "Мало здоровья"],
    spells: [
      {
        id: "backstab",
        name: "Удар в спину",
        icon: "sword",
        mana: 12,
        minLevel: 1,
        type: "damage",
        desc: "Быстрый укол с бонусом к криту и игнором половины защиты.",
        weaponScale: 1.7,
        lvlScale: 1.1,
        defIgnore: 0.5,
        critBonus: 25,
      },
      {
        id: "smoke",
        name: "Дымовая завеса",
        icon: "wind",
        mana: 20,
        minLevel: 4,
        type: "heal",
        desc: "Отскок и перевязка: 22% здоровья.",
        healPct: 22,
        healWis: 1,
      },
      {
        id: "thousand",
        name: "Тысяча порезов",
        icon: "swords",
        mana: 32,
        minLevel: 9,
        type: "damage",
        desc: "Град ударов, полностью игнорирующих защиту.",
        weaponScale: 2.6,
        lvlScale: 2,
        defIgnore: 1,
      },
    ],
    skills: [
      { id: "r_evasion", name: "Скольжение", desc: "+2.5% уворота", branch: 0, tier: 0, maxRank: 5, bonus: { agi: 2.5 } },
      { id: "r_shadow", name: "Тень", desc: "+12 здоровья и +1% уворота", branch: 0, tier: 1, maxRank: 5, bonus: { hp: 12, agi: 1 } },
      { id: "r_bleed", name: "Кровопускание", desc: "+2.5% вампиризма", branch: 0, tier: 2, maxRank: 3, bonus: {}, lifesteal: 2.5 },
      { id: "r_phantom", name: "Фантом", desc: "+3% уворота и +2% крита", branch: 0, tier: 3, maxRank: 3, bonus: { agi: 3, crit: 2 } },
      { id: "r_edge", name: "Острая грань", desc: "+3% крит. шанса", branch: 1, tier: 0, maxRank: 5, bonus: { crit: 3 } },
      { id: "r_poison", name: "Яды", desc: "+3 к мин. и +4 к макс. урону", branch: 1, tier: 1, maxRank: 5, bonus: { dmgMin: 3, dmgMax: 4 } },
      { id: "r_greed", name: "Ловкие пальцы", desc: "+12% добычи золота", branch: 1, tier: 2, maxRank: 4, bonus: {}, greed: 12 },
      { id: "r_assassin", name: "Ассасин", desc: "+0.2x крит. урона", branch: 1, tier: 3, maxRank: 4, bonus: { critMult: 0.2 } },
    ],
  },
  {
    id: "mage",
    name: "Маг",
    title: "Голос стихий",
    desc: "Огромный запас маны и разрушительные заклинания. В ближнем бою почти беспомощен.",
    color: "#93c5fd",
    accent: "#3b82f6",
    base: { hp: 84, dmgMin: 1, dmgMax: 3, def: 0, agi: 2, crit: 5, critMult: 2, wis: 16 },
    growth: { hp: 10, dmgMin: 1, dmgMax: 2, def: 0.25, agi: 0.5, crit: 0.35, wis: 4.2 },
    playstyle: ["Огромная мана", "Урон от мудрости", "Хрупкое тело"],
    spells: [
      {
        id: "firebolt",
        name: "Огненная стрела",
        icon: "flame",
        mana: 10,
        minLevel: 1,
        type: "damage",
        desc: "Дешёвый снаряд, пробивает половину защиты.",
        wisScale: 2.4,
        lvlScale: 1.4,
        defIgnore: 0.5,
      },
      {
        id: "mend",
        name: "Восстановление",
        icon: "sparkles",
        mana: 20,
        minLevel: 3,
        type: "heal",
        desc: "Лечит 26% здоровья + мудрость.",
        healPct: 26,
        healWis: 1.4,
      },
      {
        id: "lightning",
        name: "Удар молнии",
        icon: "zap",
        mana: 30,
        minLevel: 7,
        type: "damage",
        desc: "Разряд огромной силы с высоким шансом крита.",
        wisScale: 3.8,
        lvlScale: 2.2,
        defIgnore: 0.35,
        critBonus: 25,
      },
    ],
    skills: [
      { id: "m_focus", name: "Концентрация", desc: "+4 мудрости", branch: 0, tier: 0, maxRank: 5, bonus: { wis: 4 } },
      { id: "m_arcane", name: "Тайное знание", desc: "+14% силы умений", branch: 0, tier: 1, maxRank: 5, bonus: {}, spellPower: 14 },
      { id: "m_leech", name: "Похищение жизни", desc: "+3% вампиризма", branch: 0, tier: 2, maxRank: 3, bonus: {}, lifesteal: 3 },
      { id: "m_archmage", name: "Архимаг", desc: "+8 мудрости и +10% силы умений", branch: 0, tier: 3, maxRank: 3, bonus: { wis: 8 }, spellPower: 10 },
      { id: "m_ward", name: "Магический щит", desc: "+16 здоровья и +1.5% защиты", branch: 1, tier: 0, maxRank: 5, bonus: { hp: 16, def: 1.5 } },
      { id: "m_blink", name: "Мерцание", desc: "+2% уворота", branch: 1, tier: 1, maxRank: 5, bonus: { agi: 2 } },
      { id: "m_staff", name: "Боевой посох", desc: "+2 к мин. и +4 к макс. урону", branch: 1, tier: 2, maxRank: 4, bonus: { dmgMin: 2, dmgMax: 4 } },
      { id: "m_overload", name: "Перегрузка", desc: "+2.5% крита и +0.1x крит. урона", branch: 1, tier: 3, maxRank: 4, bonus: { crit: 2.5, critMult: 0.1 } },
    ],
  },
  {
    id: "paladin",
    name: "Паладин",
    title: "Свет и клятва",
    desc: "Гибрид танка и целителя: крепкая броня, самолечение и святая кара нежити.",
    color: "#fde68a",
    accent: "#f59e0b",
    base: { hp: 118, dmgMin: 2, dmgMax: 4, def: 5, agi: 1, crit: 5, critMult: 2, wis: 11 },
    growth: { hp: 16, dmgMin: 1.1, dmgMax: 2.1, def: 0.75, agi: 0.3, crit: 0.3, wis: 2.6 },
    playstyle: ["Танк с лечением", "Высокая защита", "Магия света"],
    spells: [
      {
        id: "smite",
        name: "Кара",
        icon: "sparkles",
        mana: 14,
        minLevel: 1,
        type: "damage",
        desc: "Святой удар: сила оружия и мудрости вместе.",
        weaponScale: 1.2,
        wisScale: 1.5,
        lvlScale: 1.2,
        defIgnore: 0.35,
      },
      {
        id: "lay_hands",
        name: "Наложение рук",
        icon: "heart",
        mana: 24,
        minLevel: 3,
        type: "heal",
        desc: "Мощное лечение: 32% здоровья + мудрость.",
        healPct: 32,
        healWis: 1.6,
      },
      {
        id: "divine",
        name: "Божественный гнев",
        icon: "zap",
        mana: 36,
        minLevel: 9,
        type: "damage",
        desc: "Столб света, пробивающий любую броню.",
        wisScale: 3.2,
        weaponScale: 1.4,
        lvlScale: 2,
        defIgnore: 0.8,
      },
    ],
    skills: [
      { id: "p_faith", name: "Вера", desc: "+3 мудрости и +12 здоровья", branch: 0, tier: 0, maxRank: 5, bonus: { wis: 3, hp: 12 } },
      { id: "p_blessing", name: "Благословение", desc: "+13% силы умений", branch: 0, tier: 1, maxRank: 5, bonus: {}, spellPower: 13 },
      { id: "p_aura", name: "Аура жизни", desc: "+3% вампиризма", branch: 0, tier: 2, maxRank: 3, bonus: {}, lifesteal: 3 },
      { id: "p_saint", name: "Святость", desc: "+40 здоровья и +6 мудрости", branch: 0, tier: 3, maxRank: 3, bonus: { hp: 40, wis: 6 } },
      { id: "p_armor", name: "Латная выучка", desc: "+2.2% защиты", branch: 1, tier: 0, maxRank: 5, bonus: { def: 2.2 } },
      { id: "p_zeal", name: "Рвение", desc: "+2 к мин. и +3 к макс. урону", branch: 1, tier: 1, maxRank: 5, bonus: { dmgMin: 2, dmgMax: 3 } },
      { id: "p_judge", name: "Правосудие", desc: "+2% крит. шанса", branch: 1, tier: 2, maxRank: 4, bonus: { crit: 2 } },
      { id: "p_oath", name: "Клятва стража", desc: "+2.5% защиты и +25 здоровья", branch: 1, tier: 3, maxRank: 4, bonus: { def: 2.5, hp: 25 } },
    ],
  },
  {
    id: "ranger",
    name: "Следопыт",
    title: "Глаз чащи",
    desc: "Универсал: меткий урон, хорошая ловкость и лучшая добыча трофеев в лесу.",
    color: "#86efac",
    accent: "#22c55e",
    base: { hp: 102, dmgMin: 2, dmgMax: 5, def: 1, agi: 4, crit: 8, critMult: 2, wis: 9 },
    growth: { hp: 13, dmgMin: 1.35, dmgMax: 2.5, def: 0.35, agi: 0.9, crit: 0.5, wis: 1.8 },
    playstyle: ["Баланс во всём", "Больше трофеев", "Меткие выстрелы"],
    spells: [
      {
        id: "aimed",
        name: "Меткий выстрел",
        icon: "crosshair",
        mana: 12,
        minLevel: 1,
        type: "damage",
        desc: "Прицельный выстрел в уязвимое место.",
        weaponScale: 1.9,
        lvlScale: 1.3,
        defIgnore: 0.45,
        critBonus: 12,
      },
      {
        id: "herbs",
        name: "Лесные травы",
        icon: "sparkles",
        mana: 18,
        minLevel: 3,
        type: "heal",
        desc: "Отвар из трав: 24% здоровья.",
        healPct: 24,
        healWis: 1.2,
      },
      {
        id: "volley",
        name: "Шквал стрел",
        icon: "wind",
        mana: 30,
        minLevel: 8,
        type: "damage",
        desc: "Залп, осыпающий врага десятком стрел.",
        weaponScale: 2.8,
        wisScale: 0.8,
        lvlScale: 1.8,
        defIgnore: 0.4,
      },
    ],
    skills: [
      { id: "g_eye", name: "Соколиный глаз", desc: "+2.5% крит. шанса", branch: 0, tier: 0, maxRank: 5, bonus: { crit: 2.5 } },
      { id: "g_draw", name: "Сильный натяг", desc: "+2 к мин. и +4 к макс. урону", branch: 0, tier: 1, maxRank: 5, bonus: { dmgMin: 2, dmgMax: 4 } },
      { id: "g_hunter", name: "Охотник", desc: "+15% добычи золота", branch: 0, tier: 2, maxRank: 4, bonus: {}, greed: 15 },
      { id: "g_master", name: "Мастер-лучник", desc: "+0.15x крит. урона и +2% крита", branch: 0, tier: 3, maxRank: 4, bonus: { critMult: 0.15, crit: 2 } },
      { id: "g_step", name: "Лёгкий шаг", desc: "+2% уворота", branch: 1, tier: 0, maxRank: 5, bonus: { agi: 2 } },
      { id: "g_camp", name: "Походный опыт", desc: "+18 здоровья", branch: 1, tier: 1, maxRank: 5, bonus: { hp: 18 } },
      { id: "g_nature", name: "Зов природы", desc: "+3 мудрости и +10% силы умений", branch: 1, tier: 2, maxRank: 4, bonus: { wis: 3 }, spellPower: 10 },
      { id: "g_survival", name: "Выживание", desc: "+2% защиты и +2% вампиризма", branch: 1, tier: 3, maxRank: 4, bonus: { def: 2 }, lifesteal: 2 },
    ],
  },
  {
    id: "berserker",
    name: "Берсерк",
    title: "Кровь и топор",
    desc: "Чудовищный разброс урона и вампиризм, но защита почти отсутствует. Риск и награда.",
    color: "#fca5a5",
    accent: "#dc2626",
    base: { hp: 112, dmgMin: 2, dmgMax: 7, def: 0, agi: 2, crit: 7, critMult: 2.4, wis: 6 },
    growth: { hp: 15, dmgMin: 1.5, dmgMax: 3.2, def: 0.15, agi: 0.5, crit: 0.45, wis: 1 },
    playstyle: ["Огромный разброс урона", "Вампиризм", "Никакой защиты"],
    spells: [
      {
        id: "rend",
        name: "Разрыв",
        icon: "swords",
        mana: 12,
        minLevel: 1,
        type: "damage",
        desc: "Дикий замах, игнорирующий 40% защиты.",
        weaponScale: 2.2,
        lvlScale: 1.3,
        defIgnore: 0.4,
      },
      {
        id: "rage",
        name: "Ярость",
        icon: "flame",
        mana: 22,
        minLevel: 4,
        type: "buff",
        desc: "+90% урона на 3 хода.",
        buffMult: 1.9,
        buffTurns: 3,
      },
      {
        id: "bloodbath",
        name: "Кровавая баня",
        icon: "skull",
        mana: 34,
        minLevel: 8,
        type: "damage",
        desc: "Безумная серия ударов с диким критом.",
        weaponScale: 3.4,
        lvlScale: 2.4,
        defIgnore: 0.5,
        critBonus: 30,
      },
    ],
    skills: [
      { id: "b_fury", name: "Неистовство", desc: "+3 к мин. и +6 к макс. урону", branch: 0, tier: 0, maxRank: 5, bonus: { dmgMin: 3, dmgMax: 6 } },
      { id: "b_blood", name: "Жажда крови", desc: "+3.5% вампиризма", branch: 0, tier: 1, maxRank: 5, bonus: {}, lifesteal: 3.5 },
      { id: "b_reckless", name: "Безрассудство", desc: "+3% крита, -1% защиты", branch: 0, tier: 2, maxRank: 4, bonus: { crit: 3, def: -1 } },
      { id: "b_titan", name: "Титан", desc: "+0.25x крит. урона", branch: 0, tier: 3, maxRank: 4, bonus: { critMult: 0.25 } },
      { id: "b_hide", name: "Шкура зверя", desc: "+26 здоровья", branch: 1, tier: 0, maxRank: 5, bonus: { hp: 26 } },
      { id: "b_scars", name: "Боевые шрамы", desc: "+1.5% защиты", branch: 1, tier: 1, maxRank: 5, bonus: { def: 1.5 } },
      { id: "b_totem", name: "Тотем предков", desc: "+12% силы умений", branch: 1, tier: 2, maxRank: 4, bonus: {}, spellPower: 12 },
      { id: "b_undying", name: "Неумирающий", desc: "+55 здоровья и +2% вампиризма", branch: 1, tier: 3, maxRank: 3, bonus: { hp: 55 }, lifesteal: 2 },
    ],
  },
];

export const getClass = (id: ClassId): ClassDef =>
  CLASSES.find((c) => c.id === id) ?? CLASSES[0];

export const getSkill = (classId: ClassId, skillId: string): SkillNode | undefined =>
  getClass(classId).skills.find((s) => s.id === skillId);

export const GENDER_LABEL: Record<Gender, string> = {
  male: "Мужчина",
  female: "Женщина",
};
