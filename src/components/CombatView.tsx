import {
  Crosshair,
  FlaskConical,
  Flag,
  Footprints,
  Gem as GemIcon,
  Package,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Star,
  Swords,
  WandSparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCATIONS, POTIONS } from "../game/data";
import { getClass } from "../game/classes";
import { maxMana } from "../game/engine";
import { useGame, useStats } from "../game/store";
import type { Floater, LogKind } from "../game/types";
import { cn } from "../utils/cn";
import { Bar, GradeBadge, IconByName, SPELL_ICONS } from "./ui";
import { ClassPortrait } from "./ClassPortrait";

const LOG_STYLE: Record<LogKind, string> = {
  info: "text-white/50",
  player: "text-emerald-300/90",
  monster: "text-blood-400/90",
  crit: "text-amber-300 font-semibold",
  dodge: "text-sky-300/85",
  loot: "text-gold-300",
  level: "text-gold-300 font-bold",
  potion: "text-pink-300/90",
  spell: "text-indigo-300",
  death: "text-blood-500 font-bold",
  elite: "text-blood-400 font-bold",
};

export function CombatView() {
  const tick = useGame((s) => s.tick);
  useEffect(() => {
    const t = setInterval(tick, 220);
    return () => clearInterval(t);
  }, [tick]);

  const combat = useGame((s) => s.combat);
  if (!combat) return null;
  const loc = LOCATIONS.find((l) => l.id === combat.locationId);

  return (
    <div className="vignette relative -m-4 min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl sm:-m-6">
      {loc && (
        <img src={loc.img} alt="" className="anim-fog absolute inset-0 h-full w-full scale-110 object-cover opacity-60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/75 via-ink-950/60 to-ink-950/95" />

      <div className="relative z-10 flex min-h-[calc(100vh-120px)] flex-col p-4 sm:p-6">
        <CombatHeader />
        {combat.phase === "result" ? (
          <ResultOverlay />
        ) : (
          <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              <Battlefield />
              <Controls />
            </div>
            <div className="flex min-h-0 flex-col gap-4">
              <SessionCard />
              <LogCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CombatHeader() {
  const combat = useGame((s) => s.combat)!;
  const flee = useGame((s) => s.fleeExpedition);
  const autoPotion = useGame((s) => s.player.autoPotion);
  const toggleAutoPotion = useGame((s) => s.toggleAutoPotion);
  const [confirm, setConfirm] = useState(false);
  const loc = LOCATIONS.find((l) => l.id === combat.locationId);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="rounded-lg border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
          {loc?.name}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white/60 backdrop-blur">
          <Crosshair className="h-3.5 w-3.5 text-gold-400" />
          убито: {combat.kills}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAutoPotion}
          className={cn(
            "btn rounded-lg border px-3 py-1.5 text-[11px] backdrop-blur",
            autoPotion
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-black/45 text-white/45"
          )}
          title="Автоматически пить зелье жизни при HP < 5%"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Авто-зелье {autoPotion ? "вкл" : "выкл"}
        </button>
        <button
          onClick={() => setConfirm(true)}
          className="btn btn-danger rounded-lg px-3.5 py-1.5 text-[11px] uppercase tracking-wider"
        >
          <Flag className="h-3.5 w-3.5" />
          Завершить поход
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel anim-pop max-w-sm p-6 text-center">
            <h3 className="font-display text-lg font-bold text-gold-300">Прервать охоту?</h3>
            <p className="mt-2 text-sm text-white/55">
              Вы вернётесь в город и сохраните всю добычу текущего похода.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => setConfirm(false)}>
                Остаться
              </button>
              <button
                className="btn btn-gold px-4 py-2 text-sm"
                onClick={() => {
                  flee();
                  setConfirm(false);
                }}
              >
                Вернуться в город
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Battlefield() {
  const combat = useGame((s) => s.combat)!;
  const m = combat.monster;

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
      <PlayerCard floater={combat.floater?.side === "player" ? combat.floater : null} />
      <div className="flex items-center justify-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border font-display text-xs font-bold transition",
            combat.phase === "fight"
              ? combat.turn === "player"
                ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                : "border-blood-500/50 bg-blood-500/10 text-blood-400"
              : "border-white/15 bg-black/40 text-white/40"
          )}
        >
          <Swords className="h-5 w-5" />
        </div>
      </div>
      {combat.phase === "search" || !m ? (
        <div className="panel relative flex min-h-56 flex-col items-center justify-center overflow-hidden p-5 text-center">
          <Footprints className="h-10 w-10 text-gold-500/60" style={{ animation: "searchSpin 1.6s ease-in-out infinite" }} />
          <div className="mt-3 font-display text-sm font-bold tracking-widest text-white/70">
            ПОИСК МОНСТРА
          </div>
          <div className="mt-1 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <MonsterCard key={`${m.name}-${m.level}-${m.maxHp}-${m.elite}`} floater={combat.floater?.side === "monster" ? combat.floater : null} />
      )}
    </div>
  );
}

function PlayerCard({ floater }: { floater: Floater | null }) {
  const combat = useGame((s) => s.combat)!;
  const stats = useStats();
  const name = useGame((s) => s.player.name);
  const level = useGame((s) => s.player.level);
  const classId = useGame((s) => s.player.classId);
  const gender = useGame((s) => s.player.gender);
  const manaMax = maxMana(stats);
  const hit = floater && (floater.kind === "hit" || floater.kind === "crit");

  return (
    <div
      className={cn(
        "panel relative min-h-56 overflow-hidden p-4",
        combat.turn === "player" && combat.phase === "fight" && "ring-1 ring-emerald-400/50"
      )}
    >
      {hit && <div key={floater!.id} className="anim-flash-red pointer-events-none absolute inset-0 z-20" />}
      {floater && <FloaterText floater={floater} />}
      <div key={hit ? floater!.id : "idle"} className={cn(hit && "anim-shake")}>
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gold-500/30">
            <ClassPortrait classId={classId} gender={gender} glow={false} />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white">{name}</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold-300/80">
              {getClass(classId).name} · ур. {level}
            </div>
            <div className="mt-1 flex gap-2 text-[10px] text-white/45">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-sky-300" />
                {stats.def.toFixed(1)}%
              </span>
              <span>уклон {stats.agi.toFixed(1)}%</span>
              <span>крит {stats.crit.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Bar value={combat.playerHp} max={stats.hp} from="#b91c1c" to="#ef4444" label="Здоровье" height="h-4" />
        <Bar value={combat.playerMana} max={manaMax} from="#3730a3" to="#818cf8" label="Мана" height="h-3.5" />
      </div>
      {combat.playerHp > 0 && combat.playerHp <= stats.hp * 0.05 && (
        <div className="mt-2 animate-pulse text-[10px] font-bold uppercase tracking-widest text-blood-400">
          критическое здоровье
        </div>
      )}
    </div>
  );
}

function MonsterCard({ floater }: { floater: Floater | null }) {
  const combat = useGame((s) => s.combat)!;
  const m = combat.monster!;
  const hit = floater && (floater.kind === "hit" || floater.kind === "crit" || floater.kind === "spell");

  return (
    <div
      className={cn(
        "panel anim-pop relative min-h-56 overflow-hidden p-4",
        m.elite && "border-blood-500/40",
        combat.turn === "monster" && combat.phase === "fight" && "ring-1 ring-blood-500/50"
      )}
    >
      {m.elite && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blood-500/[0.09] via-transparent to-transparent" />
      )}
      {hit && <div key={floater!.id} className="anim-flash-gold pointer-events-none absolute inset-0 z-20" />}
      {floater && <FloaterText floater={floater} />}
      <div key={hit ? floater!.id : "idle"} className={cn("relative", hit && "anim-shake")}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "anim-float flex h-16 w-16 items-center justify-center rounded-xl border",
              m.elite ? "border-blood-500/50 bg-blood-500/10" : "border-white/12 bg-white/[0.05]"
            )}
          >
            <IconByName
              name={m.base.icon}
              className={cn("h-8 w-8", m.elite ? "anim-elite text-blood-400" : "text-white/70")}
            />
          </div>
          <div>
            <div className={cn("font-display text-base font-bold", m.elite ? "anim-elite text-blood-300" : "text-white")}>
              {m.name}
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
              уровень {m.level}
              {m.elite && <span className="ml-1.5 text-blood-400">особый</span>}
            </div>
            <div className="mt-1 flex gap-2 text-[10px] text-white/45">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-sky-300" />
                {m.def}%
              </span>
              <span>уклон {m.agi}%</span>
              <span>урон {m.dmgMin}–{m.dmgMax}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Bar value={m.hp} max={m.maxHp} from="#7c2d12" to="#f97316" label="Здоровье монстра" height="h-4" />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] text-white/40">
        <span className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-black/30 px-1.5 py-0.5">
          <Star className="h-3 w-3 text-gold-400" />
          {m.xp} опыта
        </span>
        <span className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-black/30 px-1.5 py-0.5">
          <GemIcon className="h-3 w-3 text-indigo-300" />
          камень {m.stoneGrade}
        </span>
        <span className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-black/30 px-1.5 py-0.5">
          <Package className="h-3 w-3 text-white/50" />
          {m.base.materialName}
        </span>
      </div>
    </div>
  );
}

function FloaterText({ floater }: { floater: Floater }) {
  const color =
    floater.kind === "crit"
      ? "text-amber-300"
      : floater.kind === "dodge"
        ? "text-sky-300"
        : floater.kind === "heal" || floater.kind === "potion"
          ? "text-emerald-300"
          : floater.kind === "spell"
            ? "text-indigo-300"
            : "text-blood-400";
  return (
    <span
      key={floater.id}
      className={cn("dmg-float font-display text-3xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]", color)}
    >
      {floater.text}
    </span>
  );
}

function Controls() {
  const combat = useGame((s) => s.combat)!;
  const level = useGame((s) => s.player.level);
  const classId = useGame((s) => s.player.classId);
  const potions = useGame((s) => s.inventory.potions);
  const castSpell = useGame((s) => s.castSpell);
  const usePotion = useGame((s) => s.usePotion);
  const fight = combat.phase === "fight";
  const cls = getClass(classId);

  return (
    <div className="panel p-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            <span className="flex items-center gap-1.5">
              <WandSparkles className="h-3.5 w-3.5 text-indigo-300" />
              Умения · {cls.name}
            </span>
            {combat.buff && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] normal-case tracking-normal text-amber-300">
                {combat.buff.name} ×{combat.buff.mult.toFixed(1)} · {combat.buff.turns} х.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {cls.spells.map((sp) => {
              const Icon = SPELL_ICONS[sp.icon] ?? Sparkles;
              const lockedByLevel = level < sp.minLevel;
              const noMana = combat.playerMana < sp.mana;
              const needTarget = sp.type === "damage" && !combat.monster;
              const disabled = !fight || lockedByLevel || noMana || needTarget;
              return (
                <button
                  key={sp.id}
                  onClick={() => castSpell(sp.id)}
                  disabled={disabled}
                  title={lockedByLevel ? `Откроется на ${sp.minLevel} уровне` : sp.desc}
                  className={cn(
                    "btn justify-between rounded-lg border px-3 py-2 text-left text-[11px]",
                    lockedByLevel
                      ? "border-white/[0.06] bg-white/[0.02] text-white/30"
                      : "border-indigo-400/25 bg-indigo-400/[0.08] text-indigo-200 hover:bg-indigo-400/[0.16]"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{sp.name}</span>
                    {lockedByLevel && <span className="shrink-0 text-[9px]">· ур. {sp.minLevel}</span>}
                  </span>
                  <span className="font-mono2 shrink-0 text-[10px] opacity-70">{sp.mana} MP</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            <FlaskConical className="h-3.5 w-3.5 text-emerald-300" />
            Зелья
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["hp_s", "hp_m", "hp_l", "mp_s", "mp_m", "mp_l"] as const).map((id) => {
              const p = POTIONS[id];
              const count = potions[id];
              return (
                <button
                  key={id}
                  onClick={() => usePotion(id)}
                  disabled={!fight || count <= 0}
                  title={`${p.name}: ${p.kind === "hp" ? `+${p.power} HP` : `+${p.power} MP`}`}
                  className={cn(
                    "btn rounded-lg border px-2 py-2 text-[10px]",
                    p.kind === "hp"
                      ? "border-blood-500/25 bg-blood-500/[0.08] text-blood-300 hover:bg-blood-500/[0.18]"
                      : "border-indigo-400/25 bg-indigo-400/[0.08] text-indigo-200 hover:bg-indigo-400/[0.16]"
                  )}
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="font-semibold">{p.kind === "hp" ? "HP" : "MP"} {id.endsWith("_s") ? "S" : id.endsWith("_m") ? "M" : "L"}</span>
                    <span className={cn("font-mono2 text-[10px]", count > 0 ? "opacity-80" : "opacity-40")}>
                      ×{count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">
            Зелья и магия можно применять в любой момент боя, не теряя ход.
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionCard() {
  const combat = useGame((s) => s.combat)!;
  const s = combat.session;
  const stones = Object.entries(s.stones).filter(([, n]) => (n ?? 0) > 0);
  const mats = Object.entries(s.materials).filter(([, n]) => n > 0);

  return (
    <div className="panel p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
        <Package className="h-3.5 w-3.5 text-gold-400" />
        Добыча похода
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
          <span className="text-white/45">Золото</span>
          <div className="font-mono2 font-semibold text-gold-300">{s.gold}</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
          <span className="text-white/45">Опыт</span>
          <div className="font-mono2 font-semibold text-indigo-300">{s.xp}</div>
        </div>
      </div>
      {s.items.length > 0 && (
        <div className="mt-2 space-y-1">
          {s.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-2 py-1 text-[10.5px] text-amber-200/90">
              <span className="truncate">
                {it.modifier} {it.base} · ур.{it.level}
              </span>
              <GradeBadge grade={it.grade} size="sm" />
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {stones.map(([g, n]) => (
          <span key={g} className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/65">
            <GemIcon className="h-3 w-3 text-indigo-300" />
            {g}×{n}
          </span>
        ))}
        {mats.map(([id, n]) => (
          <span key={id} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/55">
            {matNameByIdShort(id)} ×{n}
          </span>
        ))}
        {stones.length === 0 && mats.length === 0 && (
          <span className="text-[10.5px] italic text-white/30">пока пусто — первые монстры впереди</span>
        )}
      </div>
      <p className="mt-2 rounded-lg border border-blood-500/20 bg-blood-500/[0.06] px-2 py-1.5 text-[10px] leading-relaxed text-white/45">
        <Skull className="mr-1 inline h-3 w-3 text-blood-400" />
        При смерти теряется 80% добычи похода. «Завершить поход» — сохраняет всё.
      </p>
    </div>
  );
}

function matNameByIdShort(id: string) {
  const names: Record<string, string> = {
    slime_goo: "Слизь",
    wolf_pelt: "Шкура",
    sprite_dust: "Пыльца",
    goblin_ear: "Ухо",
    viper_venom: "Яд",
    dense_silt: "Ил",
    orc_tusk: "Клык",
    harpy_feather: "Перо",
    stone_heart: "Сердце",
    spider_silk: "Шёлк",
    dark_rune: "Руна",
    ghoul_fang: "Клык",
    wyvern_scale: "Чешуя",
    drake_gland: "Жила",
    dragon_blood: "Кровь",
  };
  return names[id] ?? id;
}

function LogCard() {
  const combat = useGame((s) => s.combat)!;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [combat.log.length]);

  return (
    <div className="panel flex min-h-48 flex-1 flex-col overflow-hidden lg:max-h-[340px]">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
        <ScrollText className="h-3.5 w-3.5" />
        Журнал боя
      </div>
      <div ref={ref} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3.5 py-2.5">
        {combat.log.map((l) => (
          <div key={l.id} className={cn("log-line text-[11.5px] leading-snug", LOG_STYLE[l.kind])}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultOverlay() {
  const combat = useGame((s) => s.combat)!;
  const closeResult = useGame((s) => s.closeResult);
  const r = combat.result!;
  const s = combat.session;
  const dead = r.type === "dead";

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <div className={cn(
        "panel anim-pop w-full max-w-lg overflow-hidden p-0",
        dead ? "border-blood-500/40" : "border-gold-500/40"
      )}>
        <div className={cn("px-6 py-5 text-center", dead ? "bg-blood-500/10" : "bg-gold-500/10")}>
          {dead ? (
            <Skull className="anim-elite mx-auto h-12 w-12 text-blood-500" />
          ) : (
            <Flag className="mx-auto h-12 w-12 text-gold-400" />
          )}
          <h2 className={cn("font-display mt-3 text-2xl font-bold", dead ? "text-blood-400" : "gold-text")}>
            {dead ? "ВЫ ПАЛИ В БОЮ" : "ПОХОД ЗАВЕРШЁН"}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {dead
              ? "Лес забрал своё. В гильдии говорят: мёртвый герой — герой без сапог."
              : "Вы вернулись целым, а сумки потяжелели."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-5 text-center text-[11px]">
          <Cell label="Убито монстров" value={`${combat.kills}`} />
          <Cell label="Заработано опыта" value={`${dead ? Math.round(s.xp * 0.2) : s.xp}`} note={dead ? `потеряно ${r.lostXp}` : undefined} />
          <Cell label="Золото сохранено" value={`${dead ? r.keptGold : r.keptGold}`} note={dead ? `потеряно ${r.lostGold}` : undefined} />
          <Cell label="Камней сохранено" value={`${dead ? r.keptStones : Object.values(s.stones).reduce((a, b) => a + (b ?? 0), 0)}`} />
        </div>
        <div className="border-t border-white/[0.06] p-5">
          <button onClick={closeResult} className="btn btn-gold w-full px-6 py-3 text-sm uppercase tracking-[0.2em]">
            Вернуться в город
          </button>
          <p className="mt-2 text-center text-[10.5px] text-white/40">
            В городе здоровье и мана полностью восстановятся
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
      <div className="text-white/45">{label}</div>
      <div className="font-mono2 mt-0.5 text-base font-semibold text-white/90">{value}</div>
      {note && <div className="text-[10px] text-blood-400/80">{note}</div>}
    </div>
  );
}
