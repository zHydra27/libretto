import { useMemo } from "react";
import { uid, useApp } from "../store";
import { STATUS_META, type Exam, type ViewId } from "../types";
import { COURSES, TOTAL_CFU, missingPrerequisites, type Course } from "../data/courses";

const YEAR_LABEL: Record<number, string> = {
  1: "1º anno",
  2: "2º anno",
  3: "3º anno",
  0: "Trasversali / a scelta",
};

export function Plan({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { exams, addExam, pushToast } = useApp();

  const acquired = useMemo(
    () => exams.filter((e) => e.status === "passed").reduce((s, e) => s + e.cfu, 0),
    [exams],
  );
  const pct = TOTAL_CFU > 0 ? Math.min(100, Math.round((acquired / TOTAL_CFU) * 100)) : 0;

  const inLibretto = (name: string): Exam | undefined =>
    exams.find((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase());

  const addToLibretto = (c: Course) => {
    addExam({
      id: uid(),
      name: c.name,
      cfu: c.cfu,
      year: c.year === 0 ? 1 : c.year,
      semester: 1,
      status: "todo",
      notes: c.prerequisites.length
        ? `Propedeuticità: ${c.prerequisites.join(", ")}`
        : undefined,
    });
    pushToast(`«${c.name}» aggiunto al libretto`, { kind: "success" });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onNavigate("dashboard")}
          className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-soft transition hover:bg-mist"
        >
          ← Dashboard
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Piano di studi</h1>
          <p className="text-sm text-soft">
            Tutti gli esami del corso di laurea, con CFU e propedeuticità.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">CFU acquisiti</span>
          <span className="font-display text-lg font-bold">
            {acquired} / {TOTAL_CFU}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-leaf-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-soft">{pct}% del percorso completato</p>
      </section>

      {[1, 2, 3, 0].map((year) => (
        <section key={year}>
          <h2 className="mb-3 font-display text-lg font-bold">{YEAR_LABEL[year]}</h2>
          <div className="space-y-2">
            {COURSES.filter((c) => c.year === year).map((c) => {
              const exam = inLibretto(c.name);
              const missing = missingPrerequisites(c.name, exams);
              return (
                <div
                  key={c.name}
                  className="rounded-xl border border-line bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-soft">
                      {c.cfu} CFU
                    </span>
                    <span className="ml-auto">
                      {exam ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_META[exam.status].chip}`}
                        >
                          {STATUS_META[exam.status].label}
                        </span>
                      ) : (
                        <button
                          onClick={() => addToLibretto(c)}
                          className="rounded-md bg-amber-500 px-3 py-1 text-xs font-bold text-pine-950 transition hover:bg-amber-400 active:scale-95"
                        >
                          + Libretto
                        </button>
                      )}
                    </span>
                  </div>

                  {c.prerequisites.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.prerequisites.map((p) => {
                        const ok = !missing.includes(p);
                        return (
                          <span
                            key={p}
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              ok ? "bg-leaf-100 text-leaf-700" : "bg-coral-100 text-coral-700"
                            }`}
                          >
                            {ok ? "✓" : "🔒"} {p}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {missing.length > 0 && (
                    <p className="mt-2 text-xs text-coral-700">
                      Bloccato: supera prima {missing.join(", ")}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
