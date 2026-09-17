import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { useGame } from "../game/store";
import { cn } from "../utils/cn";

export function Toaster() {
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const Icon = toast.kind === "good" ? CheckCircle2 : toast.kind === "bad" ? TriangleAlert : Info;

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] w-[min(92vw,420px)] -translate-x-1/2">
      <div
        key={toast.id}
        className={cn(
          "panel anim-pop pointer-events-auto flex items-start gap-2.5 px-4 py-3",
          toast.kind === "good" && "border-emerald-400/40",
          toast.kind === "bad" && "border-blood-500/40"
        )}
        onClick={clearToast}
      >
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            toast.kind === "good" ? "text-emerald-400" : toast.kind === "bad" ? "text-blood-400" : "text-gold-400"
          )}
        />
        <p className="text-[12px] leading-snug text-white/80">{toast.text}</p>
      </div>
    </div>
  );
}
