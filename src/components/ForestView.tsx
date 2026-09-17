import { ChevronRight, Skull, Star, Trees, TriangleAlert } from "lucide-react";
import { LOCATIONS } from "../game/data";
import { useGame } from "../game/store";
import { cn } from "../utils/cn";
import { IconByName, SectionTitle } from "./ui";

export function ForestView() {
  const level = useGame((s) => s.player.level);
  const startExpedition = useGame((s) => s.startExpedition);

  return (
    <div className="p-1">
      <SectionTitle
        icon={Trees}
        title="Проклятый лес"
        sub="Выберите тропу — поход идёт автоматически: герой сам ищет монстров и сражается"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {LOCATIONS.map((loc, i) => {
          const tooHard = level < loc.minLvl;
          return (
            <div
              key={loc.id}
              className={cn(
                "panel panel-hover group anim-fade-up relative overflow-hidden",
                tooHard && "opacity-80"
              )}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={loc.img}
                  alt={loc.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/25 to-transparent" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3.5 w-3.5",
                        s <= loc.tier ? "fill-gold-400 text-gold-400" : "text-white/20"
                      )}
                    />
                  ))}
                </div>
                <div
                  className="absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur"
                  style={{
                    color: loc.accent,
                    borderColor: `${loc.accent}55`,
                    background: "rgba(0,0,0,0.45)",
                  }}
                >
                  ур. {loc.minLvl}–{loc.maxLvl}
                </div>
                <div className="absolute bottom-2.5 left-3.5 right-3.5">
                  <div className="font-display text-lg font-bold text-white drop-shadow">
                    {loc.name}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="min-h-9 text-[11.5px] leading-relaxed text-white/50">{loc.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {loc.monsters.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10.5px] text-white/65"
                    >
                      <IconByName name={m.icon} className="h-3 w-3" />
                      {m.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-white/40">
                    <Skull className="h-3.5 w-3.5 text-blood-400/80" />
                    ~9% особый монстр
                  </span>
                  <button
                    onClick={() => startExpedition(loc.id)}
                    className={cn(
                      "btn rounded-lg px-3.5 py-2 text-[11px] uppercase tracking-wider",
                      tooHard ? "btn-danger" : "btn-gold"
                    )}
                  >
                    {tooHard && <TriangleAlert className="h-3.5 w-3.5" />}
                    В поход
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
