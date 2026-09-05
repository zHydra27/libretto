import { useMemo } from "react";
import type { ViewId } from "../types";
import { computeStats } from "../lib/calc";
import { isFutureOrToday } from "../lib/dates";
import { useApp } from "../store";
import { Icon, type IconName } from "./Icon";

const NAV: { id: ViewId; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Panoramica", icon: "grid" },
  { id: "libretto", label: "Libretto", icon: "book" },
  { id: "appelli", label: "Appelli", icon: "calendar" },
  { id: "settings", label: "Impostazioni", icon: "sliders" },
];

export function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
}: {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { exams, settings } = useApp();
  const s = useMemo(() => computeStats(exams, settings), [exams, settings]);
  const bookedCount = useMemo(
    () => exams.filter((e) => e.status === "booked" && e.date && isFutureOrToday(e.date)).length,
    [exams],
  );

  return (
    <>
      {open && (
        <div
          className="anim-fade fixed inset-0 z-40 bg-pine-950/60 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`side-tex fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-pine-950 text-paper transition-transform duration-300 ease-out md:z-30 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigazione principale"
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500 text-pine-950 shadow-[0_2px_10px_rgba(227,155,38,0.35)]">
            <Icon name="cap" size={20} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold leading-none tracking-tight">
              Libretto
            </span>
            <span className="mt-1 block text-[9.5px] uppercase tracking-[0.2em] text-paper/45">
              carriera universitaria
            </span>
          </span>
          <button
            onClick={onClose}
            aria-label="Chiudi menu"
            className="rounded-md p-1.5 text-paper/60 transition hover:bg-pine-800 hover:text-paper md:hidden"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-pine-800 text-amber-400 shadow-[inset_2px_0_0_var(--color-amber-500)]"
                    : "text-paper/60 hover:bg-pine-800/60 hover:text-paper"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={17}
                  className={`transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`}
                />
                {item.label}
                {item.id === "appelli" && bookedCount > 0 && (
                  <span className="num ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-pine-950">
                    {bookedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 px-4 pb-4">
          <div className="rounded-lg border border-white/10 bg-pine-900 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-paper/45">
              Avanzamento
            </p>
            <p className="num mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-paper">{Math.round(s.pct)}%</span>
              <span className="text-[10px] text-paper/45">
                {s.cfuPassed}/{settings.targetCfu} CFU
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pine-500 to-amber-500 transition-all duration-700"
                style={{ width: `${Math.min(100, s.pct)}%` }}
              />
            </div>
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-paper/35">
            I dati restano nel tuo browser. Niente account, niente cloud.
          </p>
        </div>
      </aside>
    </>
  );
}
