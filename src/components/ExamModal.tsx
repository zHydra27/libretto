import { useEffect, useState } from "react";
import type { Exam, ExamStatus } from "../types";
import { STATUS_META } from "../types";
import { uid } from "../store";
import { Icon } from "./Icon";

const ALL_STATUS: ExamStatus[] = ["todo", "study", "booked", "passed", "failed"];
const GRADES = Array.from({ length: 13 }, (_, i) => 30 - i); // 30 → 18

interface Props {
  initial: Exam | null;
  preset?: ExamStatus;
  onClose: () => void;
  onSubmit: (exam: Exam, isNew: boolean) => void;
}

export function ExamModal({ initial, preset, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cfu, setCfu] = useState(initial ? String(initial.cfu) : "9");
  const [year, setYear] = useState(String(initial?.year ?? 1));
  const [semester, setSemester] = useState<1 | 2>(initial?.semester ?? 1);
  const [status, setStatus] = useState<ExamStatus>(
    preset ?? initial?.status ?? "todo",
  );
  const [date, setDate] = useState(initial?.date ?? "");
  const [grade, setGrade] = useState(
    initial?.grade != null ? String(initial.grade) : "",
  );
  const [lode, setLode] = useState(initial?.lode ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<{ name?: string; cfu?: string; grade?: string }>(
    {},
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const cfuNum = Number(cfu);
    if (!name.trim()) errs.name = "Inserisci il nome del corso";
    if (!Number.isInteger(cfuNum) || cfuNum < 1 || cfuNum > 30)
      errs.cfu = "CFU tra 1 e 30";
    if (status === "passed" && (!grade || Number(grade) < 18 || Number(grade) > 30))
      errs.grade = "Indica il voto (18–30)";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSubmit(
      {
        id: initial?.id ?? uid(),
        name: name.trim(),
        cfu: cfuNum,
        year: Number(year),
        semester,
        status,
        date: date || undefined,
        grade: status === "passed" ? Number(grade) : undefined,
        lode: status === "passed" && grade === "30" ? lode : undefined,
        notes: notes.trim() || undefined,
      },
      !initial,
    );
  };

  const title = initial
    ? "Modifica esame"
    : preset === "passed"
      ? "Registra esito"
      : "Nuovo esame";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="anim-fade absolute inset-0 bg-pine-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-card shadow-2xl sm:rounded-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-5 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-md p-1.5 text-soft transition hover:bg-mist hover:text-ink"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="f-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
              Corso
            </label>
            <input
              id="f-name"
              autoFocus
              className={`field ${errors.name ? "field-error" : ""}`}
              placeholder="es. Algoritmi e Strutture Dati"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-coral-600">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="f-cfu" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                CFU
              </label>
              <input
                id="f-cfu"
                type="number"
                min={1}
                max={30}
                className={`field num ${errors.cfu ? "field-error" : ""}`}
                value={cfu}
                onChange={(e) => setCfu(e.target.value)}
              />
              {errors.cfu && (
                <p className="mt-1 text-xs font-medium text-coral-600">{errors.cfu}</p>
              )}
            </div>
            <div>
              <label htmlFor="f-year" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Anno
              </label>
              <select
                id="f-year"
                className="field"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y}º anno
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-sem" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Semestre
              </label>
              <select
                id="f-sem"
                className="field"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
              >
                <option value={1}>1º</option>
                <option value={2}>2º</option>
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Stato
              </label>
              <select
                id="f-status"
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value as ExamStatus)}
              >
                {ALL_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="f-date" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
              Data appello
            </label>
            <input
              id="f-date"
              type="date"
              className="field num"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {status === "booked" && !date && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <Icon name="clock" size={13} />
                Suggerimento: indica la data per vederlo negli appelli
              </p>
            )}
          </div>

          {status === "passed" && (
            <div className="anim-in rounded-lg border border-leaf-100 bg-leaf-100/40 p-3.5">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <label htmlFor="f-grade" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                    Voto
                  </label>
                  <select
                    id="f-grade"
                    className={`field num ${errors.grade ? "field-error" : ""}`}
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      if (e.target.value !== "30") setLode(false);
                    }}
                  >
                    <option value="">—</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <label
                  className={`mb-0.5 flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    grade === "30"
                      ? lode
                        ? "border-leaf-600 bg-leaf-600 text-white"
                        : "border-line bg-card hover:border-leaf-600"
                      : "cursor-not-allowed border-line bg-mist/60 text-faint"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    disabled={grade !== "30"}
                    checked={lode}
                    onChange={(e) => setLode(e.target.checked)}
                  />
                  <Icon name="star" size={15} />
                  Lode
                </label>
              </div>
              {errors.grade && (
                <p className="mt-1.5 text-xs font-medium text-coral-600">{errors.grade}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="f-notes" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
              Note <span className="font-normal normal-case text-faint">(facoltative)</span>
            </label>
            <textarea
              id="f-notes"
              rows={2}
              className="field resize-none"
              placeholder="Programma, prof, materiale utile…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-soft transition hover:bg-mist hover:text-ink active:scale-95"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-pine-950 shadow-sm transition hover:bg-amber-400 active:scale-95"
            >
              <Icon name="check" size={15} strokeWidth={2.5} />
              {initial ? "Salva modifiche" : "Aggiungi al libretto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
