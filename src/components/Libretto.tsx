import { useMemo, useState } from "react";
import type { Exam, ExamStatus } from "../types";
import { fmtGrade, gradeValue, SEMESTER_LABEL, STATUS_META } from "../types";
import { fmtDate, isFutureOrToday } from "../lib/dates";
import { useApp } from "../store";
import { Icon } from "./Icon";
import { EmptyState, ProgressBar, StatusMenu } from "./ui";

type Filter = "all" | ExamStatus;
type Sort = "year" | "name" | "date" | "grade";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "todo", label: STATUS_META.todo.label },
  { id: "study", label: STATUS_META.study.label },
  { id: "booked", label: STATUS_META.booked.label },
  { id: "passed", label: STATUS_META.passed.label },
  { id: "failed", label: STATUS_META.failed.label },
];

export function Libretto({
  onNew,
  onEdit,
  onGrade,
}: {
  onNew: () => void;
  onEdit: (e: Exam) => void;
  onGrade: (e: Exam) => void;
}) {
  const { exams, updateExam, deleteExam, pushToast, loadSample } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("year");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const arr = exams.filter(
      (e) =>
        (filter === "all" || e.status === filter) &&
        (!query || e.name.toLowerCase().includes(query)),
    );
    switch (sort) {
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name, "it"));
      case "date":
        return arr.sort((a, b) => ((a.date ?? "9999") < (b.date ?? "9999") ? -1 : 1));
      case "grade":
        return arr.sort((a, b) => gradeValue(b) - gradeValue(a));
      default:
        return arr.sort(
          (a, b) => a.year - b.year || a.name.localeCompare(b.name, "it"),
        );
    }
  }, [exams, q, filter, sort]);

  const groups = useMemo(() => {
    const m = new Map<number, Exam[]>();
    for (const e of filtered) {
      const list = m.get(e.year) ?? [];
      list.push(e);
      m.set(e.year, list);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: exams.length,
      todo: 0,
      study: 0,
      booked: 0,
      passed: 0,
      failed: 0,
    };
    for (const e of exams) c[e.status] += 1;
    return c;
  }, [exams]);

  const changeStatus = (e: Exam, s: ExamStatus) => {
    updateExam(e.id, {
      status: s,
      ...(s !== "passed" ? { grade: undefined, lode: undefined } : {}),
    });
    pushToast(`«${e.name}» → ${STATUS_META[s].label}`, { kind: "info" });
  };

  return (
    <div>
      <header className="anim-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-[11px] uppercase tracking-[0.18em] text-soft">
            {exams.length} corsi · {exams.reduce((s, e) => s + e.cfu, 0)} CFU in piano
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Libretto</h1>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-pine-950 shadow-sm transition hover:bg-amber-400 active:scale-95"
        >
          <Icon name="plus" size={16} strokeWidth={2.5} />
          Nuovo esame
        </button>
      </header>

      {exams.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="book"
            title="Il libretto è vuoto"
            hint="Aggiungi il primo esame del tuo piano di studi, oppure parti da una carriera d'esempio per esplorare l'app."
          >
            <button
              onClick={onNew}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-pine-950 transition hover:bg-amber-400 active:scale-95"
            >
              <Icon name="plus" size={15} strokeWidth={2.5} /> Aggiungi esame
            </button>
            <button
              onClick={loadSample}
              className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold transition hover:bg-mist active:scale-95"
            >
              Carica esempio
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          {/* toolbar */}
          <div className="anim-in mt-6 space-y-3" style={{ animationDelay: "60ms" }}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Icon
                  name="search"
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  className="field pl-9"
                  placeholder="Cerca un corso…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-soft">
                Ordina
                <select
                  className="field w-auto py-1.5 text-[13px]"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                >
                  <option value="year">per anno</option>
                  <option value="name">per nome</option>
                  <option value="date">per data appello</option>
                  <option value="grade">per voto</option>
                </select>
              </label>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      active
                        ? "bg-pine-900 text-paper shadow-sm"
                        : "border border-line bg-card text-soft hover:bg-mist"
                    }`}
                  >
                    {f.id !== "all" && counts[f.id] > 0 && (
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[f.id as ExamStatus].dot}`} />
                    )}
                    {f.label}
                    <span className={`num ${active ? "text-amber-400" : "text-faint"}`}>
                      {counts[f.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* lista */}
          {filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon="search"
                title="Nessun esame trovato"
                hint="Prova a cambiare ricerca o filtro: il corso che cerchi potrebbe essere in un altro stato."
              >
                <button
                  onClick={() => {
                    setQ("");
                    setFilter("all");
                  }}
                  className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold transition hover:bg-mist active:scale-95"
                >
                  Azzera filtri
                </button>
              </EmptyState>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {groups.map(([year, list], gi) => {
                const cfuYear = list.reduce((s, e) => s + e.cfu, 0);
                const cfuOk = list
                  .filter((e) => e.status === "passed")
                  .reduce((s, e) => s + e.cfu, 0);
                return (
                  <section
                    key={year}
                    className="anim-in"
                    style={{ animationDelay: `${100 + gi * 70}ms` }}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-lg font-bold">Anno {year}</h2>
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          pct={cfuYear ? (cfuOk / cfuYear) * 100 : 0}
                          className="w-28"
                          color="var(--color-leaf-600)"
                        />
                        <span className="num text-[11px] text-faint">
                          {cfuOk}/{cfuYear} CFU
                        </span>
                      </div>
                    </div>

                    <ul className="divide-y divide-line rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,39,34,0.06)]">
                      {list.map((e) => {
                        const overdue =
                          e.status === "booked" && e.date && !isFutureOrToday(e.date);
                        return (
                          <li
                            key={e.id}
                            className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors first:rounded-t-[11px] last:rounded-b-[11px] hover:bg-mist/50"
                          >
                            <div className="min-w-[190px] flex-1">
                              <p className="truncate text-[15px] font-semibold leading-snug">
                                {e.name}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                                <span className="num">{SEMESTER_LABEL[e.semester]}</span>
                                {e.notes && (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span className="max-w-[260px] truncate italic" title={e.notes}>
                                      {e.notes}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>

                            <span className="num w-14 text-sm">
                              <strong>{e.cfu}</strong>{" "}
                              <span className="text-[11px] text-faint">CFU</span>
                            </span>

                            <StatusMenu value={e.status} onChange={(s) => changeStatus(e, s)} />

                            <span
                              className={`num hidden w-24 text-xs sm:block ${
                                overdue ? "font-bold text-coral-600" : "text-soft"
                              }`}
                              title={overdue ? "Appello scaduto senza esito" : undefined}
                            >
                              {e.date ? fmtDate(e.date) : "—"}
                            </span>

                            <span className="w-11 text-center">
                              {e.status === "passed" ? (
                                <span className="num inline-block rounded-md bg-leaf-100 px-1.5 py-0.5 text-[13px] font-bold text-leaf-700">
                                  {fmtGrade(e)}
                                </span>
                              ) : (
                                <span className="text-faint">—</span>
                              )}
                            </span>

                            <span className="ml-auto flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                              {e.status !== "passed" && (
                                <button
                                  onClick={() => onGrade(e)}
                                  title="Registra esito"
                                  aria-label={`Registra esito di ${e.name}`}
                                  className="rounded-md p-1.5 text-soft transition hover:bg-leaf-100 hover:text-leaf-700 active:scale-90"
                                >
                                  <Icon name="check" size={15} strokeWidth={2.5} />
                                </button>
                              )}
                              <button
                                onClick={() => onEdit(e)}
                                title="Modifica"
                                aria-label={`Modifica ${e.name}`}
                                className="rounded-md p-1.5 text-soft transition hover:bg-mist hover:text-ink active:scale-90"
                              >
                                <Icon name="pencil" size={15} />
                              </button>
                              <button
                                onClick={() => deleteExam(e.id)}
                                title="Elimina"
                                aria-label={`Elimina ${e.name}`}
                                className="rounded-md p-1.5 text-soft transition hover:bg-coral-100 hover:text-coral-700 active:scale-90"
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
              <p className="num pb-2 text-center text-[11px] text-faint">
                {filtered.length} {filtered.length === 1 ? "esame visualizzato" : "esami visualizzati"} ·{" "}
                {filtered.reduce((s, e) => s + e.cfu, 0)} CFU
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
