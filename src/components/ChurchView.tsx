import { Church, FlaskConical, HeartPulse, Hourglass, Sparkles, WandSparkles } from "lucide-react";
import { POTIONS, REGEN_PER_SEC_DIV } from "../game/data";
import { maxMana } from "../game/engine";
import { churchPrice, useGame, useStats } from "../game/store";
import { cn } from "../utils/cn";
import { Bar, Gold, SectionTitle } from "./ui";

export function ChurchView() {
  const player = useGame((s) => s.player);
  const churchHeal = useGame((s) => s.churchHeal);
  const usePotion = useGame((s) => s.usePotion);
  const potions = useGame((s) => s.inventory.potions);
  const stats = useStats();
  const manaMax = maxMana(stats);
  const price = churchPrice(player, stats.hp, manaMax);
  const missing = Math.max(0, stats.hp - player.hp);
  const secondsLeft = Math.ceil(missing / (stats.hp / REGEN_PER_SEC_DIV));
  const canPay = player.gold >= price && price > 0;

  return (
    <div className="vignette relative -m-4 min-h-[calc(100vh-120px)] overflow-hidden rounded-2xl sm:-m-6">
      <StainedGlass />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/75 to-ink-950/95" />

      <div className="relative z-10 p-5 sm:p-8">
        <SectionTitle
          icon={Church}
          title="Церковь Первого Света"
          sub="Жрецы возвращают силы тем, кто щедр к храму"
          right={
            <span className="rounded-lg border border-gold-500/25 bg-ink-900/80 px-3 py-1.5">
              <Gold amount={player.gold} className="text-sm" />
            </span>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* алтарь */}
          <div className="panel overflow-hidden">
            <div className="relative flex flex-col items-center px-5 py-8 text-center">
              <div className="anim-float relative mb-4 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gold-400/15 blur-2xl" />
                <Sparkles className="animate-pulse-glow h-12 w-12 text-gold-300" />
              </div>
              <h2 className="font-display text-xl font-bold text-gold-200">Благословение исцеления</h2>
              <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-white/55">
                Жрец кладёт ладони вам на плечи: здоровье и мана восстановятся мгновенно.
                Размер пожертвования растёт вместе с вашей силой — чем больше запас жизни у героя,
                тем дороже чудо.
              </p>

              <div className="mt-5 w-full max-w-md space-y-2.5">
                <Bar value={player.hp} max={stats.hp} from="#b91c1c" to="#ef4444" label="Здоровье" height="h-4" />
                <Bar value={player.mana} max={manaMax} from="#3730a3" to="#818cf8" label="Мана" height="h-3.5" />
              </div>

              <button
                onClick={churchHeal}
                disabled={!canPay}
                className={cn(
                  "btn mt-5 w-full max-w-md px-6 py-3.5 text-sm uppercase tracking-[0.16em]",
                  canPay ? "btn-gold animate-pulse-glow" : "btn-ghost"
                )}
              >
                <HeartPulse className="h-4 w-4" />
                {price === 0
                  ? "Вы полны сил"
                  : player.gold < price
                    ? `Нужно ${price} золота`
                    : `Пожертвовать ${price} золота`}
              </button>

              <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-1.5 text-[11px]">
                <Info label="Не хватает HP" value={`${Math.round(missing)}`} />
                <Info label="Цена" value={price === 0 ? "—" : `${price}`} />
                <Info
                  label="Отдых займёт"
                  value={
                    missing <= 0
                      ? "—"
                      : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
                  }
                />
              </div>
            </div>
          </div>

          {/* лазарет: отдых и зелья */}
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                <Hourglass className="h-4 w-4 text-gold-400" />
                Естественный отдых
              </div>
              <p className="text-[11.5px] leading-relaxed text-white/50">
                В городе герой восстанавливает{" "}
                <b className="text-white/80">1/{REGEN_PER_SEC_DIV} максимального здоровья в секунду</b> —
                полное восстановление с нуля занимает 5 минут. Мана течёт вдвое быстрее. Отдых идёт
                везде: в лавке, гильдии и на площади.
              </p>
              <div className="mt-2.5 rounded-lg border border-white/[0.07] bg-black/30 px-3 py-2 font-mono2 text-[11px] text-white/65">
                +{(stats.hp / REGEN_PER_SEC_DIV).toFixed(1)} HP/сек · +
                {((manaMax / REGEN_PER_SEC_DIV) * 2).toFixed(1)} MP/сек
              </div>
            </div>

            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                <FlaskConical className="h-4 w-4 text-emerald-400" />
                Выпить зелье
              </div>
              <p className="mb-2.5 text-[11px] leading-relaxed text-white/45">
                Зелья работают и в городе — так отдых выходит намного короче.
              </p>
              <div className="space-y-1.5">
                {(["hp_s", "hp_m", "hp_l", "mp_s", "mp_m", "mp_l"] as const).map((id) => {
                  const p = POTIONS[id];
                  const count = potions[id];
                  const isHp = p.kind === "hp";
                  const useless = isHp ? player.hp >= stats.hp : player.mana >= manaMax;
                  return (
                    <button
                      key={id}
                      onClick={() => usePotion(id)}
                      disabled={count <= 0 || useless}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[11px] transition disabled:opacity-40",
                        isHp
                          ? "border-blood-500/20 bg-blood-500/[0.05] hover:border-blood-500/40"
                          : "border-indigo-400/20 bg-indigo-400/[0.05] hover:border-indigo-400/40"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {isHp ? (
                          <HeartPulse className="h-3.5 w-3.5 shrink-0 text-blood-400" />
                        ) : (
                          <WandSparkles className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
                        )}
                        <span className="truncate text-white/80">{p.name}</span>
                      </span>
                      <span className="font-mono2 shrink-0 text-[10px] text-white/45">
                        +{p.power} · ×{count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1.5">
      <div className="text-[9.5px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="font-mono2 mt-0.5 text-xs font-semibold text-white/85">{value}</div>
    </div>
  );
}

/** Витражное окно храма — чистый SVG */
function StainedGlass() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 600"
      aria-hidden
    >
      <defs>
        <radialGradient id="ch-glow" cx="50%" cy="34%" r="60%">
          <stop offset="0%" stopColor="#f4d78a" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#b9852e" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#07090d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ch-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4d78a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f4d78a" stopOpacity="0" />
        </linearGradient>
        <filter id="ch-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <rect width="800" height="600" fill="#0a0c12" />

      {/* арки храма */}
      <g stroke="#2a3245" strokeWidth="3" fill="none" opacity="0.8">
        <path d="M120 600 V260 a90 90 0 0 1 180 0 V600" />
        <path d="M500 600 V260 a90 90 0 0 1 180 0 V600" />
      </g>

      {/* центральная розетка-витраж */}
      <g transform="translate(400 210)">
        <circle r="128" fill="url(#ch-glow)" filter="url(#ch-blur)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const colors = ["#d9a441", "#8b5cf6", "#3b82f6", "#22c55e", "#f472b6", "#f59e0b"];
          return (
            <path
              key={i}
              d={`M0 0 L${Math.cos(a) * 104} ${Math.sin(a) * 104} A104 104 0 0 1 ${
                Math.cos(a + Math.PI / 6) * 104
              } ${Math.sin(a + Math.PI / 6) * 104} Z`}
              fill={colors[i % colors.length]}
              fillOpacity="0.22"
              stroke="#1b2130"
              strokeWidth="2.5"
            />
          );
        })}
        <circle r="104" fill="none" stroke="#3a4763" strokeWidth="4" />
        <circle r="34" fill="#f4d78a" fillOpacity="0.28" stroke="#3a4763" strokeWidth="3" />
        <path
          d="M0 -20 V26 M-14 -6 H14"
          stroke="#f4d78a"
          strokeOpacity="0.85"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>

      {/* световые лучи на пол */}
      <g opacity="0.5">
        <path d="M400 210 L180 600 L320 600 Z" fill="url(#ch-ray)" />
        <path d="M400 210 L480 600 L620 600 Z" fill="url(#ch-ray)" />
      </g>

      {/* свечи */}
      <g fill="#f4d78a" opacity="0.8">
        {[150, 230, 570, 650].map((x, i) => (
          <g key={x}>
            <rect x={x - 4} y={470 + (i % 2) * 14} width="8" height="46" fill="#2a3245" />
            <circle cx={x} cy={466 + (i % 2) * 14} r="5" filter="url(#ch-blur)" />
            <circle cx={x} cy={466 + (i % 2) * 14} r="2.5" />
          </g>
        ))}
      </g>
    </svg>
  );
}
