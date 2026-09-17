import { Check, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { getClass } from "../game/classes";
import type { SkillNode } from "../game/classes";
import { useExtras, useGame } from "../game/store";
import { cn } from "../utils/cn";

export function SkillTreeModal({ onClose }: { onClose: () => void }) {
  const player = useGame((s) => s.player);
  const learnSkill = useGame((s) => s.learnSkill);
  const resetSkills = useGame((s) => s.resetSkills);
  const extras = useExtras();
  const cls = getClass(player.classId);
  const spent = Object.values(player.skills).reduce((a, b) => a + b, 0);

  const canLearn = (node: SkillNode) => {
    if (player.skillPoints <= 0) return false;
    if ((player.skills[node.id] ?? 0) >= node.maxRank) return false;
    const prev = cls.skills.find((s) => s.branch === node.branch && s.tier === node.tier - 1);
    return !prev || (player.skills[prev.id] ?? 0) >= 1;
  };

  const branches: [SkillNode[], SkillNode[]] = [
    cls.skills.filter((s) => s.branch === 0).sort((a, b) => a.tier - b.tier),
    cls.skills.filter((s) => s.branch === 1).sort((a, b) => a.tier - b.tier),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="panel anim-pop w-full max-w-3xl overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3.5"
          style={{ background: `linear-gradient(90deg, ${cls.accent}22, transparent)` }}
        >
          <div>
            <h2 className="font-display text-lg font-bold" style={{ color: cls.color }}>
              Древо навыков · {cls.name}
            </h2>
            <p className="text-[11px] text-white/45">
              Очков доступно:{" "}
              <span className="font-mono2 font-bold text-gold-300">{player.skillPoints}</span>
              {" · "}вложено: {spent}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost h-8 w-8 rounded-lg p-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {branches.map((nodes, bi) => (
            <div key={bi} className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Ветвь {bi === 0 ? "I · стойкость" : "II · мощь"}
              </div>
              <div className="space-y-2">
                {nodes.map((node, i) => {
                  const rank = player.skills[node.id] ?? 0;
                  const maxed = rank >= node.maxRank;
                  const available = canLearn(node);
                  const locked =
                    i > 0 && (player.skills[nodes[i - 1].id] ?? 0) < 1 && rank === 0;
                  return (
                    <div
                      key={node.id}
                      className={cn(
                        "relative rounded-lg border p-2.5 transition",
                        maxed
                          ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                          : rank > 0
                            ? "border-gold-500/35 bg-gold-500/[0.06]"
                            : locked
                              ? "border-white/[0.05] bg-white/[0.015] opacity-55"
                              : "border-white/[0.09] bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                            {maxed && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                            {node.name}
                          </div>
                          <div className="text-[10.5px] leading-snug text-white/50">{node.desc}</div>
                        </div>
                        <button
                          onClick={() => learnSkill(node.id)}
                          disabled={!available}
                          className={cn(
                            "btn h-7 shrink-0 rounded-md px-2 text-[10px]",
                            available ? "btn-gold" : "btn-ghost"
                          )}
                          title={locked ? "Требуется предыдущий навык" : "Вложить очко"}
                        >
                          <Plus className="h-3 w-3" />
                          {rank}/{node.maxRank}
                        </button>
                      </div>
                      <div className="mt-1.5 flex gap-1">
                        {Array.from({ length: node.maxRank }).map((_, r) => (
                          <span
                            key={r}
                            className="h-1 flex-1 rounded-full"
                            style={{
                              background: r < rank ? cls.accent : "rgba(255,255,255,0.08)",
                              boxShadow: r < rank ? `0 0 8px ${cls.accent}77` : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3">
          <div className="flex flex-wrap gap-1.5 text-[10.5px]">
            <Chip label="Сила умений" value={`+${extras.spellPower}%`} />
            <Chip label="Вампиризм" value={`${extras.lifesteal.toFixed(1)}%`} />
            <Chip label="Добыча золота" value={`+${extras.greed}%`} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetSkills}
              disabled={spent === 0}
              className="btn btn-ghost rounded-lg px-3 py-2 text-[11px]"
              title={`Сброс стоит ${spent * 25} золота`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Сбросить ({spent * 25} зол)
            </button>
            <button onClick={onClose} className="btn btn-gold rounded-lg px-4 py-2 text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-white/55">
      {label}: <span className="font-mono2 text-white/85">{value}</span>
    </span>
  );
}
