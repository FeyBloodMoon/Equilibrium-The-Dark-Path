import { HeartPulse, Landmark, Sparkles, Store, Trees, Users } from "lucide-react";
import { useGame } from "../game/store";

const PLACES = [
  {
    id: "shop" as const,
    title: "Магазин",
    desc: "Зелья, доспехи и клинки. Торговец скупает камни чудовищ и трофеи.",
    img: "https://feybloodmoon.github.io/img/shop.jpg",
    icon: Store,
    tag: "торговля",
  },
  {
    id: "guild" as const,
    title: "Гильдия",
    desc: "Контракты от F до SSS и наёмники, готовые уйти в лес вместо вас.",
    img: "https://feybloodmoon.github.io/img/guild.jpg",
    icon: Landmark,
    tag: "контракты",
  },
  {
    id: "forest" as const,
    title: "Лес",
    desc: "Пять троп — от Тихой рощи до Пиков драконов. Охота, камни и слава.",
    img: "https://feybloodmoon.github.io/img/loc-grove.jpg",
    icon: Trees,
    tag: "поход",
  },
];

export function CityView() {
  const setView = useGame((s) => s.setView);
  const mercs = useGame((s) => s.mercs);
  const quests = useGame((s) => s.quests);

  const mercsWorking = mercs.length;
  const activeQuests = quests.filter((q) => q.status === "active").length;
  const doneQuests = quests.filter((q) => {
    if (q.status !== "active") return false;
    return q.kind === "kill" || q.kind === "elite" ? q.progress >= q.need : true;
  }).length;

  return (
    <div className="vignette relative -m-4 min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl sm:-m-6">
      <img src="/img/city.jpg" alt="Город" className="anim-fog absolute inset-0 h-full w-full scale-110 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/35 to-ink-950/95" />

      <div className="relative z-10 flex min-h-[calc(100vh-120px)] flex-col justify-between p-5 sm:p-8">
        <div className="anim-fade-up max-w-2xl pt-4 sm:pt-8">
          <div className="text-[11px] uppercase tracking-[0.4em] text-gold-300/80">стены спасают от чащи</div>
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-white sm:text-5xl">
            Город <span className="gold-text">Эквилибрия</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
            Здесь здоровье и мана восстанавливаются сами собой. Затарьтесь у торговца,
            возьмите контракт в гильдии — и за ворота, где камни чудовищ ждут достойных.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/65 backdrop-blur">
              <HeartPulse className="h-3.5 w-3.5 text-blood-400" /> HP и мана восстановлены
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/65 backdrop-blur">
              <Users className="h-3.5 w-3.5 text-gold-400" /> Наёмников в походе: {mercsWorking}/3
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/65 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Активных заданий: {activeQuests}
              {doneQuests > 0 && <span className="text-gold-300">· {doneQuests} готово к сдаче</span>}
            </span>
          </div>
        </div>

        <div className="grid gap-3 pb-2 sm:grid-cols-3 sm:gap-4">
          {PLACES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setView(p.id)}
              className="panel panel-hover group relative overflow-hidden text-left"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative h-36 overflow-hidden sm:h-44">
                <img
                  src={p.img}
                  alt={p.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
                <span className="absolute right-3 top-3 rounded-full border border-gold-500/30 bg-black/50 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-300 backdrop-blur">
                  {p.tag}
                </span>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-500/25 bg-gold-500/10 transition group-hover:bg-gold-500/20">
                  <p.icon className="h-4.5 w-4.5 text-gold-400" />
                </span>
                <div>
                  <div className="font-display text-base font-bold text-gold-200">{p.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{p.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
