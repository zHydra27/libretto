import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ExamStatus } from "../types";
import { STATUS_META, STATUS_MENU_ORDER } from "../types";
import { Icon, type IconName } from "./Icon";

/* ---------- contatore animato ---------- */

export function CountUp({
  value,
  decimals = 0,
  duration = 950,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setV(from + (value - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text =
    decimals > 0 ? v.toFixed(decimals).replace(".", ",") : String(Math.round(v));
  return <span className={className}>{text}</span>;
}

/* ---------- anello di avanzamento ---------- */

export function ProgressRing({
  pct,
  size = 158,
  stroke = 13,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const gid = `ring-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const [off, setOff] = useState(c);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOff(c * (1 - clamped / 100)));
    return () => cancelAnimationFrame(id);
  }, [clamped, c]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-pine-500)" />
            <stop offset="100%" stopColor="var(--color-amber-500)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-mist)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ---------- barra lineare ---------- */

export function ProgressBar({
  pct,
  color = "var(--color-pine-600)",
  className = "",
}: {
  pct: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-mist ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

/* ---------- menu di stato ---------- */

export function StatusMenu({
  value,
  onChange,
  align = "left",
}: {
  value: ExamStatus;
  onChange: (s: ExamStatus) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const meta = STATUS_META[value];
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:brightness-95 active:scale-95 ${meta.chip}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
        <Icon
          name="chevron"
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className={`anim-pop absolute z-40 mt-1.5 w-48 overflow-hidden rounded-lg border border-line bg-card shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {STATUS_MENU_ORDER.map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                role="option"
                aria-selected={s === value}
                onClick={() => {
                  setOpen(false);
                  if (s !== value) onChange(s);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-mist"
              >
                <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                <span className="flex-1">{m.label}</span>
                {s === value && <Icon name="check" size={14} className="text-pine-600" />}
              </button>
            );
          })}
          <div className="border-t border-line bg-mist/70 px-3 py-1.5 text-[11px] leading-snug text-faint">
            «Superato» si imposta registrando il voto
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- stato vuoto ---------- */

export function EmptyState({
  icon,
  title,
  hint,
  children,
}: {
  icon: IconName;
  title: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div className="anim-in flex flex-col items-center rounded-xl border border-dashed border-line bg-card/60 px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mist text-soft">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-soft">{hint}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
