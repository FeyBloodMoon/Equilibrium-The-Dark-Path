import { Coins, Gem, Heart, Shield, Sparkles, Swords, Terminal, Users } from "lucide-react";
import { useState } from "react";
import { CLASSES } from "../game/classes";
import type { ClassId, Gender } from "../game/classes";
import { GRADES } from "../game/data";
import { useGame } from "../game/store";
import type { Grade } from "../game/types";
import { cn } from "../utils/cn";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";

export function CheatMenu({ onClose }: { onClose: () => void }) {
  const cheat = useGame((s) => s.cheat);
  const player = useGame((s) => s.player);
  const [grade, setGrade] = useState<Grade>("S");

  return (
    <Modal onClose={onClose} width="max-w-2xl" className="border-emerald-400/35">
      <ModalHeader
        title="Консоль отладки"
        accent="#34d399"
        onClose={onClose}
        icon={
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400/10">
            <Terminal className="h-4.5 w-4.5 text-emerald-400" />
          </span>
        }
        subtitle={
          <span className="font-mono2 text-emerald-400/60">
            /// доступ получен · {player.name}, ур. {player.level}
          </span>
        }
      />

      <ModalBody className="space-y-4">
        <Section icon={Coins} title="Ресурсы">
          <Cheat label="+1 000 золота" onClick={() => cheat("gold", 1000)} />
          <Cheat label="+25 000 золота" onClick={() => cheat("gold", 25000)} />
          <Cheat label="+10 зелий каждого вида" onClick={() => cheat("potions", 10)} />
          <Cheat label="+5 камней всех классов" onClick={() => cheat("stones", 5)} />
        </Section>

        <Section icon={Sparkles} title="Развитие">
          <Cheat label="+1 уровень" onClick={() => cheat("level", 1)} />
          <Cheat label="+5 уровней" onClick={() => cheat("level", 5)} />
          <Cheat label="+5 очков навыков" onClick={() => cheat("skillpoints", 5)} />
          <Cheat label="Полное восстановление" onClick={() => cheat("heal")} />
        </Section>

        <Section icon={Users} title="Город">
          <Cheat label="Вернуть наёмников (100% надёжн.)" onClick={() => cheat("mercs")} />
          <Cheat label="Обновить доску заданий" onClick={() => cheat("board")} />
          <Cheat label="Обновить товары лавки" onClick={() => cheat("shop")} />
          <Cheat label="Сбросить все таймеры" onClick={() => cheat("timers")} />
        </Section>

        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3.5">
          <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            <Swords className="h-3.5 w-3.5 text-gold-400" />
            Выдать комплект снаряжения
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={cn(
                  "btn h-8 w-10 rounded-lg text-[11px]",
                  grade === g ? "btn-gold" : "btn-ghost"
                )}
              >
                {g}
              </button>
            ))}
            <button
              onClick={() => cheat("gear", { grade })}
              className="btn btn-gold ml-auto h-8 rounded-lg px-4 text-[11px]"
            >
              <Gem className="h-3.5 w-3.5" />
              Выдать класс {grade}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3.5">
          <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            <Shield className="h-3.5 w-3.5 text-indigo-300" />
            Сменить класс и облик
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => cheat("class", c.id as ClassId)}
                className={cn(
                  "btn h-8 rounded-lg text-[11px]",
                  player.classId === c.id ? "btn-gold" : "btn-ghost"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => cheat("gender", (player.gender === "male" ? "female" : "male") as Gender)}
            className="btn btn-ghost mt-1.5 h-8 w-full rounded-lg text-[11px]"
          >
            <Heart className="h-3.5 w-3.5" />
            Сменить пол ({player.gender === "male" ? "мужчина" : "женщина"})
          </button>
        </div>
      </ModalBody>

      <ModalFooter>
        <span className="font-mono2 text-[10px] text-white/25">
          вызов: 5 быстрых кликов по гербу
        </span>
        <button onClick={onClose} className="btn btn-ghost rounded-lg px-5 py-2 text-[11px]">
          Закрыть
        </button>
      </ModalFooter>
    </Modal>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Coins;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3.5">
      <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        <Icon className="h-3.5 w-3.5 text-emerald-400" />
        {title}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Cheat({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn justify-start rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-left text-[11.5px] leading-snug text-emerald-200 hover:bg-emerald-400/[0.14]"
    >
      {label}
    </button>
  );
}
