import { Check, GitBranch, Lock, Plus, RotateCcw, Sparkles } from "lucide-react";
import { getClass } from "../game/classes";
import type { SkillNode } from "../game/classes";
import { useExtras, useGame } from "../game/store";
import { cn } from "../utils/cn";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";

const BRANCH_TITLES = ["Стойкость", "Мощь"];

export function SkillTreeModal({ onClose }: { onClose: () => void }) {
  const player = useGame((s) => s.player);
  const learnSkill = useGame((s) => s.learnSkill);
  const resetSkills = useGame((s) => s.resetSkills);
  const extras = useExtras();
  const cls = getClass(player.classId);
  const spent = Object.values(player.skills).reduce((a, b) => a + b, 0);

  const branches = [0, 1].map((b) =>
    cls.skills.filter((s) => s.branch === b).sort((a, b2) => a.tier - b2.tier)
  );

  const isLocked = (nodes: SkillNode[], i: number) =>
    i > 0 && (player.skills[nodes[i - 1].id] ?? 0) < 1;

  const canLearn = (nodes: SkillNode[], i: number) => {
    const node = nodes[i];
    if (player.skillPoints <= 0) return false;
    if ((player.skills[node.id] ?? 0) >= node.maxRank) return false;
    return !isLocked(nodes, i);
  };

  return (
    <Modal onClose={onClose} width="max-w-4xl">
      <ModalHeader
        title={`Древо навыков · ${cls.name}`}
        accent={cls.color}
        onClose={onClose}
        icon={
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: `${cls.accent}55`, background: `${cls.accent}18` }}
          >
            <GitBranch className="h-4.5 w-4.5" style={{ color: cls.color }} />
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Свободных очков:{" "}
              <b className={cn("font-mono2", player.skillPoints > 0 ? "text-gold-300" : "text-white/40")}>
                {player.skillPoints}
              </b>
            </span>
            <span className="text-white/30">·</span>
            <span>
              Вложено: <b className="font-mono2 text-white/70">{spent}</b>
            </span>
            <span className="text-white/30">·</span>
            <span className="text-white/40">Навык открывается после вложения очка в предыдущий</span>
          </span>
        }
      />

      <ModalBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {branches.map((nodes, bi) => (
            <div key={bi} className="rounded-2xl border border-white/[0.07] bg-black/25 p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{ background: `${cls.accent}22`, color: cls.color }}
                >
                  {bi + 1}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  {BRANCH_TITLES[bi]}
                </span>
                <span className="ml-auto font-mono2 text-[10px] text-white/30">
                  {nodes.reduce((a, n) => a + (player.skills[n.id] ?? 0), 0)} /{" "}
                  {nodes.reduce((a, n) => a + n.maxRank, 0)}
                </span>
              </div>

              <div className="relative space-y-2.5 pl-6">
                {/* вертикальная линия ветви */}
                <div
                  className="absolute bottom-6 left-[11px] top-6 w-px"
                  style={{ background: `linear-gradient(180deg, ${cls.accent}55, ${cls.accent}12)` }}
                />
                {nodes.map((node, i) => {
                  const rank = player.skills[node.id] ?? 0;
                  const maxed = rank >= node.maxRank;
                  const locked = isLocked(nodes, i) && rank === 0;
                  const available = canLearn(nodes, i);
                  return (
                    <div key={node.id} className="relative">
                      {/* узел на линии */}
                      <span
                        className="absolute -left-6 top-4 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 text-[9px] font-bold"
                        style={{
                          borderColor: maxed
                            ? "#34d399"
                            : rank > 0
                              ? cls.accent
                              : "rgba(255,255,255,0.14)",
                          background: rank > 0 ? `${cls.accent}22` : "#0b0e14",
                          color: maxed ? "#34d399" : rank > 0 ? cls.color : "rgba(255,255,255,0.3)",
                          boxShadow: rank > 0 ? `0 0 12px ${cls.accent}55` : "none",
                        }}
                      >
                        {maxed ? <Check className="h-3 w-3" /> : locked ? <Lock className="h-2.5 w-2.5" /> : i + 1}
                      </span>

                      <div
                        className={cn(
                          "rounded-xl border p-3 transition",
                          maxed
                            ? "border-emerald-400/35 bg-emerald-400/[0.06]"
                            : rank > 0
                              ? "border-gold-500/30 bg-gold-500/[0.05]"
                              : locked
                                ? "border-white/[0.05] bg-white/[0.012]"
                                : "border-white/[0.09] bg-white/[0.03]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "text-[13px] font-semibold leading-tight",
                                locked ? "text-white/40" : "text-white/90"
                              )}
                            >
                              {node.name}
                            </div>
                            <p
                              className={cn(
                                "mt-1 text-[11.5px] leading-relaxed",
                                locked ? "text-white/25" : "text-white/55"
                              )}
                            >
                              {node.desc}
                              <span className="text-white/30"> · за ранг</span>
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span
                              className={cn(
                                "font-mono2 rounded-md border px-1.5 py-0.5 text-[10px]",
                                maxed
                                  ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                                  : "border-white/10 bg-black/30 text-white/60"
                              )}
                            >
                              {rank}/{node.maxRank}
                            </span>
                            <button
                              onClick={() => learnSkill(node.id)}
                              disabled={!available}
                              title={
                                locked
                                  ? "Сначала вложите очко в предыдущий навык"
                                  : maxed
                                    ? "Навык изучен полностью"
                                    : player.skillPoints <= 0
                                      ? "Нет свободных очков"
                                      : "Вложить очко"
                              }
                              className={cn(
                                "btn h-8 w-8 rounded-lg p-0",
                                available ? "btn-gold" : "btn-ghost"
                              )}
                            >
                              {locked ? <Lock className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex gap-1">
                          {Array.from({ length: node.maxRank }).map((_, r) => (
                            <span
                              key={r}
                              className="h-1.5 flex-1 rounded-full transition"
                              style={{
                                background: r < rank ? cls.accent : "rgba(255,255,255,0.07)",
                                boxShadow: r < rank ? `0 0 8px ${cls.accent}88` : "none",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Итоговые бонусы от древа
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Chip label="Сила умений" value={`+${extras.spellPower}%`} color="#c084fc" />
            <Chip label="Вампиризм" value={`${extras.lifesteal.toFixed(1)}%`} color="#f472b6" />
            <Chip label="Добыча золота" value={`+${extras.greed}%`} color="#e7bc5e" />
            <Chip label="Очков вложено" value={`${spent}`} color="#94a3b8" />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={resetSkills}
          disabled={spent === 0}
          className="btn btn-ghost rounded-lg px-3 py-2 text-[11px]"
          title={`Вернуть все ${spent} очк. за ${spent * 25} золота`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Сбросить · {spent * 25} зол
        </button>
        <button onClick={onClose} className="btn btn-gold rounded-lg px-5 py-2 text-[11px]">
          <Sparkles className="h-3.5 w-3.5" />
          Готово
        </button>
      </ModalFooter>
    </Modal>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5">
      <div className="text-[9.5px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="font-mono2 mt-0.5 text-xs font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
