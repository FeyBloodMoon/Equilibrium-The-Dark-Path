import { Backpack, CircleDollarSign, FlaskConical, Gem, Package, Sparkles, Sword } from "lucide-react";
import { useState } from "react";
import { POTIONS, POTION_ORDER, STONE_GRADES, STONE_VALUE } from "../game/data";
import { itemName, sellableItems } from "../game/engine";
import { materialName, materialValue, useGame } from "../game/store";
import { cn } from "../utils/cn";
import { GradeBadge, Gold } from "./ui";

type TabId = "gear" | "potions" | "loot";

export function InventoryPanel() {
  const [tab, setTab] = useState<TabId>("gear");
  const view = useGame((s) => s.view);
  const inShop = view === "shop";

  return (
    <div className="panel flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b border-white/[0.06] p-2">
        <TabBtn id="gear" tab={tab} setTab={setTab} icon={Backpack} label="Вещи" />
        <TabBtn id="potions" tab={tab} setTab={setTab} icon={FlaskConical} label="Зелья" />
        <TabBtn id="loot" tab={tab} setTab={setTab} icon={Gem} label="Лут" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {tab === "gear" && <GearTab inShop={inShop} />}
        {tab === "potions" && <PotionsTab />}
        {tab === "loot" && <LootTab inShop={inShop} />}
      </div>
    </div>
  );
}

function TabBtn({
  id,
  tab,
  setTab,
  icon: Icon,
  label,
}: {
  id: TabId;
  tab: TabId;
  setTab: (t: TabId) => void;
  icon: typeof Backpack;
  label: string;
}) {
  return (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "btn flex-1 rounded-lg px-2 py-1.5 text-[11px]",
        tab === id
          ? "border border-gold-500/40 bg-gold-500/12 text-gold-300"
          : "border border-transparent text-white/45 hover:text-white/80"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function GearTab({ inShop }: { inShop: boolean }) {
  const items = useGame((s) => s.inventory.items);
  const equip = useGame((s) => s.equip);
  const sellItem = useGame((s) => s.sellItem);

  if (items.length === 0)
    return <Empty icon={Package} text="Рюкзак пуст. Загляните в магазин или сразите особого монстра." />;

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.id} className="anim-fade-up rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Sword className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="truncate text-xs font-semibold text-white/90">{itemName(item)}</span>
            </div>
            <GradeBadge grade={item.grade} size="sm" />
          </div>
          <div className="mt-1 text-[10.5px] leading-relaxed text-white/50">
            ур.{item.level} · {sellableItems(item.stats).join(" · ")}
            {item.modDesc && <span className="text-gold-300/80"> · {item.modDesc}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <button onClick={() => equip(item.id)} className="btn btn-gold h-6.5 flex-1 rounded-md px-2 py-1 text-[10px]">
              Экипировать
            </button>
            {inShop && (
              <button
                onClick={() => sellItem(item.id)}
                className="btn btn-ghost rounded-md px-2 py-1 text-[10px]"
                title="Продать"
              >
                <CircleDollarSign className="h-3 w-3" />
                <Gold amount={Math.max(3, Math.round(item.value * 0.45))} className="text-[10px]" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PotionsTab() {
  const potions = useGame((s) => s.inventory.potions);
  const usePotion = useGame((s) => s.usePotion);
  const inCombat = useGame((s) => !!s.combat && s.combat.phase !== "result");

  const any = POTION_ORDER.some((id) => potions[id] > 0);
  if (!any) return <Empty icon={FlaskConical} text="Зелий нет. Алхимик в магазине всегда рад монетам." />;

  return (
    <div className="space-y-1.5">
      {POTION_ORDER.filter((id) => potions[id] > 0).map((id) => {
        const p = POTIONS[id];
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
            <div>
              <div className="text-xs font-semibold text-white/90">{p.name}</div>
              <div className="text-[10.5px] text-white/50">
                {p.kind === "hp" ? `+${p.power} HP` : `+${p.power} маны`} · в наличии{" "}
                <span className="font-mono2 text-gold-300">{potions[id]}</span>
              </div>
            </div>
            <button
              onClick={() => usePotion(id)}
              disabled={!inCombat}
              className="btn btn-ghost rounded-md px-2.5 py-1 text-[10px]"
              title={inCombat ? "Использовать" : "Можно пить только в бою"}
            >
              Выпить
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LootTab({ inShop }: { inShop: boolean }) {
  const stones = useGame((s) => s.inventory.stones);
  const materials = useGame((s) => s.inventory.materials);
  const sellStone = useGame((s) => s.sellStone);
  const sellMaterial = useGame((s) => s.sellMaterial);
  const sellAllStones = useGame((s) => s.sellAllStones);
  const sellAllMaterials = useGame((s) => s.sellAllMaterials);

  const stoneTotal = STONE_GRADES.reduce((a, g) => a + stones[g] * STONE_VALUE[g], 0);
  const matIds = Object.keys(materials).filter((k) => materials[k] > 0);
  const matTotal = matIds.reduce((a, id) => a + materials[id] * materialValue(id), 0);

  if (STONE_GRADES.every((g) => stones[g] === 0) && matIds.length === 0)
    return <Empty icon={Gem} text="Пока пусто. Монстры леса носят камни в нутре." />;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Камни чудовищ
          </span>
          {inShop && stoneTotal > 0 && (
            <button onClick={sellAllStones} className="btn btn-gold rounded-md px-2 py-0.5 text-[10px]">
              Продать все · {stoneTotal}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {STONE_GRADES.filter((g) => stones[g] > 0).map((g) => (
            <button
              key={g}
              disabled={!inShop}
              onClick={() => sellStone(g)}
              title={inShop ? `Продать за ${STONE_VALUE[g]}` : "Продажа доступна в магазине"}
              className={cn(
                "flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1.5 text-left",
                inShop && "hover:border-gold-500/40"
              )}
            >
              <span className="flex items-center gap-1.5">
                <GradeBadge grade={g} size="sm" />
                <span className="font-mono2 text-[11px] text-white/70">×{stones[g]}</span>
              </span>
              <span className="font-mono2 text-[10px] text-gold-300/80">{STONE_VALUE[g]}</span>
            </button>
          ))}
          {STONE_GRADES.every((g) => stones[g] === 0) && (
            <span className="col-span-2 text-[11px] italic text-white/30">камней нет</span>
          )}
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Материалы
          </span>
          {inShop && matTotal > 0 && (
            <button onClick={sellAllMaterials} className="btn btn-gold rounded-md px-2 py-0.5 text-[10px]">
              Продать все · {matTotal}
            </button>
          )}
        </div>
        <div className="space-y-1">
          {matIds.map((id) => (
            <button
              key={id}
              disabled={!inShop}
              onClick={() => sellMaterial(id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1.5 text-left",
                inShop && "hover:border-gold-500/40"
              )}
            >
              <span className="flex items-center gap-1.5 text-[11px] text-white/75">
                <Sparkles className="h-3 w-3 text-white/35" />
                {materialName(id)}
                <span className="font-mono2 text-white/45">×{materials[id]}</span>
              </span>
              <span className="font-mono2 text-[10px] text-gold-300/80">{materialValue(id)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, text }: { icon: typeof Gem; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Icon className="h-7 w-7 text-white/15" />
      <p className="text-[11.5px] leading-relaxed text-white/40">{text}</p>
    </div>
  );
}
