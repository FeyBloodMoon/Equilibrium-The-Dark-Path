import {
  CheckCircle2,
  Clock,
  Dices,
  Gem,
  Landmark,
  Lock,
  Medal,
  Package,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Skull,
  Swords,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  BOARD_AUTO_MS,
  BOARD_MANUAL_MS,
  GRADE_COLOR,
  LOCATIONS,
  MERC_DURATION_MIN,
} from "../game/data";
import { mercCostFor } from "../game/engine";
import { useGame } from "../game/store";
import type { MercCandidate, Quest, StoneGrade } from "../game/types";
import { cn } from "../utils/cn";
import { Empty } from "./InventoryPanel";
import { GradeBadge, Gold, SectionTitle } from "./ui";

function useNow(step = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(t);
  }, [step]);
  return now;
}

function fmtLeft(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function reliabilityColor(r: number) {
  if (r >= 80) return "#34d399";
  if (r >= 55) return "#facc15";
  if (r >= 30) return "#fb923c";
  return "#f87171";
}

export function GuildView() {
  const now = useNow();
  const gold = useGame((s) => s.player.gold);
  const candidates = useGame((s) => s.mercCandidates);
  const mercs = useGame((s) => s.mercs);
  const rerollMercs = useGame((s) => s.rerollMercs);
  const claimMerc = useGame((s) => s.claimMerc);
  const quests = useGame((s) => s.quests);
  const acceptQuest = useGame((s) => s.acceptQuest);
  const abandonQuest = useGame((s) => s.abandonQuest);
  const refreshBoard = useGame((s) => s.refreshBoard);
  const boardTick = useGame((s) => s.boardTick);
  const turnInQuest = useGame((s) => s.turnInQuest);
  const inventory = useGame((s) => s.inventory);
  const boardLastChange = useGame((s) => s.boardLastChange);
  const boardLastManual = useGame((s) => s.boardLastManual);
  const [hiring, setHiring] = useState<MercCandidate | null>(null);

  useEffect(() => {
    const t = setInterval(boardTick, 5000);
    boardTick();
    return () => clearInterval(t);
  }, [boardTick]);

  useEffect(() => {
    if (candidates.length === 0) rerollMercs();
  }, [candidates.length, rerollMercs]);

  const board = quests.filter((q) => q.status === "board");
  const active = quests.filter((q) => q.status === "active");
  const manualLeft = BOARD_MANUAL_MS - (now - boardLastManual);
  const autoLeft = BOARD_AUTO_MS - (now - boardLastChange);

  const questReady = (q: Quest) => {
    if (q.kind === "stones") return (inventory.stones[q.stoneGrade!] ?? 0) >= q.need;
    if (q.kind === "materials") return (inventory.materials[q.materialId!] ?? 0) >= q.need;
    return q.progress >= q.need;
  };
  const questHave = (q: Quest) =>
    q.kind === "stones"
      ? Math.min(inventory.stones[q.stoneGrade!] ?? 0, q.need)
      : q.kind === "materials"
        ? Math.min(inventory.materials[q.materialId!] ?? 0, q.need)
        : q.progress;

  return (
    <div className="vignette relative -m-4 min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl sm:-m-6">
      <img src="/img/guild.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/80 to-ink-950/95" />

      <div className="relative z-10 p-5 sm:p-8">
        <SectionTitle
          icon={Landmark}
          title="Гильдия искателей"
          sub="Контракты, клятвы и наёмные клинки"
          right={
            <span className="rounded-lg border border-gold-500/25 bg-ink-900/80 px-3 py-1.5">
              <Gold amount={gold} className="text-sm" />
            </span>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
          {/* ---------------- mercenaries ---------------- */}
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <Users className="h-4 w-4 text-gold-400" />
                  Наёмники · {mercs.length}/3
                </div>
                <button onClick={rerollMercs} className="btn btn-ghost rounded-md px-2.5 py-1 text-[10px]">
                  <Dices className="h-3 w-3" />
                  Другие кандидаты
                </button>
              </div>

              <div className="space-y-2">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-gold-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-white/90">{c.name}</span>
                          <GradeBadge grade={c.grade} size="sm" />
                        </div>
                        <div className="text-[10.5px] text-white/45">уровень {c.level}</div>
                      </div>
                      <button
                        onClick={() => setHiring(c)}
                        disabled={mercs.length >= 3}
                        className="btn btn-gold h-7 shrink-0 rounded-md px-2.5 text-[10.5px]"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Нанять
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-white/45">
                        <ShieldCheck className="h-3 w-3" style={{ color: reliabilityColor(c.reliability) }} />
                        надёжность
                      </span>
                      <div className="bar h-1.5 flex-1">
                        <div
                          className="bar-fill h-full"
                          style={{
                            width: `${c.reliability}%`,
                            background: `linear-gradient(90deg, ${reliabilityColor(c.reliability)}88, ${reliabilityColor(c.reliability)})`,
                          }}
                        />
                      </div>
                      <span className="font-mono2 text-[10px]" style={{ color: reliabilityColor(c.reliability) }}>
                        {c.reliability}%
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-white/35">
                      риск потерять добычу: {100 - c.reliability}% · от {c.baseCost} зол
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* сотрудники в походе */}
            <div className="panel p-4">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                В походе
              </div>
              <div className="space-y-2">
                {mercs.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-[11px] text-white/35">
                    Никто не нанят. Наёмники приносят только камни и материалы.
                  </p>
                )}
                {mercs.map((m) => {
                  const left = m.returnAt - now;
                  const done = left <= 0;
                  const loc = LOCATIONS.find((l) => l.id === m.locationId);
                  const total = m.returnAt - m.sentAt;
                  const stones = Object.entries(m.loot.stones) as [StoneGrade, number][];
                  const mats = Object.entries(m.loot.materials);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-xl border p-3",
                        done ? "border-emerald-400/40 bg-emerald-400/[0.06]" : "border-white/[0.08] bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-white/90">
                            {m.name}
                            <GradeBadge grade={m.grade} size="sm" />
                          </div>
                          <div className="text-[10.5px] text-white/45">
                            ур. {m.level} · {loc?.name}
                          </div>
                        </div>
                        {done ? (
                          <button
                            onClick={() => claimMerc(m.id)}
                            className="btn btn-gold h-7 shrink-0 animate-pulse rounded-md px-2.5 text-[10.5px]"
                          >
                            Забрать
                          </button>
                        ) : (
                          <span className="flex shrink-0 items-center gap-1.5 font-mono2 text-xs text-white/60">
                            <Clock className="h-3.5 w-3.5 text-gold-400" />
                            {fmtLeft(left)}
                          </span>
                        )}
                      </div>
                      {!done && (
                        <div className="bar mt-2 h-1.5">
                          <div
                            className="bar-fill h-full bg-gradient-to-r from-gold-700 to-gold-400"
                            style={{ width: `${Math.min(100, (1 - left / total) * 100)}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        <span style={{ color: reliabilityColor(m.reliability) }}>
                          надёжность {m.reliability}% · риск {100 - m.reliability}%
                        </span>
                        {done && (
                          <span className="flex items-center gap-1.5 text-white/50">
                            <Gem className="h-3 w-3 text-indigo-300" />
                            {stones.reduce((a, [, n]) => a + n, 0)}
                            <Package className="ml-1 h-3 w-3 text-white/40" />
                            {mats.reduce((a, [, n]) => a + n, 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel p-4 text-[11.5px] leading-relaxed text-white/50">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                <Medal className="h-3.5 w-3.5" />
                Как это работает
              </div>
              Наёмники приносят <b className="text-white/75">только камни чудовищ и материалы</b> — золото,
              опыт и снаряжение остаются у них. Время похода зависит от локации
              ({MERC_DURATION_MIN[0]}–{MERC_DURATION_MIN[4]} мин), а шанс потерять всю добычу равен
              <b className="text-blood-400"> 100 − надёжность</b>.
            </div>
          </div>

          {/* ---------------- quests ---------------- */}
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                <Swords className="h-4 w-4 text-blood-400" />
                Ваши контракты · {active.length}/5
              </div>
              {active.length === 0 ? (
                <Empty icon={ScrollText} text="Активных контрактов нет — выберите на доске ниже." />
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {active.map((q) => {
                    const ready = questReady(q);
                    const have = questHave(q);
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "flex flex-col rounded-xl border p-3",
                          ready ? "border-emerald-400/40 bg-emerald-400/[0.06]" : "border-white/[0.08] bg-white/[0.03]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {q.kind === "elite" && <Skull className="h-3.5 w-3.5 shrink-0 text-blood-400" />}
                              <span className="truncate text-xs font-semibold text-white/90">{q.title}</span>
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-[10.5px] text-white/45">{q.targetLabel}</div>
                          </div>
                          <GradeBadge grade={q.grade} size="sm" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bar h-1.5 flex-1">
                            <div
                              className="bar-fill h-full"
                              style={{
                                width: `${Math.min(100, (have / q.need) * 100)}%`,
                                background: ready
                                  ? "#34d399"
                                  : `linear-gradient(90deg, ${GRADE_COLOR[q.grade]}88, ${GRADE_COLOR[q.grade]})`,
                              }}
                            />
                          </div>
                          <span className="font-mono2 shrink-0 text-[10px] text-white/60">
                            {have}/{q.need}
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[10.5px] text-white/50">
                            <Gold amount={q.rewardGold} className="text-[10.5px]" />
                            <span className="text-indigo-300/90">{q.rewardXp} оп.</span>
                          </span>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              onClick={() => abandonQuest(q.id)}
                              className="btn btn-ghost h-7 w-7 rounded-md p-0"
                              title="Отказаться"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => turnInQuest(q.id)}
                              disabled={!ready}
                              className={cn("btn h-7 rounded-md px-2.5 text-[10.5px]", ready ? "btn-gold" : "btn-ghost")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Сдать
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <ScrollText className="h-4 w-4 text-gold-400" />
                  Доска заданий
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono2 text-[10px] text-white/35">
                    авто-обновление: {fmtLeft(autoLeft)}
                  </span>
                  <button
                    onClick={() => refreshBoard(false)}
                    disabled={manualLeft > 0}
                    title={
                      manualLeft > 0
                        ? `Гильдия перевесит объявления через ${fmtLeft(manualLeft)}`
                        : "Обновить доску"
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
              <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                {board.map((q, i) => (
                  <div
                    key={q.id}
                    className="anim-fade-up flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-gold-500/30"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {q.kind === "elite" && <Skull className="h-3.5 w-3.5 shrink-0 text-blood-400" />}
                          <span className="truncate text-xs font-semibold text-white/90">{q.title}</span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-white/45">
                          {q.targetLabel}
                        </div>
                      </div>
                      <GradeBadge grade={q.grade} size="sm" />
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2.5">
                      <span className="flex items-center gap-2 text-[10.5px] text-white/50">
                        <Gold amount={q.rewardGold} className="text-[10.5px]" />
                        <span className="text-indigo-300/90">{q.rewardXp} оп.</span>
                      </span>
                      <button
                        onClick={() => acceptQuest(q.id)}
                        disabled={active.length >= 5}
                        className="btn btn-gold h-7 shrink-0 rounded-md px-3 text-[10.5px]"
                      >
                        Взять
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hiring && <HireModal candidate={hiring} onClose={() => setHiring(null)} />}
    </div>
  );
}

function HireModal({ candidate, onClose }: { candidate: MercCandidate; onClose: () => void }) {
  const hireMerc = useGame((s) => s.hireMerc);
  const gold = useGame((s) => s.player.gold);
  const [locId, setLocId] = useState(
    LOCATIONS.filter((l) => candidate.level >= l.minLvl).slice(-1)[0]?.id ?? LOCATIONS[0].id
  );
  const loc = LOCATIONS.find((l) => l.id === locId)!;
  const cost = mercCostFor(candidate, loc.tier);
  const allowed = candidate.level >= loc.minLvl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="panel anim-pop w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
          <div>
            <h3 className="font-display text-sm font-bold text-gold-300">Контракт наёмника</h3>
            <p className="text-[11px] text-white/45">
              {candidate.name} · ур. {candidate.level} · надёжность{" "}
              <span style={{ color: reliabilityColor(candidate.reliability) }}>{candidate.reliability}%</span>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost h-8 w-8 rounded-lg p-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Куда отправить
          </div>
          <div className="space-y-1.5">
            {LOCATIONS.map((l) => {
              const ok = candidate.level >= l.minLvl;
              const active = l.id === locId;
              return (
                <button
                  key={l.id}
                  onClick={() => ok && setLocId(l.id)}
                  disabled={!ok}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
                    active
                      ? "border-gold-400/55 bg-gold-500/10"
                      : ok
                        ? "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
                        : "cursor-not-allowed border-white/[0.05] bg-white/[0.015] opacity-45"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: l.accent }}>
                      {!ok && <Lock className="h-3 w-3" />}
                      {l.name}
                    </div>
                    <div className="text-[10px] text-white/40">
                      ур. {l.minLvl}–{l.maxLvl} · камни ~{["F–E", "E–D", "D–C", "C–B", "B–SS"][l.tier]}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono2 text-[11px] text-white/80">{MERC_DURATION_MIN[l.tier]} мин</div>
                    <div className="font-mono2 text-[10px] text-gold-300/80">
                      {mercCostFor(candidate, l.tier)} зол
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-blood-500/20 bg-blood-500/[0.06] px-3 py-2 text-[10.5px] leading-relaxed text-white/55">
            Риск провала — <b className="text-blood-400">{100 - candidate.reliability}%</b>. При провале
            наёмник вернётся с пустыми руками, а золото за контракт не возвращается.
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3">
          <Gold amount={cost} className="text-sm" />
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost px-3 py-2 text-[11px]">
              Отмена
            </button>
            <button
              onClick={() => {
                hireMerc(candidate.id, locId);
                onClose();
              }}
              disabled={!allowed || gold < cost}
              className="btn btn-gold px-4 py-2 text-[11px]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Отправить на {MERC_DURATION_MIN[loc.tier]} мин
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


