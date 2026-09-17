import { Brain, Clover, Droplet, GitBranch, HeartPulse, Shield, Sparkles, Sword, X, Zap } from "lucide-react";
import { useState } from "react";
import { getClass } from "../game/classes";
import { itemName, maxMana, sellableItems, xpForLevel } from "../game/engine";
import { useExtras, useGame, useStats } from "../game/store";
import type { Slot } from "../game/types";
import { cn } from "../utils/cn";
import { ClassPortrait } from "./ClassPortrait";
import { SkillTreeModal } from "./SkillTree";
import { Bar, GradeBadge } from "./ui";

const SLOT_LABEL: Record<Slot, string> = {
  weapon: "Оружие",
  armor: "Доспех",
  charm: "Амулет",
};

export function CharacterPanel() {
  const player = useGame((s) => s.player);
  const combat = useGame((s) => s.combat);
  const unequip = useGame((s) => s.unequip);
  const stats = useStats();
  const extras = useExtras();
  const [treeOpen, setTreeOpen] = useState(false);
  const cls = getClass(player.classId);
  const manaMax = maxMana(stats);
  const hpNow = combat ? combat.playerHp : stats.hp;
  const manaNow = combat ? combat.playerMana : manaMax;
  const xpNext = xpForLevel(player.level);

  return (
    <div className="panel overflow-hidden">
      <div className="relative h-32 overflow-hidden">
        <ClassPortrait classId={player.classId} gender={player.gender} glow={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/25 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display truncate text-base font-bold text-white drop-shadow">
              {player.name}
            </div>
            <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: cls.color }}>
              {cls.name} · ур. {player.level}
            </div>
          </div>
          {combat && (
            <span className="shrink-0 rounded-md border border-blood-500/40 bg-blood-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blood-400">
              в походе
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 p-3.5">
        <Bar value={hpNow} max={stats.hp} from="#b91c1c" to="#ef4444" label="Здоровье" />
        <Bar value={manaNow} max={manaMax} from="#3730a3" to="#818cf8" label="Мана" />
        <Bar value={player.xp} max={xpNext} from="#92600e" to="#e7bc5e" label="Опыт" height="h-2.5" />

        <button
          onClick={() => setTreeOpen(true)}
          className={cn(
            "btn w-full rounded-lg px-3 py-2 text-[11px]",
            player.skillPoints > 0 ? "btn-gold animate-pulse" : "btn-ghost"
          )}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Древо навыков
          {player.skillPoints > 0 && (
            <span className="rounded-full bg-black/25 px-1.5 py-0.5 font-mono2 text-[10px]">
              +{player.skillPoints}
            </span>
          )}
        </button>

        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <Stat icon={Sword} label="Урон" value={`${stats.dmgMin}–${stats.dmgMax}`} color="#f87171" />
          <Stat icon={Zap} label="Крит" value={`${stats.crit.toFixed(1)}% ×${stats.critMult.toFixed(2)}`} color="#fbbf24" />
          <Stat icon={Shield} label="Защита" value={`${stats.def.toFixed(1)}%`} color="#60a5fa" />
          <Stat icon={Clover} label="Ловкость" value={`${stats.agi.toFixed(1)}%`} color="#4ade80" />
          <Stat icon={Brain} label="Мудрость" value={`${stats.wis}`} color="#a78bfa" />
          <Stat icon={HeartPulse} label="Макс. HP" value={`${stats.hp}`} color="#fb7185" />
          {extras.spellPower > 0 && (
            <Stat icon={Sparkles} label="Сила умений" value={`+${extras.spellPower}%`} color="#c084fc" />
          )}
          {extras.lifesteal > 0 && (
            <Stat icon={Droplet} label="Вампиризм" value={`${extras.lifesteal.toFixed(1)}%`} color="#f472b6" />
          )}
        </div>

        <div className="pt-1">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Снаряжение
          </div>
          <div className="space-y-1.5">
            {(Object.keys(SLOT_LABEL) as Slot[]).map((slot) => {
              const item = player.equipment[slot];
              return (
                <div
                  key={slot}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                      {SLOT_LABEL[slot]}
                    </div>
                    {item ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="truncate text-xs font-semibold text-white/85"
                          title={sellableItems(item.stats).join(" · ")}
                        >
                          {itemName(item)}
                        </span>
                        <GradeBadge grade={item.grade} size="sm" />
                      </div>
                    ) : (
                      <span className="text-xs italic text-white/30">пусто</span>
                    )}
                  </div>
                  {item && (
                    <button
                      onClick={() => unequip(slot)}
                      className="rounded-md p-1 text-white/30 opacity-0 transition hover:bg-blood-500/20 hover:text-blood-400 group-hover:opacity-100"
                      title="Снять"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {treeOpen && <SkillTreeModal onClose={() => setTreeOpen(false)} />}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Sword;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-white/40">
        <Icon className="h-3 w-3" style={{ color }} />
        {label}
      </div>
      <div className="font-mono2 mt-0.5 text-xs font-semibold text-white/85">{value}</div>
    </div>
  );
}
