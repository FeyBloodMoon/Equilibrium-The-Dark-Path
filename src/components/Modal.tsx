import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** max-width класс контейнера */
  width?: string;
  className?: string;
}

/**
 * Модальное окно через портал в document.body.
 * Это критично: у панелей и шапки есть backdrop-filter, который делает их
 * containing block для position:fixed — без портала окно «застревает» внутри панели.
 */
export function Modal({ onClose, children, width = "max-w-2xl", className }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "panel anim-pop my-auto flex max-h-[min(92vh,900px)] w-full flex-col overflow-hidden",
          width,
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  accent,
  icon,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-5 sm:py-3.5"
      style={accent ? { background: `linear-gradient(90deg, ${accent}22, transparent)` } : undefined}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon}
        <div className="min-w-0">
          <h2 className="font-display truncate text-base font-bold" style={{ color: accent ?? "#f4d78a" }}>
            {title}
          </h2>
          {subtitle && <div className="mt-0.5 text-[11.5px] leading-snug text-white/50">{subtitle}</div>}
        </div>
      </div>
      <button onClick={onClose} className="btn btn-ghost h-8 w-8 shrink-0 rounded-lg p-0" title="Закрыть (Esc)">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto p-4 sm:p-5", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3 sm:px-5",
        className
      )}
    >
      {children}
    </div>
  );
}
