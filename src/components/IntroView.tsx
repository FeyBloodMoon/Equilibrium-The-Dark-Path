import { ArrowLeft, ArrowRight, Check, Swords, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { CLASSES, GENDER_LABEL } from "../game/classes";
import type { ClassId, Gender } from "../game/classes";
import { baseStats, maxMana } from "../game/engine";
import { newPlayer, useGame } from "../game/store";
import { cn } from "../utils/cn";
import { ClassPortrait } from "./ClassPortrait";

type Step = 0 | 1 | 2;

export function IntroView() {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId>("warrior");
  const [gender, setGender] = useState<Gender>("male");
  const startGame = useGame((s) => s.startGame);
  const importSave = useGame((s) => s.importSave);
  const fileRef = useRef<HTMLInputElement>(null);

  const cls = CLASSES.find((c) => c.id === classId)!;
  const preview = baseStats(1, classId);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto py-8">
      <img src="/img/city.jpg" alt="" className="anim-fog fixed inset-0 h-full w-full scale-105 object-cover opacity-45" />
      <div className="fixed inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/65 to-ink-950" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4">
        <div className="anim-fade-up text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/40 bg-ink-900/70 shadow-[0_0_50px_rgba(217,164,65,0.25)]">
            <Swords className="h-7 w-7 text-gold-400" />
          </div>
          <h1 className="font-display gold-text text-3xl font-bold tracking-[0.18em] sm:text-4xl">
            ЭКВИЛИБРИЯ
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.5em] text-white/40">Тёмная тропа</p>
        </div>

        {/* stepper */}
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2">
          {["Имя", "Класс", "Облик"].map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition",
                  i < step
                    ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                    : i === step
                      ? "border-gold-400/60 bg-gold-500/20 text-gold-200"
                      : "border-white/10 bg-white/[0.03] text-white/30"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn("text-[11px] uppercase tracking-widest", i === step ? "text-gold-200" : "text-white/35")}>
                {label}
              </span>
              {i < 2 && <div className="h-px flex-1 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="panel anim-fade-up mt-5 p-5 sm:p-6">
          {step === 0 && (
            <form
              className="mx-auto flex max-w-md flex-col gap-4 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              <p className="text-center text-sm leading-relaxed text-white/60">
                Город на краю проклятого леса ждёт нового героя. Как вас будут звать в тавернах?
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={18}
                placeholder="Имя героя..."
                className="w-full rounded-xl border border-gold-500/25 bg-ink-900/80 px-4 py-3 text-center font-display text-lg tracking-wider text-gold-200 placeholder:text-white/25 focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
              <button type="submit" className="btn btn-gold px-6 py-3 text-sm uppercase tracking-[0.18em]">
                Выбрать класс
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-ghost px-4 py-2 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                Загрузить сохранение
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
            </form>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display mb-3 text-center text-lg font-bold text-gold-300">
                Выберите класс
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {CLASSES.map((c) => {
                  const active = c.id === classId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setClassId(c.id)}
                      className={cn(
                        "group flex gap-3 rounded-xl border p-2.5 text-left transition",
                        active
                          ? "border-gold-400/60 bg-gold-500/[0.09] shadow-[0_0_24px_rgba(217,164,65,0.12)]"
                          : "border-white/[0.08] bg-white/[0.025] hover:border-white/20"
                      )}
                    >
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
                        <ClassPortrait classId={c.id} gender={gender} glow={false} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold" style={{ color: c.color }}>
                          {c.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-white/35">{c.title}</div>
                        <p className="mt-1 line-clamp-3 text-[10.5px] leading-snug text-white/50">{c.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.08] bg-black/30 p-3.5 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="font-display text-sm font-bold" style={{ color: cls.color }}>
                    {cls.name} — {cls.title}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {cls.playstyle.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/60">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10.5px] sm:grid-cols-4">
                    <Mini label="Здоровье" value={preview.hp} />
                    <Mini label="Урон" value={`${preview.dmgMin}–${preview.dmgMax}`} />
                    <Mini label="Защита" value={`${preview.def}%`} />
                    <Mini label="Ловкость" value={`${preview.agi}%`} />
                    <Mini label="Крит" value={`${preview.crit}%`} />
                    <Mini label="Кр. урон" value={`×${preview.critMult}`} />
                    <Mini label="Мудрость" value={preview.wis} />
                    <Mini label="Мана" value={maxMana(preview)} />
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1.5 text-[10.5px] text-white/50 sm:max-w-44">
                  <div className="font-bold uppercase tracking-widest text-white/35">Умения</div>
                  {cls.spells.map((sp) => (
                    <div key={sp.id} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1">
                      <span className="text-white/80">{sp.name}</span>
                      <span className="text-white/35"> · ур.{sp.minLevel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-between gap-3">
                <button onClick={() => setStep(0)} className="btn btn-ghost px-4 py-2.5 text-xs">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
                <button onClick={() => setStep(2)} className="btn btn-gold px-6 py-2.5 text-xs uppercase tracking-[0.18em]">
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display mb-4 text-center text-lg font-bold text-gold-300">
                Облик героя
              </h2>
              <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
                {(["male", "female"] as Gender[]).map((g) => {
                  const active = g === gender;
                  return (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "overflow-hidden rounded-xl border transition",
                        active
                          ? "border-gold-400/60 shadow-[0_0_28px_rgba(217,164,65,0.18)]"
                          : "border-white/10 opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="h-56 w-full">
                        <ClassPortrait classId={classId} gender={g} glow={false} />
                      </div>
                      <div
                        className={cn(
                          "py-2 text-center text-xs font-bold uppercase tracking-[0.2em]",
                          active ? "bg-gold-500/15 text-gold-200" : "bg-white/[0.03] text-white/45"
                        )}
                      >
                        {GENDER_LABEL[g]}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mx-auto mt-4 max-w-lg rounded-xl border border-white/[0.08] bg-black/30 p-3 text-center text-[11.5px] text-white/55">
                <span className="font-display text-sm text-white/90">{name.trim() || "Странник"}</span>
                {" · "}
                <span style={{ color: cls.color }}>{cls.name}</span>
                {" · "}
                {GENDER_LABEL[gender]}
              </div>

              <div className="mt-4 flex justify-between gap-3">
                <button onClick={() => setStep(1)} className="btn btn-ghost px-4 py-2.5 text-xs">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </button>
                <button
                  onClick={() => startGame(name, classId, gender)}
                  className="btn btn-gold px-6 py-2.5 text-xs uppercase tracking-[0.18em]"
                >
                  Ступить на тропу
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] text-white/25">
          Прогресс сохраняется автоматически · {newPlayer("").skillPoints} очко навыков выдаётся сразу
        </p>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-white/35">{label}</div>
      <div className="font-mono2 text-[11px] font-semibold text-white/85">{value}</div>
    </div>
  );
}
