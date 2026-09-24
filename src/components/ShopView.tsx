import {
  Dices,
  FlaskConical,
  HeartPulse,
  Lock,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  POTIONS,
  POTION_ORDER,
  STOCK_AUTO_MS,
  STOCK_MANUAL_MS,
  STONE_GRADES,
  STONE_VALUE,
} from "../game/data";
import { itemName, sellableItems } from "../game/engine";
import { useGame } from "../game/store";
import { cn } from "../utils/cn";
import { GradeBadge, Gold, SectionTitle } from "./ui";
import { Empty } from "./InventoryPanel";

function fmtLeft(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ShopView() {
  const stock = useGame((s) => s.shopStock);
  const gold = useGame((s) => s.player.gold);
  const level = useGame((s) => s.player.level);
  const buyItem = useGame((s) => s.buyItem);
  const buyPotion = useGame((s) => s.buyPotion);
  const refreshStock = useGame((s) => s.refreshStock);
  const stockTick = useGame((s) => s.stockTick);
  const shopLastChange = useGame((s) => s.shopLastChange);
  const shopLastManual = useGame((s) => s.shopLastManual);
  const potions = useGame((s) => s.inventory.potions);
  const stones = useGame((s) => s.inventory.stones);
  const materials = useGame((s) => s.inventory.materials);
  const items = useGame((s) => s.inventory.items);
  const sellAllStones = useGame((s) => s.sellAllStones);
  const sellAllMaterials = useGame((s) => s.sellAllMaterials);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      stockTick();
    }, 1000);
    stockTick();
    return () => clearInterval(t);
  }, [stockTick]);

  const stoneTotal = STONE_GRADES.reduce((a, g) => a + stones[g] * STONE_VALUE[g], 0);
  const matTotal = Object.entries(materials).length;
  const manualLeft = STOCK_MANUAL_MS - (now - shopLastManual);
  const autoLeft = STOCK_AUTO_MS - (now - shopLastChange);

  return (
    <div className="vignette relative -m-4 min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl sm:-m-6">
      <img src="/img/shop.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/80 to-ink-950/95" />

      <div className="relative z-10 p-5 sm:p-8">
        <SectionTitle
          icon={Store}
          title="Лавка «Кривой клинок»"
          sub={`Торговец усмехается: «Качество — лотерея, уровень ${level} открывает товар получше»`}
          right={
            <span className="rounded-lg border border-gold-500/25 bg-ink-900/80 px-3 py-1.5">
              <Gold amount={gold} className="text-sm" />
            </span>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {/* potions */}
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                <FlaskConical className="h-4 w-4 text-emerald-400" />
                Алхимия
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {POTION_ORDER.map((id) => {
                  const p = POTIONS[id];
                  const afford = gold >= p.price;
                  const isHp = p.kind === "hp";
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex flex-col rounded-xl border p-3 transition",
                        isHp
                          ? "border-blood-500/20 bg-blood-500/[0.045] hover:border-blood-500/40"
                          : "border-indigo-400/20 bg-indigo-400/[0.045] hover:border-indigo-400/40"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                            isHp
                              ? "border-blood-500/30 bg-blood-500/10"
                              : "border-indigo-400/30 bg-indigo-400/10"
                          )}
                        >
                          {isHp ? (
                            <HeartPulse className="h-4.5 w-4.5 text-blood-400" />
                          ) : (
                            <WandSparkles className="h-4.5 w-4.5 text-indigo-300" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-white/90">{p.name}</div>
                          <div className={cn("text-[11px] font-medium", isHp ? "text-blood-300/80" : "text-indigo-300/80")}>
                            {isHp ? `+${p.power} здоровья` : `+${p.power} маны`}
                          </div>
                        </div>
                        <span className="font-mono2 shrink-0 rounded-md border border-white/[0.08] bg-black/30 px-1.5 py-0.5 text-[10px] text-white/55">
                          ×{potions[id]}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => buyPotion(id, 1)}
                          disabled={!afford}
                          className={cn("btn h-8 rounded-lg text-[11px]", afford ? "btn-gold" : "btn-ghost")}
                        >
                          1 шт · {p.price}
                        </button>
                        <button
                          onClick={() => buyPotion(id, 5)}
                          disabled={gold < p.price * 5}
                          className="btn btn-ghost h-8 rounded-lg text-[11px]"
                        >
                          5 шт · {p.price * 5}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* gear stock */}
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <ShoppingBag className="h-4 w-4 text-gold-400" />
                  Оружие и доспехи
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono2 text-[10px] text-white/35">
                    новый завоз: {fmtLeft(autoLeft)}
                  </span>
                  <button
                    onClick={() => refreshStock(false)}
                    disabled={manualLeft > 0}
                    title={
                      manualLeft > 0
                        ? `Торговец обновит товар через ${fmtLeft(manualLeft)}`
                        : "Обновить ассортимент"
                    }
                    className={cn(
                      "btn h-7 rounded-md px-2.5 text-[10px]",
                      manualLeft > 0 ? "btn-ghost" : "btn-gold"
                    )}
                  >
                    {manualLeft > 0 ? <Lock className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                    {manualLeft > 0 ? fmtLeft(manualLeft) : "Обновить"}
                  </button>
                </div>
              </div>
              {stock.length === 0 ? (
                <Empty icon={ShoppingBag} text="Полки пусты. Нажмите «Обновить ассортимент»." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {stock.map((item, i) => {
                    const afford = gold >= item.value;
                    return (
                      <div
                        key={item.id}
                        className="anim-fade-up rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition hover:border-gold-500/35"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-white/90">
                            {itemName(item)}
                            {item.modifier && <Sparkles className="ml-1 inline h-3 w-3 text-gold-300" />}
                          </span>
                          <GradeBadge grade={item.grade} />
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-white/50">
                          {item.slot === "weapon" ? "Оружие" : item.slot === "armor" ? "Доспех" : "Аксессуар"} · ур.{item.level}
                          {" · "}
                          {sellableItems(item.stats).join(" · ")}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <Gold amount={item.value} className="text-xs" />
                          <button
                            onClick={() => buyItem(item.id)}
                            disabled={!afford}
                            className={cn("btn rounded-md px-3 py-1.5 text-[11px]", afford ? "btn-gold" : "btn-ghost")}
                          >
                            Купить
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* buyer */}
          <div className="panel h-fit p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              <Dices className="h-4 w-4 text-gold-400" />
              Скупщик трофеев
            </div>
            <p className="text-xs leading-relaxed text-white/50">
              Продавайте камни чудовищ, материалы и вещи прямо из инвентаря справа — кнопки продажи
              активны, пока вы в лавке.
            </p>
            <div className="mt-3 space-y-1.5 text-[11.5px]">
              <Row label="Камней в сумке" value={`${STONE_GRADES.reduce((a, g) => a + stones[g], 0)} шт · ~${stoneTotal} зол`} />
              <Row label="Видов материалов" value={`${matTotal}`} />
              <Row label="Свободных вещей" value={`${items.length}`} />
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={sellAllStones} disabled={stoneTotal <= 0} className="btn btn-gold w-full px-3 py-2 text-xs">
                Продать все камни · {stoneTotal} зол
              </button>
              <button
                onClick={sellAllMaterials}
                disabled={matTotal === 0}
                className="btn btn-ghost w-full px-3 py-2 text-xs"
              >
                Продать все материалы
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/30 p-3">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Курс камней
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-white/55">
                {STONE_GRADES.map((g) => (
                  <div key={g} className="flex items-center justify-between">
                    <GradeBadge grade={g} size="sm" />
                    <span className="font-mono2 text-gold-300/80">{STONE_VALUE[g]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <span className="text-white/50">{label}</span>
      <span className="font-mono2 text-white/85">{value}</span>
    </div>
  );
}
