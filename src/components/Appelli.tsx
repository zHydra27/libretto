import { useMemo } from "react";
import type { Exam } from "../types";
import { daysUntil, fmtDay, fmtMonthShort, fmtMonthYear, isFutureOrToday, relDays } from "../lib/dates";
import { useApp } from "../store";
import { Icon } from "./Icon";
import { EmptyState } from "./ui";

function DateBlock({ date, tone = "default" }: { date: string; tone?: "default" | "danger" }) {
  return (
    <span
      className={`num flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5 ${
        tone === "danger"
          ? "border-coral-100 bg-coral-100/50 text-coral-600"
          : "border-line bg-paper text-ink"
      }`}
    >
      <span className="text-xl font-bold leading-tight">{fmtDay(date)}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">
        {fmtMonthShort(date)}
      </span>
    </span>
  );
}

function DaysPill({ date }: { date: string }) {
  const d = daysUntil(date);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        d === 0
          ? "bg-amber-500 text-pine-950"
          : d <= 3
            ? "bg-amber-100 text-amber-900"
            : "bg-mist text-soft"
      }`}
    >
      {d === 0 && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine-950" />}
      {relDays(date)}
    </span>
  );
}

const ghostBtn =
  "rounded-md p-1.5 text-soft transition hover:bg-mist hover:text-ink active:scale-90";

export function Appelli({
  onEdit,
  onGrade,
  onBook,
}: {
  onEdit: (e: Exam) => void;
  onGrade: (e: Exam) => void;
  onBook: (e: Exam) => void;
}) {
  const { exams } = useApp();

  const upcoming = useMemo(
    () =>
      exams
        .filter((e) => e.status === "booked" && e.date && isFutureOrToday(e.date))
        .sort((a, b) => (a.date! < b.date! ? -1 : 1)),
    [exams],
  );
  const overdue = useMemo(
    () =>
      exams
        .filter((e) => e.status === "booked" && e.date && !isFutureOrToday(e.date))
        .sort((a, b) => (a.date! < b.date! ? -1 : 1)),
    [exams],
  );
  const studying = useMemo(() => exams.filter((e) => e.status === "study"), [exams]);

  const months = useMemo(() => {
    const m = new Map<string, Exam[]>();
    for (const e of upcoming) {
      const k = e.date!.slice(0, 7);
      const list = m.get(k);
      if (list) list.push(e);
      else m.set(k, [e]);
    }
    return [...m.entries()];
  }, [upcoming]);

  const nothing = upcoming.length === 0 && overdue.length === 0 && studying.length === 0;

  return (
    <div>
      <header className="anim-in">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-soft">
          {upcoming.length} prenotat{upcoming.length === 1 ? "o" : "i"} · {studying.length} in
          studio
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Appelli</h1>
        <p className="mt-1.5 text-sm text-soft">
          Date prenotate, conti alla rovescia e appelli da sistemare.
        </p>
      </header>

      {nothing ? (
        <div className="mt-8">
          <EmptyState
            icon="calendar"
            title="Nessun appello all'orizzonte"
            hint="Aggiungi esami al libretto e segnali come «Prenotato» con una data: compariranno qui in ordine cronologico."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          {/* in arrivo */}
          {upcoming.length > 0 && (
            <section className="anim-in overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,39,34,0.06)]" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="font-display text-base font-bold">In arrivo</h2>
                <span className="num rounded-full bg-mist px-2.5 py-0.5 text-xs font-bold text-soft">
                  {upcoming.length}
                </span>
              </div>
              {months.map(([key, list]) => (
                <div key={key}>
                  <p className="num bg-paper/70 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                    {fmtMonthYear(list[0].date!)}
                  </p>
                  <ul className="divide-y divide-line">
                    {list.map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-mist/40"
                      >
                        <DateBlock date={e.date!} />
                        <div className="min-w-[160px] flex-1">
                          <p className="text-[15px] font-semibold leading-snug">{e.name}</p>
                          <p className="num text-[11px] text-faint">{e.cfu} CFU</p>
                        </div>
                        <DaysPill date={e.date!} />
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => onGrade(e)}
                            className="rounded-lg border border-leaf-600/40 px-3 py-1.5 text-xs font-bold text-leaf-700 transition hover:bg-leaf-100 active:scale-95"
                          >
                            Registra esito
                          </button>
                          <button
                            onClick={() => onEdit(e)}
                            aria-label={`Modifica ${e.name}`}
                            className={ghostBtn}
                          >
                            <Icon name="pencil" size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* scaduti */}
          {overdue.length > 0 && (
            <section className="anim-in overflow-hidden rounded-xl border border-coral-100 bg-card shadow-[0_1px_2px_rgba(27,39,34,0.06)]" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center gap-2 border-b border-coral-100 bg-coral-100/40 px-5 py-3.5">
                <Icon name="alert" size={16} className="text-coral-600" />
                <h2 className="font-display text-base font-bold text-coral-700">
                  Scaduti senza esito
                </h2>
                <span className="num ml-auto rounded-full bg-coral-100 px-2.5 py-0.5 text-xs font-bold text-coral-700">
                  {overdue.length}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {overdue.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
                  >
                    <DateBlock date={e.date!} tone="danger" />
                    <div className="min-w-[160px] flex-1">
                      <p className="text-[15px] font-semibold leading-snug">{e.name}</p>
                      <p className="num text-[11px] text-coral-600">
                        {relDays(e.date!)} · nessun esito registrato
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => onGrade(e)}
                        className="rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-coral-700 active:scale-95"
                      >
                        Com'è andata?
                      </button>
                      <button
                        onClick={() => onEdit(e)}
                        aria-label={`Modifica ${e.name}`}
                        className={ghostBtn}
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* in studio */}
          {studying.length > 0 && (
            <section className="anim-in overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,39,34,0.06)]" style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="font-display text-base font-bold">In studio</h2>
                <span className="num rounded-full bg-mist px-2.5 py-0.5 text-xs font-bold text-soft">
                  {studying.length}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {studying.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-mist/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-700">
                      <Icon name="book" size={16} />
                    </span>
                    <div className="min-w-[160px] flex-1">
                      <p className="text-[15px] font-semibold leading-snug">{e.name}</p>
                      <p className="num text-[11px] text-faint">{e.cfu} CFU</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => onBook(e)}
                        className="rounded-lg border border-amber-500/60 bg-amber-100/60 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 active:scale-95"
                      >
                        Prenota appello
                      </button>
                      <button
                        onClick={() => onEdit(e)}
                        aria-label={`Modifica ${e.name}`}
                        className={ghostBtn}
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
