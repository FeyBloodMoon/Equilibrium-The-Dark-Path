import {
  Castle,
  Church,
  Download,
  Landmark,
  Lock,
  RotateCcw,
  Save,
  Store,
  Trees,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef, useState } from "react";
import { useGame } from "../game/store";
import type { View } from "../game/types";
import { cn } from "../utils/cn";
import { CheatMenu } from "./CheatMenu";
import { Modal } from "./Modal";
import { Gold } from "./ui";

const NAV: { id: View; label: string; icon: typeof Castle }[] = [
  { id: "city", label: "Город", icon: Castle },
  { id: "shop", label: "Магазин", icon: Store },
  { id: "guild", label: "Гильдия", icon: Landmark },
  { id: "church", label: "Церковь", icon: Church },
  { id: "forest", label: "Лес", icon: Trees },
];

export function TopBar() {
  const view = useGame((s) => s.view);
  const combat = useGame((s) => s.combat);
  const gold = useGame((s) => s.player.gold);
  const level = useGame((s) => s.player.level);
  const sound = useGame((s) => s.player.sound);
  const setView = useGame((s) => s.setView);
  const toggleSound = useGame((s) => s.toggleSound);
  const resetGame = useGame((s) => s.resetGame);
  const exportSave = useGame((s) => s.exportSave);
  const importSave = useGame((s) => s.importSave);
  const showToast = useGame((s) => s.showToast);

  const [confirmReset, setConfirmReset] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const clicks = useRef<number[]>([]);

  const locked = !!combat && combat.phase !== "result";

  /** Скрытый чит-код: 5 быстрых кликов по логотипу */
  const logoClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1800), now];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      setCheatOpen(true);
    }
  };

  const doSave = () => {
    const blob = new Blob([exportSave()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equilibria-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Сохранение выгружено в файл", "good");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/10 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
        <button onClick={logoClick} className="flex items-center gap-3 text-left" title="Эквилибрия">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/40 bg-gradient-to-b from-gold-500/25 to-transparent transition hover:border-gold-400/70">
            <SwordsMark />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="font-display gold-text text-sm font-bold tracking-[0.22em] sm:text-base">
              ЭКВИЛИБРИЯ
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">Тёмная тропа</div>
          </div>
        </button>

        <nav className="flex items-center gap-1.5">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id || (view === "combat" && id === "forest");
            const disabled = locked;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                disabled={disabled}
                title={disabled ? "Завершите поход, чтобы перемещаться" : label}
                className={cn(
                  "btn h-9 rounded-lg px-2.5 text-xs sm:px-3.5 sm:text-[13px]",
                  active
                    ? "border border-gold-500/45 bg-gold-500/15 text-gold-300"
                    : "border border-transparent text-white/55 hover:text-gold-200",
                  disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {disabled && !active ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <span className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono2 text-xs text-white/75 lg:inline-flex">
            ур. {level}
          </span>
          <span className="rounded-lg border border-gold-500/25 bg-gold-500/10 px-2.5 py-1.5">
            <Gold amount={gold} className="text-xs" />
          </span>
          <button onClick={doSave} className="btn btn-ghost h-9 w-9 rounded-lg p-0" title="Сохранить в файл">
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn btn-ghost h-9 w-9 rounded-lg p-0"
            title="Загрузить сохранение"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) importSave(await f.text());
              e.target.value = "";
            }}
          />
          <button
            onClick={toggleSound}
            className="btn btn-ghost h-9 w-9 rounded-lg p-0"
            title={sound ? "Выключить звук" : "Включить звук"}
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="btn btn-ghost h-9 w-9 rounded-lg p-0"
            title="Начать заново"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)} width="max-w-md">
          <div className="p-6 text-center">
            <h3 className="font-display text-lg font-bold text-gold-300">Начать заново?</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Весь прогресс будет утерян. Сначала можно выгрузить сохранение в файл.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => setConfirmReset(false)}>
                Отмена
              </button>
              <button className="btn btn-ghost px-3 py-2 text-sm" onClick={doSave}>
                <Download className="h-3.5 w-3.5" />
                Сохранить
              </button>
              <button
                className="btn btn-danger px-4 py-2 text-sm"
                onClick={() => {
                  resetGame();
                  setConfirmReset(false);
                }}
              >
                Стереть
              </button>
            </div>
          </div>
        </Modal>
      )}

      {cheatOpen && <CheatMenu onClose={() => setCheatOpen(false)} />}
    </header>
  );
}

function SwordsMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M4 4l10 10M4 8l4-4M20 4L10 14M20 8l-4-4M7 14l-3 3 3 3 3-3M17 14l-3 3 3 3 3-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
