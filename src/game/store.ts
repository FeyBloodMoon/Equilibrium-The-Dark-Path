import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BOARD_AUTO_MS,
  BOARD_MANUAL_MS,
  CHURCH_BASE_FEE,
  CHURCH_MAXHP_FACTOR,
  CHURCH_PER_HP,
  GRADES,
  LOCATIONS,
  MERCS_AUTO_MS,
  MERCS_MANUAL_MS,
  POTIONS,
  REGEN_PER_SEC_DIV,
  STOCK_AUTO_MS,
  STOCK_MANUAL_MS,
  STONE_GRADES,
  STONE_VALUE,
} from "./data";
import { CLASSES, getClass } from "./classes";
import type { ClassId, ClassSpell, Gender } from "./classes";
import {
  baseStats,
  clamp,
  emptyInventory,
  genItem,
  genMercCandidate,
  genMonster,
  genQuest,
  genQuestBoard,
  genShopStock,
  itemValue,
  locationForLevel,
  maxMana,
  mercCostFor,
  mercDurationMs,
  playerExtras,
  playerStats,
  randInt,
  rollStrike,
  simulateMercRun,
  uid,
  xpForLevel,
} from "./engine";
import { play, setMuted } from "./sound";
import type {
  CombatState,
  Floater,
  Grade,
  Inventory,
  Item,
  LogEntry,
  LogKind,
  Merc,
  MercCandidate,
  MercLootEntry,
  Player,
  PotionId,
  Quest,
  Slot,
  StoneGrade,
  View,
} from "./types";

interface GameState {
  started: boolean;
  view: View;
  player: Player;
  inventory: Inventory;
  quests: Quest[];
  mercs: Merc[];
  mercCandidates: MercCandidate[];
  boardLastChange: number;
  boardLastManual: number;
  shopLastChange: number;
  shopLastManual: number;
  mercsLastChange: number;
  mercsLastManual: number;
  regenAt: number;
  shopStock: Item[];
  combat: CombatState | null;
  logSeq: number;
  toast: { id: number; text: string; kind: "good" | "bad" | "info" } | null;

  startGame: (name: string, classId: ClassId, gender: Gender) => void;
  resetGame: () => void;
  setView: (v: View) => void;
  toggleSound: () => void;
  showToast: (text: string, kind?: "good" | "bad" | "info") => void;
  clearToast: () => void;

  // city / rest
  regenTick: () => void;
  churchHeal: () => void;

  // shop
  refreshStock: (auto?: boolean) => void;
  stockTick: () => void;
  buyItem: (itemId: string) => void;
  buyPotion: (id: PotionId, qty?: number) => void;
  sellStone: (g: StoneGrade) => void;
  sellAllStones: () => void;
  sellMaterial: (id: string) => void;
  sellAllMaterials: () => void;
  sellItem: (itemId: string) => void;

  // inventory
  equip: (itemId: string) => void;
  unequip: (slot: Slot) => void;

  // skills
  learnSkill: (skillId: string) => void;
  resetSkills: () => void;

  // guild
  acceptQuest: (id: string) => void;
  abandonQuest: (id: string) => void;
  refreshBoard: (auto?: boolean) => void;
  boardTick: () => void;
  turnInQuest: (id: string) => void;
  rerollMercs: (auto?: boolean) => void;
  mercsTick: () => void;
  hireMerc: (candidateId: string, locationId: string) => void;
  claimMerc: (id: string) => void;

  // expedition
  startExpedition: (locationId: string) => void;
  fleeExpedition: () => void;
  closeResult: () => void;
  tick: () => void;
  usePotion: (id: PotionId) => void;
  castSpell: (id: string) => void;
  toggleAutoPotion: () => void;

  // save / load / cheats
  exportSave: () => string;
  importSave: (json: string) => boolean;
  cheat: (action: string, payload?: any) => void;
}

let floaterSeq = 0;
let toastSeq = 0;

export function newPlayer(
  name: string,
  classId: ClassId = "warrior",
  gender: Gender = "male"
): Player {
  const base = baseStats(1, classId);
  return {
    name,
    classId,
    gender,
    level: 1,
    xp: 0,
    gold: 80,
    hp: base.hp,
    mana: maxMana(base),
    skillPoints: 1,
    skills: {},
    equipment: {},
    autoPotion: true,
    sound: true,
  };
}

function mergeLoot(inv: Inventory, loot: MercLootEntry): Inventory {
  const stones = { ...inv.stones };
  (Object.entries(loot.stones) as [StoneGrade, number][]).forEach(([g, n]) => {
    stones[g] = (stones[g] ?? 0) + n;
  });
  const materials = { ...inv.materials };
  Object.entries(loot.materials).forEach(([k, n]) => {
    materials[k] = (materials[k] ?? 0) + n;
  });
  return { ...inv, stones, materials };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const pushLog = (combat: CombatState, kind: LogKind, text: string): CombatState => {
        const entry: LogEntry = { id: get().logSeq + 1, kind, text };
        set({ logSeq: entry.id });
        return { ...combat, log: [...combat.log, entry].slice(-64) };
      };

      const setFloater = (combat: CombatState, f: Omit<Floater, "id">): CombatState => {
        floaterSeq += 1;
        return { ...combat, floater: { ...f, id: floaterSeq } };
      };

      const gainXp = (amount: number, combat: CombatState | null) => {
        const p = { ...get().player };
        p.xp += amount;
        let leveled = 0;
        while (p.xp >= xpForLevel(p.level)) {
          p.xp -= xpForLevel(p.level);
          p.level += 1;
          p.skillPoints += 1;
          leveled += 1;
        }
        set({ player: p });
        let c = combat;
        if (leveled > 0) {
          play("level");
          if (c) {
            const st = playerStats(p);
            c = { ...c, playerHp: st.hp, playerMana: maxMana(st) };
            c = pushLog(
              c,
              "level",
              `Новый уровень! Теперь ${p.level}. +${leveled} очк. навыков, здоровье и мана восстановлены.`
            );
          }
        }
        return c;
      };

      const resolveKill = (combat: CombatState, m: NonNullable<CombatState["monster"]>) => {
        let c = combat;
        const s = { ...c.session };
        const loc = LOCATIONS.find((l) => l.id === c.locationId)!;
        const extras = playerExtras(get().player);
        const goldGain = Math.round(
          (6 + 3 * m.level + Math.random() * 5) * (m.elite ? 3 : 1) * (1 + extras.greed / 100)
        );
        s.gold += goldGain;
        s.xp += m.xp;

        const stoneChance = m.elite ? 100 : 55 + extras.greed * 0.2;
        let stoneGained: StoneGrade | null = null;
        if (Math.random() * 100 < stoneChance) {
          stoneGained = m.stoneGrade;
          s.stones[stoneGained] = (s.stones[stoneGained] ?? 0) + 1;
        }
        let matsGained = 0;
        if (Math.random() * 100 < (m.elite ? 100 : 72)) {
          matsGained = randInt(1, m.elite ? 3 : 2);
          s.materials[m.base.materialId] = (s.materials[m.base.materialId] ?? 0) + matsGained;
        }
        let itemGained: Item | null = null;
        if (m.elite && Math.random() < 0.05) {
          const slot = (["weapon", "armor", "charm"] as Slot[])[randInt(0, 2)];
          const gi = clamp(loc.tier * 2 + randInt(1, 3), 0, GRADES.length - 1);
          itemGained = genItem(slot, GRADES[gi], m.level, true);
          s.items.push(itemGained);
        }
        c = { ...c, session: s, kills: c.kills + 1, monster: null, buff: null };

        const lootBits: string[] = [`+${m.xp} опыт`, `+${goldGain} зол`];
        if (stoneGained) lootBits.push(`камень ${stoneGained}`);
        if (matsGained) lootBits.push(`${m.base.materialName} ×${matsGained}`);
        if (itemGained) lootBits.push(`${itemGained.modifier ?? ""} ${itemGained.base} [${itemGained.grade}]`);
        c = pushLog(c, "loot", `${m.name} повержен! ${lootBits.join(", ")}.`);

        const completedNow: string[] = [];
        const quests = get().quests.map((q) => {
          if (q.status !== "active") return q;
          let next = q;
          if (q.kind === "kill" && q.monsterId === m.base.id) {
            next = { ...q, progress: Math.min(q.need, q.progress + 1) };
          }
          if (q.kind === "elite" && q.monsterId === c.locationId && m.elite) {
            next = { ...q, progress: Math.min(q.need, q.progress + 1) };
          }
          if (next !== q && next.progress >= next.need && q.progress < q.need) {
            completedNow.push(next.title);
          }
          return next;
        });
        set({ quests });
        completedNow.forEach((t) => {
          c = pushLog(c, "level", `Контракт выполнен: «${t}» — сдайте его в гильдии!`);
        });

        c = gainXp(m.xp, c) ?? c;
        return { ...c, phase: "search" as const, nextActionAt: Date.now() + 1900 };
      };

      const resolveDeath = (combat: CombatState) => {
        let c = combat;
        const s = c.session;
        const keptGold = Math.round(s.gold * 0.2);
        const inv0 = get().inventory;
        const inv = { ...inv0, stones: { ...inv0.stones }, materials: { ...inv0.materials }, items: [...inv0.items] };
        let keptStones = 0;
        (Object.entries(s.stones) as [StoneGrade, number][]).forEach(([g, n]) => {
          const keep = Math.round((n ?? 0) * 0.2);
          keptStones += keep;
          inv.stones[g] = (inv.stones[g] ?? 0) + keep;
        });
        Object.entries(s.materials).forEach(([k, n]) => {
          const keep = Math.round(n * 0.2);
          if (keep > 0) inv.materials[k] = (inv.materials[k] ?? 0) + keep;
        });
        s.items.forEach((it) => {
          if (Math.random() < 0.2) inv.items.push(it);
        });
        const st = playerStats(get().player);
        const p = { ...get().player, gold: get().player.gold + keptGold };
        p.xp = Math.max(0, p.xp - Math.round(s.xp * 0.8));
        // очнулся в городе едва живым — дальше только отдых, зелья или церковь
        p.hp = Math.max(1, Math.round(st.hp * 0.1));
        p.mana = 0;
        set({ inventory: inv, player: p, regenAt: Date.now() });
        play("death");
        c = pushLog(c, "death", "Вы пали в бою... Очнувшись в городе, вы обнаружили пропажу 80% добычи.");
        return {
          ...c,
          phase: "result" as const,
          buff: null,
          result: {
            type: "dead" as const,
            lostGold: s.gold - keptGold,
            lostXp: Math.round(s.xp * 0.8),
            keptGold,
            keptStones,
          },
        };
      };

      const classSpell = (id: string): ClassSpell | undefined =>
        getClass(get().player.classId).spells.find((s) => s.id === id);

      return {
        started: false,
        view: "intro",
        player: newPlayer("Странник"),
        inventory: emptyInventory(),
        quests: [],
        mercs: [],
        mercCandidates: [],
        boardLastChange: 0,
        boardLastManual: 0,
        shopLastChange: 0,
        shopLastManual: 0,
        mercsLastChange: 0,
        mercsLastManual: 0,
        regenAt: 0,
        shopStock: [],
        combat: null,
        logSeq: 0,
        toast: null,

        showToast: (text, kind = "info") => {
          toastSeq += 1;
          set({ toast: { id: toastSeq, text, kind } });
        },
        clearToast: () => set({ toast: null }),

        startGame: (name, classId, gender) => {
          const p = newPlayer(name.trim() || "Странник", classId, gender);
          const inv = emptyInventory();
          const startSlot: Slot = classId === "mage" ? "charm" : "weapon";
          const starter = genItem(startSlot, "F", 1);
          inv.items.push(starter);
          p.equipment[startSlot] = starter;
          set({
            started: true,
            view: "city",
            player: p,
            inventory: inv,
            quests: genQuestBoard(1, []),
            mercs: [],
            mercCandidates: [genMercCandidate(1), genMercCandidate(1), genMercCandidate(1)],
            boardLastChange: Date.now(),
            boardLastManual: 0,
            shopLastChange: Date.now(),
            shopLastManual: 0,
            mercsLastChange: Date.now(),
            mercsLastManual: 0,
            regenAt: Date.now(),
            shopStock: genShopStock(1),
            combat: null,
            logSeq: 0,
          });
          play("level");
        },

        resetGame: () => {
          set({
            started: false,
            view: "intro",
            player: newPlayer("Странник"),
            inventory: emptyInventory(),
            quests: [],
            mercs: [],
            mercCandidates: [],
            shopStock: [],
            combat: null,
            logSeq: 0,
            toast: null,
          });
        },

        setView: (v) => {
          const { combat, view } = get();
          if (combat && combat.phase !== "result" && v !== "combat") return;
          if (view === v) return;
          play("click");
          if (v === "shop" && get().shopStock.length === 0) {
            set({ shopStock: genShopStock(get().player.level) });
          }
          set({ view: v });
        },

        toggleSound: () => {
          const p = { ...get().player, sound: !get().player.sound };
          setMuted(!p.sound);
          set({ player: p });
          if (p.sound) play("click");
        },

        // ---------------- city / rest ----------------
        /** Отдых: 1/300 макс. HP в секунду. Мана — вдвое быстрее. */
        regenTick: () => {
          const { started, combat, player, regenAt } = get();
          if (!started || (combat && combat.phase !== "result")) {
            if (regenAt !== 0) set({ regenAt: Date.now() });
            return;
          }
          const now = Date.now();
          const last = regenAt || now;
          const dt = Math.min((now - last) / 1000, 12 * 60 * 60);
          if (dt <= 0) return;
          const st = playerStats(player);
          const manaMax = maxMana(st);
          if (player.hp >= st.hp && player.mana >= manaMax) {
            set({ regenAt: now });
            return;
          }
          set({
            regenAt: now,
            player: {
              ...player,
              hp: Math.min(st.hp, player.hp + (st.hp / REGEN_PER_SEC_DIV) * dt),
              mana: Math.min(manaMax, player.mana + ((manaMax / REGEN_PER_SEC_DIV) * dt) / 0.5),
            },
          });
        },

        churchHeal: () => {
          const { player } = get();
          const st = playerStats(player);
          const manaMax = maxMana(st);
          const price = churchPrice(player, st.hp, manaMax);
          if (price <= 0) {
            get().showToast("Жрец улыбается: «Ты и так полон сил»", "info");
            return;
          }
          if (player.gold < price) {
            get().showToast(`Пожертвование стоит ${price} золота`, "bad");
            return;
          }
          play("heal");
          set({
            player: { ...player, gold: player.gold - price, hp: st.hp, mana: manaMax },
            regenAt: Date.now(),
          });
          get().showToast("Свет наполняет тело: здоровье и мана восстановлены", "good");
        },

        // ---------------- shop ----------------
        refreshStock: (auto = false) => {
          const { shopLastManual, player } = get();
          const now = Date.now();
          if (!auto) {
            if (now - shopLastManual < STOCK_MANUAL_MS) {
              const left = Math.ceil((STOCK_MANUAL_MS - (now - shopLastManual)) / 1000);
              get().showToast(
                `Торговец разводит руками: новый товар привезут через ${Math.floor(left / 60)}:${String(
                  left % 60
                ).padStart(2, "0")}`,
                "bad"
              );
              return;
            }
            play("click");
          }
          set({
            shopStock: genShopStock(player.level),
            shopLastChange: now,
            shopLastManual: auto ? shopLastManual : now,
          });
          if (auto) get().showToast("Торговец разложил новый товар", "info");
        },

        stockTick: () => {
          const { shopLastChange, started } = get();
          if (!started) return;
          if (Date.now() - shopLastChange >= STOCK_AUTO_MS) get().refreshStock(true);
        },

        buyItem: (itemId) => {
          const { shopStock, player, inventory } = get();
          const item = shopStock.find((i) => i.id === itemId);
          if (!item || player.gold < item.value) return;
          play("buy");
          set({
            shopStock: shopStock.filter((i) => i.id !== itemId),
            player: { ...player, gold: player.gold - item.value },
            inventory: { ...inventory, items: [...inventory.items, item] },
          });
        },

        buyPotion: (id, qty = 1) => {
          const { player, inventory } = get();
          const def = POTIONS[id];
          const price = def.price * qty;
          if (player.gold < price) return;
          play("coin");
          set({
            player: { ...player, gold: player.gold - price },
            inventory: {
              ...inventory,
              potions: { ...inventory.potions, [id]: inventory.potions[id] + qty },
            },
          });
        },

        sellStone: (g) => {
          const { player, inventory } = get();
          if (inventory.stones[g] <= 0) return;
          play("coin");
          set({
            player: { ...player, gold: player.gold + STONE_VALUE[g] },
            inventory: { ...inventory, stones: { ...inventory.stones, [g]: inventory.stones[g] - 1 } },
          });
        },

        sellAllStones: () => {
          const { player, inventory } = get();
          let total = 0;
          const stones = { ...inventory.stones };
          (Object.keys(stones) as StoneGrade[]).forEach((g) => {
            total += stones[g] * STONE_VALUE[g];
            stones[g] = 0;
          });
          if (total <= 0) return;
          play("coin");
          set({ player: { ...player, gold: player.gold + total }, inventory: { ...inventory, stones } });
        },

        sellMaterial: (id) => {
          const { player, inventory } = get();
          const n = inventory.materials[id] ?? 0;
          if (n <= 0) return;
          play("coin");
          set({
            player: { ...player, gold: player.gold + materialValue(id) },
            inventory: { ...inventory, materials: { ...inventory.materials, [id]: n - 1 } },
          });
        },

        sellAllMaterials: () => {
          const { player, inventory } = get();
          let total = 0;
          const materials = { ...inventory.materials };
          Object.entries(materials).forEach(([id, n]) => {
            total += n * materialValue(id);
            materials[id] = 0;
          });
          if (total <= 0) return;
          play("coin");
          set({ player: { ...player, gold: player.gold + total }, inventory: { ...inventory, materials } });
        },

        sellItem: (itemId) => {
          const { player, inventory } = get();
          const item = inventory.items.find((i) => i.id === itemId);
          if (!item) return;
          play("coin");
          set({
            player: { ...player, gold: player.gold + Math.max(3, Math.round(item.value * 0.45)) },
            inventory: { ...inventory, items: inventory.items.filter((i) => i.id !== itemId) },
          });
        },

        // ---------------- inventory ----------------
        equip: (itemId) => {
          const { player, inventory } = get();
          const item = inventory.items.find((i) => i.id === itemId);
          if (!item) return;
          play("click");
          const items = inventory.items.filter((i) => i.id !== itemId);
          const prev = player.equipment[item.slot];
          if (prev) items.push(prev);
          set({
            player: { ...player, equipment: { ...player.equipment, [item.slot]: item } },
            inventory: { ...inventory, items },
          });
        },

        unequip: (slot) => {
          const { player, inventory } = get();
          const prev = player.equipment[slot];
          if (!prev) return;
          play("click");
          const eq = { ...player.equipment };
          delete eq[slot];
          set({
            player: { ...player, equipment: eq },
            inventory: { ...inventory, items: [...inventory.items, prev] },
          });
        },

        // ---------------- skills ----------------
        learnSkill: (skillId) => {
          const { player } = get();
          const cls = getClass(player.classId);
          const node = cls.skills.find((s) => s.id === skillId);
          if (!node || player.skillPoints <= 0) return;
          const rank = player.skills[skillId] ?? 0;
          if (rank >= node.maxRank) return;
          // требуется хотя бы 1 ранг в предыдущем узле той же ветки
          const prev = cls.skills.find((s) => s.branch === node.branch && s.tier === node.tier - 1);
          if (prev && (player.skills[prev.id] ?? 0) < 1) return;
          play("level");
          set({
            player: {
              ...player,
              skillPoints: player.skillPoints - 1,
              skills: { ...player.skills, [skillId]: rank + 1 },
            },
          });
        },

        resetSkills: () => {
          const { player } = get();
          const spent = Object.values(player.skills).reduce((a, b) => a + b, 0);
          if (spent === 0) return;
          const cost = spent * 25;
          if (player.gold < cost) {
            get().showToast(`Сброс стоит ${cost} золота`, "bad");
            return;
          }
          play("buy");
          set({
            player: { ...player, gold: player.gold - cost, skills: {}, skillPoints: player.skillPoints + spent },
          });
          get().showToast(`Навыки сброшены, возвращено ${spent} очк.`, "good");
        },

        // ---------------- guild ----------------
        acceptQuest: (id) => {
          const { quests } = get();
          if (quests.filter((q) => q.status === "active").length >= 5) return;
          play("click");
          set({ quests: quests.map((q) => (q.id === id ? { ...q, status: "active" as const } : q)) });
        },

        abandonQuest: (id) => {
          const { quests, player } = get();
          play("click");
          set({ quests: quests.map((q) => (q.id === id ? genQuest(player.level) : q)) });
        },

        refreshBoard: (auto = false) => {
          const { quests, player, boardLastManual } = get();
          const now = Date.now();
          if (!auto) {
            if (now - boardLastManual < BOARD_MANUAL_MS) {
              const left = Math.ceil((BOARD_MANUAL_MS - (now - boardLastManual)) / 1000);
              get().showToast(
                `Гильдия обновит доску через ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`,
                "bad"
              );
              return;
            }
            play("click");
          }
          set({
            quests: genQuestBoard(player.level, quests.filter((q) => q.status === "active")),
            boardLastChange: now,
            boardLastManual: auto ? boardLastManual : now,
          });
          if (auto) get().showToast("Гильдия вывесила новые контракты", "info");
        },

        boardTick: () => {
          const { boardLastChange, started } = get();
          if (!started) return;
          if (Date.now() - boardLastChange >= BOARD_AUTO_MS) get().refreshBoard(true);
        },

        turnInQuest: (id) => {
          const { quests, player, inventory } = get();
          const q = quests.find((x) => x.id === id);
          if (!q || q.status !== "active") return;
          if (q.kind === "stones" || q.kind === "materials") {
            const have =
              q.kind === "stones"
                ? inventory.stones[q.stoneGrade!] ?? 0
                : inventory.materials[q.materialId!] ?? 0;
            if (have < q.need) return;
            const inv = { ...inventory, stones: { ...inventory.stones }, materials: { ...inventory.materials } };
            if (q.kind === "stones") inv.stones[q.stoneGrade!] -= q.need;
            else inv.materials[q.materialId!] -= q.need;
            set({ inventory: inv });
          } else if (q.progress < q.need) return;

          play("coin");
          set({
            player: { ...player, gold: player.gold + q.rewardGold },
            quests: quests.map((x) => (x.id === id ? genQuest(get().player.level) : x)),
          });
          gainXp(q.rewardXp, get().combat);
          get().showToast(`Контракт сдан: +${q.rewardGold} зол, +${q.rewardXp} опыта`, "good");
        },

        rerollMercs: (auto = false) => {
          const { player, mercsLastManual } = get();
          const now = Date.now();
          if (!auto) {
            if (now - mercsLastManual < MERCS_MANUAL_MS) {
              const left = Math.ceil((MERCS_MANUAL_MS - (now - mercsLastManual)) / 1000);
              get().showToast(
                `Свободных клинков больше нет — новые придут через ${Math.floor(left / 60)}:${String(
                  left % 60
                ).padStart(2, "0")}`,
                "bad"
              );
              return;
            }
            play("click");
          }
          set({
            mercCandidates: [
              genMercCandidate(player.level),
              genMercCandidate(player.level),
              genMercCandidate(player.level),
            ],
            mercsLastChange: now,
            mercsLastManual: auto ? mercsLastManual : now,
          });
          if (auto) get().showToast("В гильдию пришли новые наёмники", "info");
        },

        mercsTick: () => {
          const { mercsLastChange, started } = get();
          if (!started) return;
          if (Date.now() - mercsLastChange >= MERCS_AUTO_MS) get().rerollMercs(true);
        },

        hireMerc: (candidateId, locationId) => {
          const { mercCandidates, mercs, player } = get();
          const cand = mercCandidates.find((c) => c.id === candidateId);
          const loc = LOCATIONS.find((l) => l.id === locationId);
          if (!cand || !loc) return;
          if (mercs.length >= 3) {
            get().showToast("Больше трёх наёмников гильдия не отпустит", "bad");
            return;
          }
          if (cand.level < loc.minLvl) {
            get().showToast(`${cand.name} слишком слаб для локации «${loc.name}»`, "bad");
            return;
          }
          const cost = mercCostFor(cand, loc.tier);
          if (player.gold < cost) {
            get().showToast("Недостаточно золота", "bad");
            return;
          }
          const duration = mercDurationMs(loc.tier);
          const merc: Merc = {
            id: uid(),
            name: cand.name,
            level: cand.level,
            grade: cand.grade,
            reliability: cand.reliability,
            cost,
            locationId,
            sentAt: Date.now(),
            returnAt: Date.now() + duration,
            loot: simulateMercRun(cand.level, cand.grade, locationId),
          };
          play("buy");
          set({
            mercs: [...mercs, merc],
            player: { ...player, gold: player.gold - cost },
            mercCandidates: mercCandidates.map((c) =>
              c.id === candidateId ? genMercCandidate(player.level) : c
            ),
          });
          get().showToast(
            `${cand.name} отправлен в «${loc.name}» на ${Math.round(duration / 60000)} мин`,
            "good"
          );
        },

        claimMerc: (id) => {
          const { mercs, inventory } = get();
          const merc = mercs.find((m) => m.id === id);
          if (!merc || Date.now() < merc.returnAt) return;
          const lossChance = 100 - merc.reliability;
          const failed = Math.random() * 100 < lossChance;
          set({ mercs: mercs.filter((m) => m.id !== id) });
          if (failed) {
            play("death");
            get().showToast(
              `${merc.name} вернулся с пустыми руками — «всё отобрали в чаще» (надёжность ${merc.reliability}%)`,
              "bad"
            );
            return;
          }
          play("coin");
          const stones = Object.values(merc.loot.stones).reduce((a, b) => a + (b ?? 0), 0);
          const mats = Object.values(merc.loot.materials).reduce((a, b) => a + b, 0);
          set({ inventory: mergeLoot(inventory, merc.loot) });
          get().showToast(`${merc.name} принёс ${stones} камней и ${mats} материалов`, "good");
        },

        // ---------------- expedition ----------------
        startExpedition: (locationId) => {
          const player = get().player;
          const st = playerStats(player);
          const manaMax = maxMana(st);
          const startHp = clamp(Math.round(player.hp), 1, st.hp);
          if (startHp <= st.hp * 0.15) {
            get().showToast("Слишком мало здоровья — отдохните или зайдите в церковь", "bad");
            return;
          }
          play("click");
          const combat: CombatState = {
            locationId,
            phase: "search",
            monster: null,
            playerHp: startHp,
            playerMana: clamp(Math.round(player.mana), 0, manaMax),
            turn: Math.random() < 0.5 ? "player" : "monster",
            log: [{ id: get().logSeq + 1, kind: "info", text: "Вы входите в лес. Поиск монстра..." }],
            session: { xp: 0, gold: 0, stones: {}, materials: {}, items: [] },
            kills: 0,
            nextActionAt: Date.now() + 1400,
            floater: null,
            buff: null,
            result: null,
          };
          set({ combat, view: "combat", logSeq: get().logSeq + 1 });
        },

        fleeExpedition: () => {
          const c = get().combat;
          if (!c || c.phase === "result") return;
          play("click");
          const s = c.session;
          const inv0 = get().inventory;
          const inv: Inventory = {
            ...inv0,
            items: [...inv0.items, ...s.items],
            stones: { ...inv0.stones },
            materials: { ...inv0.materials },
          };
          (Object.entries(s.stones) as [StoneGrade, number][]).forEach(([g, n]) => {
            inv.stones[g] = (inv.stones[g] ?? 0) + (n ?? 0);
          });
          Object.entries(s.materials).forEach(([k, n]) => {
            inv.materials[k] = (inv.materials[k] ?? 0) + n;
          });
          // здоровье и мана, с которыми герой вышел из леса, сохраняются
          set({
            inventory: inv,
            player: {
              ...get().player,
              gold: get().player.gold + s.gold,
              hp: c.playerHp,
              mana: c.playerMana,
            },
            regenAt: Date.now(),
          });
          set({
            combat: {
              ...c,
              phase: "result",
              buff: null,
              result: {
                type: "fled",
                lostGold: 0,
                lostXp: 0,
                keptGold: s.gold,
                keptStones: Object.values(s.stones).reduce((a, b) => a + (b ?? 0), 0),
              },
            },
          });
        },

        closeResult: () => {
          play("click");
          set({ combat: null, view: "city", regenAt: Date.now() });
        },

        tick: () => {
          const c0 = get().combat;
          if (!c0 || c0.phase === "result") return;
          const now = Date.now();
          if (now < c0.nextActionAt) return;
          const p = get().player;
          const st = playerStats(p);
          const extras = playerExtras(p);
          const manaMax = maxMana(st);

          if (c0.phase === "search") {
            const m = genMonster(c0.locationId);
            let c: CombatState = {
              ...c0,
              monster: m,
              phase: "fight",
              turn: Math.random() < 0.5 ? "player" : "monster",
              nextActionAt: now + 900,
            };
            c = pushLog(
              c,
              m.elite ? "elite" : "info",
              m.elite
                ? `Из чащи выходит ОСОБЫЙ монстр — ${m.name} (ур. ${m.level})! Берегитесь!`
                : `Встречен ${m.name} (ур. ${m.level}). Бой!`
            );
            if (m.elite) play("elite");
            set({ combat: c });
            return;
          }

          const m = c0.monster!;
          let c = c0;

          if (c.turn === "player") {
            const buffMult = c.buff ? c.buff.mult : 1;
            const atk = { ...st, dmgMin: st.dmgMin * buffMult, dmgMax: st.dmgMax * buffMult };
            const res = rollStrike(atk, m.agi, m.def);
            const newHp = clamp(m.hp - res.final, 0, m.maxHp);
            c = { ...c, monster: { ...m, hp: newHp } };
            if (res.dodged) {
              play("dodge");
              c = pushLog(c, "dodge", `${m.name} уворачивается от вашего удара!`);
              c = setFloater(c, { side: "monster", text: "уворот", kind: "dodge" });
            } else {
              play(res.crit ? "crit" : "hit");
              c = pushLog(
                c,
                res.crit ? "crit" : "player",
                res.crit
                  ? `КРИТ! Вы наносите ${res.final} урона (${m.name}: ${newHp}/${m.maxHp}).`
                  : `Вы бьёте на ${res.final} урона (${m.name}: ${newHp}/${m.maxHp}).`
              );
              c = setFloater(c, { side: "monster", text: `-${res.final}`, kind: res.crit ? "crit" : "hit" });
              if (extras.lifesteal > 0) {
                const heal = Math.min(st.hp - c.playerHp, Math.round((res.final * extras.lifesteal) / 100));
                if (heal > 0) {
                  c = { ...c, playerHp: c.playerHp + heal };
                  c = pushLog(c, "spell", `Вампиризм восстанавливает ${heal} HP.`);
                }
              }
            }
            c = { ...c, playerMana: Math.min(manaMax, c.playerMana + Math.ceil(manaMax * 0.012)) };
            if (c.buff) {
              const turns = c.buff.turns - 1;
              c = turns <= 0
                ? pushLog({ ...c, buff: null }, "info", `Действие «${c.buff.name}» закончилось.`)
                : { ...c, buff: { ...c.buff, turns } };
            }
            if (c.monster!.hp <= 0) {
              set({ combat: resolveKill(c, c.monster!) });
              return;
            }
            set({ combat: { ...c, turn: "monster", nextActionAt: now + 880 } });
          } else {
            const mBlock = {
              dmgMin: m.dmgMin,
              dmgMax: m.dmgMax,
              hp: m.hp,
              def: m.def,
              agi: m.agi,
              crit: m.crit,
              critMult: m.critMult,
              wis: 0,
            };
            const res = rollStrike(mBlock, st.agi, st.def);
            const newHp = clamp(c.playerHp - res.final, 0, st.hp);
            c = { ...c, playerHp: newHp };
            if (res.dodged) {
              play("dodge");
              c = pushLog(c, "dodge", "Вы уворачиваетесь от атаки монстра!");
              c = setFloater(c, { side: "player", text: "уворот", kind: "dodge" });
            } else {
              play(res.crit ? "crit" : "hit");
              c = pushLog(
                c,
                "monster",
                res.crit
                  ? `${m.name} наносит КРИТ ${res.final} урона! (Вы: ${newHp}/${st.hp})`
                  : `${m.name} бьёт на ${res.final} урона (Вы: ${newHp}/${st.hp}).`
              );
              c = setFloater(c, { side: "player", text: `-${res.final}`, kind: res.crit ? "crit" : "hit" });
            }

            if (c.playerHp <= 0) {
              set({ combat: resolveDeath(c) });
              return;
            }
            if (p.autoPotion && c.playerHp <= st.hp * 0.05) {
              const inv = get().inventory;
              const pickP = (["hp_s", "hp_m", "hp_l"] as PotionId[]).find((x) => inv.potions[x] > 0);
              if (pickP) {
                const healed = Math.min(st.hp - c.playerHp, POTIONS[pickP].power);
                play("potion");
                set({ inventory: { ...inv, potions: { ...inv.potions, [pickP]: inv.potions[pickP] - 1 } } });
                c = { ...c, playerHp: c.playerHp + healed };
                c = pushLog(c, "potion", `Авто-зелье: ${POTIONS[pickP].name} восстанавливает ${healed} HP.`);
                c = setFloater(c, { side: "player", text: `+${healed}`, kind: "potion" });
              } else {
                c = pushLog(c, "info", "Здоровье критически низко, а зелий жизни не осталось!");
              }
            }
            set({ combat: { ...c, turn: "player", nextActionAt: now + 880 } });
          }
        },

        usePotion: (id) => {
          const c0 = get().combat;
          const { inventory, player } = get();
          if (inventory.potions[id] <= 0) return;
          const st = playerStats(player);
          const def = POTIONS[id];

          // вне боя — пьём в городе, ускоряя отдых
          if (!c0 || c0.phase === "result") {
            const manaMax = maxMana(st);
            if (def.kind === "hp") {
              const healed = Math.min(st.hp - player.hp, def.power);
              if (healed < 1) {
                get().showToast("Здоровье уже полное", "info");
                return;
              }
              play("potion");
              set({
                player: { ...player, hp: player.hp + healed },
                inventory: { ...inventory, potions: { ...inventory.potions, [id]: inventory.potions[id] - 1 } },
              });
              get().showToast(`${def.name}: +${Math.round(healed)} HP`, "good");
            } else {
              const gained = Math.min(manaMax - player.mana, def.power);
              if (gained < 1) {
                get().showToast("Мана уже полная", "info");
                return;
              }
              play("potion");
              set({
                player: { ...player, mana: player.mana + gained },
                inventory: { ...inventory, potions: { ...inventory.potions, [id]: inventory.potions[id] - 1 } },
              });
              get().showToast(`${def.name}: +${Math.round(gained)} маны`, "good");
            }
            return;
          }

          let c = c0;
          if (def.kind === "hp") {
            const healed = Math.min(st.hp - c.playerHp, def.power);
            if (healed <= 0) return;
            c = { ...c, playerHp: c.playerHp + healed };
            c = pushLog(c, "potion", `Вы выпиваете ${def.name}: +${healed} HP.`);
            c = setFloater(c, { side: "player", text: `+${healed}`, kind: "potion" });
          } else {
            const manaMax = maxMana(st);
            const gained = Math.min(manaMax - c.playerMana, def.power);
            if (gained <= 0) return;
            c = { ...c, playerMana: c.playerMana + gained };
            c = pushLog(c, "potion", `Вы выпиваете ${def.name}: +${gained} маны.`);
          }
          play("potion");
          set({
            inventory: { ...inventory, potions: { ...inventory.potions, [id]: inventory.potions[id] - 1 } },
            combat: c,
          });
        },

        castSpell: (id) => {
          const c0 = get().combat;
          if (!c0 || c0.phase !== "fight") return;
          const sp = classSpell(id);
          if (!sp) return;
          const p = get().player;
          if (p.level < sp.minLevel || c0.playerMana < sp.mana) return;
          const st = playerStats(p);
          const extras = playerExtras(p);
          const power = 1 + extras.spellPower / 100;
          let c: CombatState = { ...c0, playerMana: c0.playerMana - sp.mana };

          if (sp.type === "heal") {
            const healed = Math.min(
              st.hp - c.playerHp,
              Math.round((st.hp * (sp.healPct ?? 20)) / 100 + st.wis * (sp.healWis ?? 1) * power)
            );
            if (healed <= 0) return;
            play("heal");
            c = { ...c, playerHp: c.playerHp + healed };
            c = pushLog(c, "spell", `${sp.name}: +${healed} HP.`);
            c = setFloater(c, { side: "player", text: `+${healed}`, kind: "heal" });
            set({ combat: c });
            return;
          }

          if (sp.type === "buff") {
            play("spell");
            c = { ...c, buff: { mult: sp.buffMult ?? 1.5, turns: sp.buffTurns ?? 3, name: sp.name } };
            c = pushLog(
              c,
              "spell",
              `${sp.name}! Урон увеличен на ${Math.round(((sp.buffMult ?? 1.5) - 1) * 100)}% на ${sp.buffTurns} хода.`
            );
            c = setFloater(c, { side: "player", text: sp.name, kind: "spell" });
            set({ combat: c });
            return;
          }

          const m = c.monster;
          if (!m) return;
          const avgWeapon = (st.dmgMin + st.dmgMax) / 2;
          const raw =
            ((sp.wisScale ?? 0) * st.wis + (sp.weaponScale ?? 0) * avgWeapon + (sp.lvlScale ?? 0) * p.level) *
            power *
            (c.buff ? c.buff.mult : 1);
          const crit = Math.random() * 100 < st.crit + (sp.critBonus ?? 0);
          const effDef = m.def * (1 - (sp.defIgnore ?? 0));
          const dmg = Math.max(1, Math.round((raw * (crit ? st.critMult : 1) * (100 - effDef)) / 100));
          const hp = clamp(m.hp - dmg, 0, m.maxHp);
          play("spell");
          c = { ...c, monster: { ...m, hp } };
          c = pushLog(c, crit ? "crit" : "spell", `${sp.name}${crit ? " КРИТУЕТ" : ""} на ${dmg} урона.`);
          c = setFloater(c, { side: "monster", text: `-${dmg}`, kind: crit ? "crit" : "spell" });
          if (extras.lifesteal > 0) {
            const heal = Math.min(st.hp - c.playerHp, Math.round((dmg * extras.lifesteal) / 100));
            if (heal > 0) c = { ...c, playerHp: c.playerHp + heal };
          }
          if (hp <= 0) {
            set({ combat: resolveKill(c, c.monster!) });
            return;
          }
          set({ combat: c });
        },

        toggleAutoPotion: () => {
          play("click");
          set({ player: { ...get().player, autoPotion: !get().player.autoPotion } });
        },

        // ---------------- save / load / cheats ----------------
        exportSave: () => {
          const s = get();
          return JSON.stringify(
            {
              magic: "equilibria-save",
              version: 2,
              savedAt: new Date().toISOString(),
              state: {
                started: s.started,
                player: s.player,
                inventory: s.inventory,
                quests: s.quests,
                mercs: s.mercs,
                mercCandidates: s.mercCandidates,
                boardLastChange: s.boardLastChange,
                boardLastManual: s.boardLastManual,
                shopStock: s.shopStock,
              },
            },
            null,
            2
          );
        },

        importSave: (json) => {
          try {
            const parsed = JSON.parse(json);
            const st = parsed?.state ?? parsed;
            if (!st?.player || typeof st.player.level !== "number") throw new Error("bad save");
            const loaded: Player = { ...newPlayer("Странник"), ...st.player };
            const loadedStats = playerStats(loaded);
            loaded.hp = clamp(
              Number.isFinite(loaded.hp) ? loaded.hp : loadedStats.hp,
              1,
              loadedStats.hp
            );
            loaded.mana = clamp(
              Number.isFinite(loaded.mana) ? loaded.mana : maxMana(loadedStats),
              0,
              maxMana(loadedStats)
            );
            set({
              started: true,
              view: "city",
              combat: null,
              player: loaded,
              inventory: { ...emptyInventory(), ...st.inventory },
              quests: st.quests ?? [],
              mercs: st.mercs ?? [],
              mercCandidates: st.mercCandidates ?? [],
              boardLastChange: st.boardLastChange ?? Date.now(),
              boardLastManual: st.boardLastManual ?? 0,
              shopLastChange: st.shopLastChange ?? Date.now(),
              shopLastManual: st.shopLastManual ?? 0,
              mercsLastChange: st.mercsLastChange ?? Date.now(),
              mercsLastManual: st.mercsLastManual ?? 0,
              regenAt: Date.now(),
            shopStock: st.shopStock ?? [],
            });
            play("level");
            get().showToast("Сохранение загружено", "good");
            return true;
          } catch {
            get().showToast("Файл сохранения повреждён", "bad");
            return false;
          }
        },

        cheat: (action, payload) => {
          const { player, inventory } = get();
          play("buy");
          switch (action) {
            case "gold":
              set({ player: { ...player, gold: player.gold + (payload ?? 1000) } });
              get().showToast(`+${payload ?? 1000} золота`, "good");
              break;
            case "level": {
              const p = { ...player };
              const n = payload ?? 1;
              for (let i = 0; i < n; i++) {
                p.level += 1;
                p.skillPoints += 1;
              }
              p.xp = 0;
              set({ player: p });
              get().showToast(`Уровень: ${p.level}`, "good");
              break;
            }
            case "skillpoints":
              set({ player: { ...player, skillPoints: player.skillPoints + (payload ?? 5) } });
              get().showToast(`+${payload ?? 5} очков навыков`, "good");
              break;
            case "potions": {
              const potions = { ...inventory.potions };
              (Object.keys(potions) as PotionId[]).forEach((k) => (potions[k] += payload ?? 10));
              set({ inventory: { ...inventory, potions } });
              get().showToast("Сумка полна зелий", "good");
              break;
            }
            case "stones": {
              const stones = { ...inventory.stones };
              STONE_GRADES.forEach((g) => (stones[g] += payload ?? 5));
              set({ inventory: { ...inventory, stones } });
              get().showToast("Камни чудовищ добавлены", "good");
              break;
            }
            case "gear": {
              const grade: Grade = payload?.grade ?? "S";
              const items = (["weapon", "armor", "charm"] as Slot[]).map((slot) =>
                genItem(slot, grade, player.level, true)
              );
              set({ inventory: { ...inventory, items: [...inventory.items, ...items] } });
              get().showToast(`Выдан комплект класса ${grade}`, "good");
              break;
            }
            case "heal": {
              const c = get().combat;
              const st = playerStats(player);
              set({ player: { ...player, hp: st.hp, mana: maxMana(st) }, regenAt: Date.now() });
              if (c) set({ combat: { ...c, playerHp: st.hp, playerMana: maxMana(st) } });
              get().showToast("Полное восстановление", "good");
              break;
            }
            case "mercs": {
              set({ mercs: get().mercs.map((m) => ({ ...m, returnAt: Date.now() - 1, reliability: 100 })) });
              get().showToast("Наёмники вернулись с гарантией", "good");
              break;
            }
            case "board":
              get().refreshBoard(true);
              set({ boardLastManual: 0 });
              break;
            case "shop":
              get().refreshStock(true);
              set({ shopLastManual: 0 });
              break;
            case "timers":
              set({ boardLastManual: 0, shopLastManual: 0, mercsLastManual: 0 });
              get().showToast("Все ограничения обновления сброшены", "good");
              break;
            case "class": {
              set({ player: { ...player, classId: payload as ClassId } });
              get().showToast(`Класс изменён: ${getClass(payload as ClassId).name}`, "good");
              break;
            }
            case "gender":
              set({ player: { ...player, gender: payload as Gender } });
              break;
          }
        },
      };
    },
    {
      name: "equilibria-save-v2",
      version: 3,
      /** Старые сохранения не знают о здоровье вне боя и новых таймерах */
      migrate: (persisted: any) => {
        if (!persisted?.player) return persisted;
        const p = persisted.player;
        const st = baseStats(p.level ?? 1, p.classId ?? "warrior");
        if (typeof p.hp !== "number" || !isFinite(p.hp)) p.hp = st.hp;
        if (typeof p.mana !== "number" || !isFinite(p.mana)) p.mana = maxMana(st);
        const now = Date.now();
        persisted.shopLastChange ??= now;
        persisted.shopLastManual ??= 0;
        persisted.mercsLastChange ??= now;
        persisted.mercsLastManual ??= 0;
        persisted.regenAt = now;
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const st = playerStats(state.player);
        const manaMax = maxMana(st);
        // страховка от рассинхрона после смены класса/снаряжения
        state.player.hp = clamp(
          Number.isFinite(state.player.hp) ? state.player.hp : st.hp,
          0,
          st.hp
        );
        state.player.mana = clamp(
          Number.isFinite(state.player.mana) ? state.player.mana : manaMax,
          0,
          manaMax
        );
        state.regenAt = Date.now();
      },
      partialize: (s) => ({
        started: s.started,
        view: s.view === "combat" ? "city" : s.view,
        player: s.player,
        inventory: s.inventory,
        quests: s.quests,
        mercs: s.mercs,
        mercCandidates: s.mercCandidates,
        boardLastChange: s.boardLastChange,
        boardLastManual: s.boardLastManual,
        shopLastChange: s.shopLastChange,
        shopLastManual: s.shopLastManual,
        mercsLastChange: s.mercsLastChange,
        mercsLastManual: s.mercsLastManual,
        regenAt: s.regenAt,
        shopStock: s.shopStock,
      }),
    }
  )
);

// ---------- helpers ----------

/**
 * Цена мгновенного исцеления в церкви.
 * Зависит от максимального здоровья героя: чем он могущественнее, тем дороже чудо.
 */
export function churchPrice(player: Player, maxHp: number, manaMax: number): number {
  const missingHp = Math.max(0, maxHp - player.hp);
  const missingMana = Math.max(0, manaMax - player.mana);
  if (missingHp < 1 && missingMana < 1) return 0;
  const holiness = 1 + (maxHp / 100) * CHURCH_MAXHP_FACTOR;
  const hpFee = missingHp * CHURCH_PER_HP * holiness;
  const manaFee = missingMana * 0.6 * holiness;
  return Math.max(1, Math.round(CHURCH_BASE_FEE * holiness + hpFee + manaFee));
}

function locationTierOf(materialId: string): number {
  for (const loc of LOCATIONS) {
    if (loc.monsters.some((m) => m.materialId === materialId)) return loc.tier;
  }
  return 0;
}

export function materialValue(materialId: string): number {
  return 5 + 4 * locationTierOf(materialId);
}

export function materialName(materialId: string): string {
  for (const loc of LOCATIONS) {
    const m = loc.monsters.find((x) => x.materialId === materialId);
    if (m) return m.materialName;
  }
  return materialId;
}

useGame.subscribe((s) => setMuted(!s.player.sound));

export function useStats() {
  return playerStats(useGame((s) => s.player));
}

export function useExtras() {
  return playerExtras(useGame((s) => s.player));
}

export { itemValue, locationForLevel, CLASSES, getClass };
