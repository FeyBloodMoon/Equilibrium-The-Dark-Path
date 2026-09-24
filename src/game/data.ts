import type {
  Grade,
  ItemStats,
  LocationW,
  PotionDef,
  PotionId,
  Slot,
  StoneGrade,
} from "./types";

export const GRADES: Grade[] = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
export const STONE_GRADES: StoneGrade[] = ["F", "E", "D", "C", "B", "A", "S", "SS"];

export const GRADE_MULT: Record<Grade, number> = {
  F: 1,
  E: 1.28,
  D: 1.62,
  C: 2.05,
  B: 2.65,
  A: 3.45,
  S: 4.5,
  SS: 5.9,
  SSS: 7.8,
};

export const GRADE_COLOR: Record<Grade, string> = {
  F: "#9aa3b2",
  E: "#8ee08a",
  D: "#5ec8f2",
  C: "#4f8ef7",
  B: "#a78bfa",
  A: "#f472b6",
  S: "#fb923c",
  SS: "#f87171",
  SSS: "#f4d78a",
};

export const STONE_VALUE: Record<StoneGrade, number> = {
  F: 6,
  E: 12,
  D: 22,
  C: 38,
  B: 64,
  A: 105,
  S: 170,
  SS: 280,
};

export const QUEST_GOLD_BASE: Record<Grade, number> = {
  F: 18,
  E: 30,
  D: 50,
  C: 85,
  B: 140,
  A: 220,
  S: 350,
  SS: 560,
  SSS: 900,
};

// ---------- Potions ----------

export const POTIONS: Record<PotionId, PotionDef> = {
  hp_s: { id: "hp_s", name: "Малое зелье жизни", kind: "hp", power: 60, price: 14 },
  hp_m: { id: "hp_m", name: "Зелье жизни", kind: "hp", power: 160, price: 38 },
  hp_l: { id: "hp_l", name: "Великое зелье жизни", kind: "hp", power: 420, price: 95 },
  mp_s: { id: "mp_s", name: "Малый эликсир маны", kind: "mp", power: 45, price: 12 },
  mp_m: { id: "mp_m", name: "Эликсир маны", kind: "mp", power: 130, price: 34 },
  mp_l: { id: "mp_l", name: "Великий эликсир маны", kind: "mp", power: 340, price: 85 },
};

export const POTION_ORDER: PotionId[] = ["hp_s", "hp_m", "hp_l", "mp_s", "mp_m", "mp_l"];

// ---------- Equipment bases ----------

export interface GearBase {
  base: string;
  slot: Slot;
  flavor: string;
  make: (gradeMult: number, lvl: number) => ItemStats;
}

export const WEAPON_BASES: GearBase[] = [
  {
    base: "Меч",
    slot: "weapon",
    flavor: "Надёжный клинок стражи",
    make: (g, l) => ({
      dmgMin: Math.round((2 + 0.9 * l) * g),
      dmgMax: Math.round((4 + 1.8 * l) * g),
      crit: Math.round(2 * g),
    }),
  },
  {
    base: "Топор",
    slot: "weapon",
    flavor: "Тяжёлая рубящая сталь",
    make: (g, l) => ({
      dmgMin: Math.round((1 + 0.7 * l) * g),
      dmgMax: Math.round((6 + 2.3 * l) * g),
      critMult: 0.15 * g,
    }),
  },
  {
    base: "Кинжал",
    slot: "weapon",
    flavor: "Быстрый и подлый",
    make: (g, l) => ({
      dmgMin: Math.round((3 + 1.1 * l) * g),
      dmgMax: Math.round((5 + 1.4 * l) * g),
      agi: Math.round(2 * g),
      crit: Math.round(4 * g),
    }),
  },
  {
    base: "Посох",
    slot: "weapon",
    flavor: "Проводник чар",
    make: (g, l) => ({
      dmgMin: Math.round((2 + 0.8 * l) * g),
      dmgMax: Math.round((5 + 1.6 * l) * g),
      wis: Math.round((1 + 0.4 * l) * g),
    }),
  },
  {
    base: "Булава",
    slot: "weapon",
    flavor: "Крушит доспехи",
    make: (g, l) => ({
      dmgMin: Math.round((3 + 1.2 * l) * g),
      dmgMax: Math.round((5 + 1.7 * l) * g),
      hp: Math.round((10 + 5 * l) * g * 0.7),
    }),
  },
];

export const ARMOR_BASES: GearBase[] = [
  {
    base: "Кольчуга",
    slot: "armor",
    flavor: "Стальные кольца",
    make: (g, l) => ({
      hp: Math.round((26 + 9 * l) * g),
      def: Math.min(40, Math.round((2 + 0.8 * l) * g)),
    }),
  },
  {
    base: "Кожаный доспех",
    slot: "armor",
    flavor: "Лёгкий и бесшумный",
    make: (g, l) => ({
      hp: Math.round((16 + 6 * l) * g),
      def: Math.min(30, Math.round((1 + 0.6 * l) * g)),
      agi: Math.round(1.6 * g),
    }),
  },
  {
    base: "Латный панцирь",
    slot: "armor",
    flavor: "Живая крепость",
    make: (g, l) => ({
      hp: Math.round((38 + 12 * l) * g),
      def: Math.min(55, Math.round((3 + 1.1 * l) * g)),
      agi: -Math.round(1.2 * g),
    }),
  },
  {
    base: "Мантия",
    slot: "armor",
    flavor: "Ткань, пропитанная магией",
    make: (g, l) => ({
      hp: Math.round((14 + 5 * l) * g),
      def: Math.min(25, Math.round((1 + 0.5 * l) * g)),
      wis: Math.round((1 + 0.5 * l) * g),
    }),
  },
];

export const CHARM_BASES: GearBase[] = [
  {
    base: "Кольцо",
    slot: "charm",
    flavor: "Старый перстень",
    make: (g, l) => ({
      crit: Math.round(1.8 * g + 0.25 * l),
      dmgMax: Math.round((1 + 0.5 * l) * g),
    }),
  },
  {
    base: "Амулет",
    slot: "charm",
    flavor: "Тёплый на ощупь",
    make: (g, l) => ({
      hp: Math.round((12 + 5 * l) * g),
      agi: Math.round(1.2 * g),
    }),
  },
  {
    base: "Талисман",
    slot: "charm",
    flavor: "Оберег странника",
    make: (g, l) => ({
      wis: Math.round((1 + 0.35 * l) * g),
      critMult: 0.1 * g,
    }),
  },
];

// ---------- Modifiers (elite drops) ----------

export interface ModifierDef {
  prefix: string;
  desc: string;
  apply: (stats: ItemStats, lvl: number) => void;
}

export const MODIFIERS: ModifierDef[] = [
  {
    prefix: "Кровавый",
    desc: "+6% крит",
    apply: (s) => {
      s.crit = (s.crit ?? 0) + 6;
    },
  },
  {
    prefix: "Жестокий",
    desc: "+0.5x крит. урон",
    apply: (s) => {
      s.critMult = (s.critMult ?? 0) + 0.5;
    },
  },
  {
    prefix: "Титановый",
    desc: "+защита и здоровье",
    apply: (s, l) => {
      s.def = (s.def ?? 0) + 3 + Math.floor(l / 4);
      s.hp = (s.hp ?? 0) + 14 + 3 * l;
    },
  },
  {
    prefix: "Стремительный",
    desc: "+6% уворот",
    apply: (s) => {
      s.agi = (s.agi ?? 0) + 6;
    },
  },
  {
    prefix: "Мудрый",
    desc: "+мудрость",
    apply: (s, l) => {
      s.wis = (s.wis ?? 0) + 3 + Math.floor(l / 2);
    },
  },
  {
    prefix: "Грозовой",
    desc: "+урон",
    apply: (s, l) => {
      s.dmgMin = (s.dmgMin ?? 0) + 2 + l;
      s.dmgMax = (s.dmgMax ?? 0) + 3 + l;
    },
  },
];

// ---------- Locations & monsters ----------

export const LOCATIONS: LocationW[] = [
  {
    id: "grove",
    name: "Тихая роща",
    desc: "Солнечные поляны и вековые дубы. Здесь делают первые шаги искатели приключений.",
    tier: 0,
    minLvl: 1,
    maxLvl: 3,
    img: "/img/loc-grove.jpg",
    accent: "#7fd68a",
    monsters: [
      {
        id: "slime",
        name: "Слайм",
        icon: "droplets",
        hpMul: 1.35,
        dmgMul: 0.8,
        defAdd: 6,
        agiAdd: -5,
        critAdd: -3,
        materialId: "slime_goo",
        materialName: "Сгусток слизи",
      },
      {
        id: "wolf",
        name: "Дикий волк",
        icon: "paw",
        hpMul: 0.95,
        dmgMul: 1.25,
        defAdd: 0,
        agiAdd: 12,
        critAdd: 6,
        materialId: "wolf_pelt",
        materialName: "Волчья шкура",
      },
      {
        id: "sprite",
        name: "Лесной дух",
        icon: "sparkles",
        hpMul: 0.8,
        dmgMul: 1.1,
        defAdd: 0,
        agiAdd: 18,
        critAdd: 10,
        materialId: "sprite_dust",
        materialName: "Лесная пыльца",
      },
    ],
  },
  {
    id: "swamp",
    name: "Гнилые болота",
    desc: "Топь сгубила не одного героя. В тумане слышится шипение и чавканье.",
    tier: 1,
    minLvl: 4,
    maxLvl: 7,
    img: "/img/loc-swamp.jpg",
    accent: "#86b561",
    monsters: [
      {
        id: "goblin",
        name: "Гоблин-разбойник",
        icon: "venetian",
        hpMul: 1.0,
        dmgMul: 1.1,
        defAdd: 2,
        agiAdd: 14,
        critAdd: 8,
        materialId: "goblin_ear",
        materialName: "Гоблинское ухо",
      },
      {
        id: "viper",
        name: "Болотный уж",
        icon: "bug",
        hpMul: 0.9,
        dmgMul: 1.35,
        defAdd: 0,
        agiAdd: 20,
        critAdd: 12,
        materialId: "viper_venom",
        materialName: "Яд ужа",
      },
      {
        id: "golem_mud",
        name: "Трясинный голем",
        icon: "mountain",
        hpMul: 1.7,
        dmgMul: 1.05,
        defAdd: 14,
        agiAdd: -8,
        critAdd: -4,
        materialId: "dense_silt",
        materialName: "Плотный ил",
      },
    ],
  },
  {
    id: "hills",
    name: "Скалистые холмы",
    desc: "Ветер свистит между утёсами. Орки устраивают здесь стоянки, а гарпии — гнёзда.",
    tier: 2,
    minLvl: 8,
    maxLvl: 12,
    img: "/img/loc-hills.jpg",
    accent: "#d9b36c",
    monsters: [
      {
        id: "orc",
        name: "Орк-воин",
        icon: "swords",
        hpMul: 1.25,
        dmgMul: 1.35,
        defAdd: 8,
        agiAdd: 0,
        critAdd: 5,
        materialId: "orc_tusk",
        materialName: "Клык орка",
      },
      {
        id: "harpy",
        name: "Гарпия",
        icon: "feather",
        hpMul: 0.85,
        dmgMul: 1.2,
        defAdd: 0,
        agiAdd: 26,
        critAdd: 10,
        materialId: "harpy_feather",
        materialName: "Перо гарпии",
      },
      {
        id: "elemental",
        name: "Каменный элементаль",
        icon: "hammer",
        hpMul: 1.8,
        dmgMul: 1.15,
        defAdd: 22,
        agiAdd: -10,
        critAdd: -5,
        materialId: "stone_heart",
        materialName: "Каменное сердце",
      },
    ],
  },
  {
    id: "thicket",
    name: "Тёмная чаща",
    desc: "Сюда не проникает солнце. Паутина с крышу дома и шёпот на мёртвом языке.",
    tier: 3,
    minLvl: 13,
    maxLvl: 18,
    img: "/img/loc-thicket.jpg",
    accent: "#a78bfa",
    monsters: [
      {
        id: "spider",
        name: "Теневой паук",
        icon: "ghost",
        hpMul: 1.0,
        dmgMul: 1.3,
        defAdd: 4,
        agiAdd: 24,
        critAdd: 14,
        materialId: "spider_silk",
        materialName: "Паучий шёлк",
      },
      {
        id: "darkelf",
        name: "Тёмный эльф",
        icon: "moon",
        hpMul: 0.95,
        dmgMul: 1.45,
        defAdd: 6,
        agiAdd: 20,
        critAdd: 18,
        materialId: "dark_rune",
        materialName: "Тёмная руна",
      },
      {
        id: "ghoul",
        name: "Вурдалак",
        icon: "skull",
        hpMul: 1.5,
        dmgMul: 1.3,
        defAdd: 10,
        agiAdd: 4,
        critAdd: 8,
        materialId: "ghoul_fang",
        materialName: "Гнилой клык",
      },
    ],
  },
  {
    id: "peaks",
    name: "Пики драконов",
    desc: "Крыша мира. Здесь облака горят, а в небе кружат тени с крыльями.",
    tier: 4,
    minLvl: 19,
    maxLvl: 25,
    img: "/img/loc-peaks.jpg",
    accent: "#fb923c",
    monsters: [
      {
        id: "wyvern",
        name: "Виверна",
        icon: "wind",
        hpMul: 1.15,
        dmgMul: 1.5,
        defAdd: 8,
        agiAdd: 22,
        critAdd: 14,
        materialId: "wyvern_scale",
        materialName: "Чешуя виверны",
      },
      {
        id: "drake",
        name: "Дрейк",
        icon: "flame",
        hpMul: 1.6,
        dmgMul: 1.4,
        defAdd: 18,
        agiAdd: -4,
        critAdd: 8,
        materialId: "drake_gland",
        materialName: "Дрейкова жила",
      },
      {
        id: "dragonblood",
        name: "Драконорождённый",
        icon: "crown",
        hpMul: 1.3,
        dmgMul: 1.55,
        defAdd: 14,
        agiAdd: 10,
        critAdd: 16,
        materialId: "dragon_blood",
        materialName: "Кровь дракона",
      },
    ],
  },
];

// ---------- Mercenary expedition durations (minutes) by location tier ----------

export const MERC_DURATION_MIN: number[] = [4, 6, 9, 13, 18];

// ---------- Guild board timers ----------

export const BOARD_AUTO_MS = 5 * 60 * 1000;
export const BOARD_MANUAL_MS = 10 * 60 * 1000;

/** Ассортимент лавки и кандидаты-наёмники: авто раз в 5 мин, вручную не чаще 5 мин */
export const STOCK_AUTO_MS = 5 * 60 * 1000;
export const STOCK_MANUAL_MS = 5 * 60 * 1000;
export const MERCS_AUTO_MS = 5 * 60 * 1000;
export const MERCS_MANUAL_MS = 5 * 60 * 1000;

/** Отдых в городе: 1/300 максимального здоровья в секунду (полное восстановление за 5 минут) */
export const REGEN_PER_SEC_DIV = 300;

/** Цена исцеления в церкви: базовая такса + плата за каждую единицу здоровья */
export const CHURCH_BASE_FEE = 40;
export const CHURCH_PER_HP = 1.4;
/** Надбавка за «святость» — растёт с максимальным запасом здоровья героя */
export const CHURCH_MAXHP_FACTOR = 0.35;

// ---------- Mercenary names ----------

export const MERC_NAMES = [
  "Гаррот",
  "Бейн",
  "Сигрид",
  "Торвальд",
  "Мирра",
  "Кассий",
  "Одрин",
  "Велька",
  "Рагнар",
  "Эйла",
  "Дункан",
  "Сельма",
  "Грод",
  "Ингвар",
  "Лианна",
];

export const MERC_TITLES = [
  "Серый Волк",
  "Тихий Клинок",
  "Дитя Шторма",
  "Костолом",
  "Следопыт",
  "Железная Рука",
  "Ночной Странник",
  "Хранитель Клятв",
];
