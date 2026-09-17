import {
  Bug,
  Coins,
  Crown,
  Droplets,
  Feather,
  Flame,
  Ghost,
  Hammer,
  Moon,
  Mountain,
  PawPrint,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Swords,
  VenetianMask,
  Wind,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GRADE_COLOR } from "../game/data";
import type { Grade } from "../game/types";
import { cn } from "../utils/cn";

export const MONSTER_ICONS: Record<string, LucideIcon> = {
  droplets: Droplets,
  paw: PawPrint,
  sparkles: Sparkles,
  venetian: VenetianMask,
  bug: Bug,
  mountain: Mountain,
  swords: Swords,
  feather: Feather,
  hammer: Hammer,
  ghost: Ghost,
  moon: Moon,
  skull: Skull,
  wind: Wind,
  flame: Flame,
  crown: Crown,
};

export const SPELL_ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  sparkles: Sparkles,
  zap: Zap,
};

export function IconByName({
  name,
  className,
  map = MONSTER_ICONS,
}: {
  name: string;
  className?: string;
  map?: Record<string, LucideIcon>;
}) {
  const C = map[name] ?? Sword;
  return <C className={className} />;
}

export function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-center justify-center rounded-md border font-bold leading-none",
        size === "sm" && "h-5 min-w-5 px-1 text-[10px]",
        size === "md" && "h-6 min-w-6 px-1.5 text-xs",
        size === "lg" && "h-8 min-w-8 px-2 text-sm"
      )}
      style={{
        color: GRADE_COLOR[grade],
        borderColor: `${GRADE_COLOR[grade]}55`,
        background: `${GRADE_COLOR[grade]}14`,
        textShadow: `0 0 12px ${GRADE_COLOR[grade]}88`,
      }}
    >
      {grade}
    </span>
  );
}

export function Gold({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold text-gold-300", className)}>
      <Coins className="h-4 w-4 text-gold-400" />
      <span className="font-mono2">{amount.toLocaleString("ru-RU")}</span>
    </span>
  );
}

export function Bar({
  value,
  max,
  from,
  to,
  className,
  label,
  showText = true,
  height = "h-3.5",
}: {
  value: number;
  max: number;
  from: string;
  to: string;
  className?: string;
  label?: string;
  showText?: boolean;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const low = pct <= 25;
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/45">
          <span>{label}</span>
        </div>
      )}
      <div className={cn("bar", height)}>
        <div
          className="bar-fill h-full"
          style={{
            width: `${pct}%`,
            background: low
              ? "linear-gradient(90deg,#f97316,#ef4444)"
              : `linear-gradient(90deg,${from},${to})`,
          }}
        />
        {showText && (
          <span className="absolute inset-0 flex items-center justify-center font-mono2 text-[10px] font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {Math.round(value)} / {Math.round(max)}
          </span>
        )}
      </div>
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  sub,
  right,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/10">
          <Icon className="h-5 w-5 text-gold-400" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold tracking-wide text-gold-300">{title}</h2>
          {sub && <p className="text-xs text-white/45">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StatLine({ icon: Icon, label, value, accent }: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-[11px] text-white/55">
        <Shield className="hidden" />
        <Icon className="h-3.5 w-3.5" style={{ color: accent ?? "#e7bc5e" }} />
        {label}
      </span>
      <span className="font-mono2 text-[11px] font-semibold text-white/85">{value}</span>
    </div>
  );
}
