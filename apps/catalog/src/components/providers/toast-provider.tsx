"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, Info, TriangleAlert, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "info" | "warning" | "error" | "favorite";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: Check,
  info: Info,
  warning: TriangleAlert,
  error: TriangleAlert,
  favorite: Heart,
} as const;

const ACCENT: Record<ToastVariant, string> = {
  success: "text-success",
  info: "text-brand-deep",
  warning: "text-warning",
  error: "text-danger",
  favorite: "text-brand-deep",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "success", duration = 3400 }: ToastOptions) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:items-end sm:p-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className={cn(
                "animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-lg",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent",
                  ACCENT[t.variant],
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden fill={t.variant === "favorite" ? "currentColor" : "none"} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
