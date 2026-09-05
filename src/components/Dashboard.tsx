import { useMemo, type ReactNode } from "react";
import type { Exam, ViewId } from "../types";
import { fmtGrade, gradeValue } from "../types";
import { computeStats, fmtNum, gradeColor } from "../lib/calc";
import { daysUntil, fmtDate, fmtDay, fmtMonthShort, fmtToday, relDays, sessionName } from "../lib/dates";
import { useApp } from "../store";
import { Icon } from "./Icon";
import { CountUp, EmptyState, ProgressBar, ProgressRing } from "./ui";

function Card({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <section
      className={`anim-in rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(27,39,34,0.06)] transition-shadow duration-300 hover:shadow-lg hover:shadow-pine-900/5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="num text-[11px] uppercase tracking-[0.16em] text-soft">{children}</p>
  );
}

function GradeBars({ exams }: { exams: Exam[] }) {
  return (
    <div className="mt-6">
      <div className="flex h-32 items-end gap-1.5 overflow-x-auto border-b border-line pb-px">
        {exams.map((e, i) => {
          const v = gradeValue(e);
          const h = ((v - 17) / 14) * 100;
          return (
            <div
              key={e.id}
              className="group relative flex h-full w-9 shrink-0 flex-col items-center justify-end"
            >
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-pine-950 px-2 py-1 text-[11px] font-medium text-paper opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {e.name} · {fmtGrade(e)}/30
              </div>
              <span className="num mb-1 text-[10px] font-semibold text-soft">
                {fmtGrade(e)}
              </span>
              <div
                className="bar-grow w-full rounded-t-[5px] transition-[filter] group-hover:brightness-110"
                style={{
                  height: `${Math.min(h, 92)}%`,
                  background: gradeColor(v),
                  animationDelay: `${120 + i * 45}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 overflow-x-auto">
        {exams.map((e) => (
          <span
            key={e.id}
            className="w-9 shrink-0 truncate text-center text-[10px] text-faint"
            title={e.name}
          >
            {e.name.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  onNavigate,
  onNew,
}: {
  onNavigate: (v: ViewId) => void;
  onNew: () => void;
}) {
  const { exams, settings } = useApp();
  const s = useMemo(() => computeStats(exams, settings), [exams, settings]);

  const estDecimals = s.estimated != null && s.estimated % 1 !== 0 ? 1 : 0;
  const gap =
    s.estimated != null ? Math.round((settings.targetGrade - s.estimated) * 10) / 10 : null;

  return (
    <div>
      <header className="anim-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-[11px] uppercase tracking-[0.18em] text-soft">
            {fmtToday()} · {sessionName()}
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-[44px] md:leading-[1.05]">
            Il tuo libretto
          </h1>
          <p className="mt-1.5 text-sm text-soft">
            {settings.course} · {settings.university}
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-pine-950 shadow-sm transition hover:bg-amber-400 active:scale-95"
        >
          <Icon name="plus" size={16} strokeWidth={2.5} />
          Nuovo esame
        </button>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* -------- media + grafico -------- */}
        <Card className="lg:col-span-7" delay={40}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Label>Media ponderata</Label>
              <div className="mt-1 flex items-baseline gap-2">
                {s.weighted != null ? (
                  <>
                    <CountUp
                      value={s.weighted}
                      decimals={2}
                      className="font-display text-6xl font-bold tracking-tight text-pine-800"
                    />
                    <span className="num text-lg text-faint">/30</span>
                  </>
                ) : (
                  <span className="font-display text-6xl font-bold text-faint">—</span>
                )}
              </div>
            </div>
            <div className="num space-y-1 text-right text-[13px] text-soft">
              <p>
                aritmetica <strong className="text-ink">{fmtNum(s.arith, 2)}</strong>
              </p>
              <p>
                esami a verbale <strong className="text-ink">{s.passed.length}</strong>
              </p>
              <p>
                CFU convalidati <strong className="text-ink">{s.cfuPassed}</strong>
              </p>
            </div>
          </div>

          {s.lastPassed && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-700">
              <Icon name="award" size={13} />
              Ultimo verbale: «{s.lastPassed.name}» {fmtGrade(s.lastPassed)}
              {s.lastPassed.date ? ` · ${fmtDate(s.lastPassed.date)}` : ""}
            </p>
          )}

          {s.passed.length ? (
            <GradeBars exams={[...s.passed].sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? -1 : 1))} />
          ) : (
            <p className="mt-6 flex items-center gap-2 rounded-lg bg-mist px-3 py-3 text-sm text-soft">
              <Icon name="info" size={15} />
              Registra il primo voto per vedere l'andamento della media.
            </p>
          )}
        </Card>

        {/* -------- CFU -------- */}
        <Card className="lg:col-span-5" delay={100}>
          <Label>Piano CFU</Label>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing pct={s.pct} size={148} stroke={13}>
              <CountUp
                value={Math.round(s.pct)}
                className="font-display text-[34px] font-bold leading-none text-pine-800"
              />
              <span className="num mt-1 text-[10px] uppercase tracking-wider text-faint">
                su {settings.targetCfu} CFU
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1 space-y-2.5 text-sm">
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-soft">
                  <span className="h-2 w-2 rounded-full bg-leaf-600" /> Superati
                </span>
                <span className="num font-bold">{s.cfuPassed}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-soft">
                  <span className="h-2 w-2 rounded-full bg-steel-600" /> In corso
                </span>
                <span className="num font-bold">{s.cfuInPlay}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-soft">
                  <span className="h-2 w-2 rounded-full bg-line" /> Mancanti
                </span>
                <span className="num font-bold">
                  {Math.max(0, settings.targetCfu - s.cfuPassed - s.cfuInPlay)}
                </span>
              </p>
              {s.counts.failed > 0 && (
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-soft">
                    <span className="h-2 w-2 rounded-full bg-coral-600" /> Respinti
                  </span>
                  <span className="num font-bold text-coral-600">{s.counts.failed}</span>
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
            {s.cfuPlanned} CFU inseriti nel libretto · {exams.length} corsi in piano
          </p>
        </Card>

        {/* -------- obiettivo laurea -------- */}
        <Card className="lg:col-span-5" delay={160}>
          <div className="flex items-center justify-between">
            <Label>Voto di laurea stimato</Label>
            <Icon name="target" size={16} className="text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            {s.estimated != null ? (
              <>
                <CountUp
                  value={s.estimated}
                  decimals={estDecimals}
                  className="font-display text-6xl font-bold tracking-tight"
                />
                <span className="num text-lg text-faint">/110</span>
              </>
            ) : (
              <span className="font-display text-6xl font-bold text-faint">—</span>
            )}
          </div>
          {s.weighted != null && (
            <p className="num mt-2 text-xs text-soft">
              media {fmtNum(s.weighted, 2)} × 110/30 · bonus +{settings.bonus}
            </p>
          )}

          {s.estimated != null && (
            <>
              <div className="relative mt-4">
                <ProgressBar pct={(s.estimated / 110) * 100} color="var(--color-amber-500)" />
                <span
                  className="absolute top-[-4px] h-3.5 w-0.5 rounded bg-pine-900"
                  style={{ left: `${(settings.targetGrade / 110) * 100}%` }}
                  title={`Obiettivo: ${settings.targetGrade}`}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                {gap != null && gap <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-2.5 py-1 font-bold text-leaf-700">
                    <Icon name="check" size={12} strokeWidth={3} />
                    Obiettivo raggiunto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-100 px-2.5 py-1 font-bold text-coral-700">
                    −{fmtNum(gap, 1)} pt dall'obiettivo
                  </span>
                )}
                <span className="num text-faint">obiettivo {settings.targetGrade}</span>
              </div>
            </>
          )}

          {s.recentPassed.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Ultimi verbali
              </p>
              <ul className="space-y-1.5">
                {s.recentPassed.map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5 text-sm">
                    <span className="num rounded-md bg-leaf-100 px-1.5 py-0.5 text-xs font-bold text-leaf-700">
                      {fmtGrade(e)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{e.name}</span>
                    <span className="num text-[11px] text-faint">
                      {e.date ? fmtDate(e.date) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* -------- prossimi appelli -------- */}
        <Card className="lg:col-span-7" delay={220}>
          <div className="flex items-center justify-between">
            <Label>Prossimi appelli</Label>
            <button
              onClick={() => onNavigate("appelli")}
              className="flex items-center gap-1 text-xs font-bold text-pine-600 transition hover:gap-2 hover:text-pine-800"
            >
              Vedi tutti <Icon name="arrow" size={13} />
            </button>
          </div>

          {s.upcoming.length ? (
            <ul className="mt-3 divide-y divide-line">
              {s.upcoming.slice(0, 4).map((e, i) => {
                const d = e.date ? daysUntil(e.date) : 0;
                return (
                  <li
                    key={e.id}
                    className="anim-in flex items-center gap-3.5 py-3"
                    style={{ animationDelay: `${260 + i * 60}ms` }}
                  >
                    {e.date && (
                      <span className="num flex w-12 shrink-0 flex-col items-center rounded-lg border border-line bg-paper py-1">
                        <span className="text-lg font-bold leading-tight">{fmtDay(e.date)}</span>
                        <span className="text-[10px] uppercase tracking-wide text-faint">
                          {fmtMonthShort(e.date)}
                        </span>
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{e.name}</span>
                      <span className="num text-[11px] text-faint">{e.cfu} CFU</span>
                    </span>
                    {e.date && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          d === 0
                            ? "bg-amber-500 text-pine-950"
                            : d <= 3
                              ? "bg-amber-100 text-amber-900"
                              : "bg-mist text-soft"
                        }`}
                      >
                        {d === 0 && (
                          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine-950" />
                        )}
                        {relDays(e.date)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon="calendar"
                title="Nessun appello prenotato"
                hint="Quando prenoti un esame, il conto alla rovescia compare qui."
              >
                <button
                  onClick={() => onNavigate("libretto")}
                  className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-semibold transition hover:bg-mist active:scale-95"
                >
                  Vai al libretto
                </button>
              </EmptyState>
            </div>
          )}

          {s.overdue.length > 0 && (
            <button
              onClick={() => onNavigate("appelli")}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-coral-100 bg-coral-100/50 px-3 py-2.5 text-left text-[13px] font-semibold text-coral-700 transition hover:bg-coral-100"
            >
              <Icon name="alert" size={15} />
              {s.overdue.length} appell{s.overdue.length === 1 ? "o scaduto" : "i scaduti"} senza
              esito registrato
              <Icon name="arrow" size={14} className="ml-auto" />
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
