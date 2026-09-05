import { useEffect, useRef, useState } from "react";
import {
  buildShareUrl,
  codeToState,
  coerceState,
  copyText,
  stateToCode,
} from "../lib/backup";
import { todayISO } from "../lib/dates";
import { useApp } from "../store";
import type { AppState } from "../types";
import { Icon, type IconName } from "./Icon";

export function SettingsView() {
  const {
    exams,
    settings,
    setSettings,
    importState,
    pushToast,
    loadSample,
    clearAll,
  } = useApp();

  const [university, setUniversity] = useState(settings.university);
  const [course, setCourse] = useState(settings.course);
  const [degree, setDegree] = useState<"triennale" | "magistrale">(settings.degree);
  const [targetCfu, setTargetCfu] = useState(String(settings.targetCfu));
  const [bonus, setBonus] = useState(String(settings.bonus));
  const [targetGrade, setTargetGrade] = useState(settings.targetGrade);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<number | null>(null);

  const [pendingImport, setPendingImport] = useState<{ data: AppState; label: string } | null>(
    null,
  );
  const [showRestore, setShowRestore] = useState(false);
  const [codeText, setCodeText] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (armTimer.current) window.clearTimeout(armTimer.current);
    },
    [],
  );

  /* ---------- profilo ---------- */

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const cfu = Number(targetCfu);
    const b = Number(bonus);
    if (!university.trim() || !course.trim()) {
      pushToast("Compila ateneo e corso di laurea", { kind: "danger" });
      return;
    }
    if (!Number.isInteger(cfu) || cfu < 20 || cfu > 400) {
      pushToast("CFU totali: un valore intero tra 20 e 400", { kind: "danger" });
      return;
    }
    if (!Number.isInteger(b) || b < 0 || b > 30) {
      pushToast("Punti bonus: un valore intero tra 0 e 30", { kind: "danger" });
      return;
    }
    setSettings({
      university: university.trim(),
      course: course.trim(),
      degree,
      targetCfu: cfu,
      bonus: b,
      targetGrade,
    });
    pushToast("Impostazioni salvate");
  };

  /* ---------- backup & sync ---------- */

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exams, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libretto-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast("File di backup esportato", { kind: "info" });
  };

  const onFileChosen = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      let parsed: AppState | null = null;
      try {
        parsed = coerceState(JSON.parse(text));
      } catch {
        parsed = null;
      }
      if (!parsed) parsed = codeToState(text); // forse il file contiene solo il codice
      if (parsed) {
        setPendingImport({ data: parsed, label: `«${file.name}»` });
        setCodeError(null);
      } else {
        pushToast("File non riconosciuto: serve un backup di Libretto (.json)", {
          kind: "danger",
        });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const restoreFromCode = () => {
    const parsed = codeToState(codeText);
    if (!parsed) {
      setCodeError("Codice non valido: controlla di averlo incollato per intero.");
      return;
    }
    setCodeError(null);
    setPendingImport({ data: parsed, label: "il codice incollato" });
  };

  const shareLink = async () => {
    const url = buildShareUrl({ exams, settings });
    const ok = await copyText(url);
    pushToast(
      ok
        ? "Link copiato: aprilo sull'altro dispositivo e conferma l'import"
        : "Copia non riuscita: il browser ha bloccato gli appunti",
      { kind: ok ? "info" : "danger" },
    );
  };

  const copyCode = async () => {
    const ok = await copyText(stateToCode({ exams, settings }));
    pushToast(
      ok
        ? "Codice di backup copiato negli appunti"
        : "Copia non riuscita: il browser ha bloccato gli appunti",
      { kind: ok ? "info" : "danger" },
    );
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    importState(pendingImport.data);
    const n = pendingImport.data.exams.length;
    const cfu = pendingImport.data.exams.reduce((s, e) => s + e.cfu, 0);
    pushToast(`Backup importato da ${pendingImport.label}: ${n} esami, ${cfu} CFU`);
    setPendingImport(null);
    setShowRestore(false);
    setCodeText("");
  };

  const handleClear = () => {
    if (!armed) {
      setArmed(true);
      if (armTimer.current) window.clearTimeout(armTimer.current);
      armTimer.current = window.setTimeout(() => setArmed(false), 3500);
      return;
    }
    if (armTimer.current) window.clearTimeout(armTimer.current);
    setArmed(false);
    clearAll();
  };

  const pendingCfu = pendingImport?.data.exams.reduce((s, e) => s + e.cfu, 0) ?? 0;
  const pendingPassed =
    pendingImport?.data.exams.filter((e) => e.status === "passed").length ?? 0;

  const syncBtn = (
    icon: IconName,
    label: string,
    desc: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-line bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-md hover:shadow-pine-900/5 active:scale-[0.98]"
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-mist text-pine-700 transition-colors group-hover:bg-pine-100">
        <Icon name={icon} size={16} />
      </span>
      <span>
        <span className="block text-[13px] font-bold leading-tight">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-faint">{desc}</span>
      </span>
    </button>
  );

  return (
    <div>
      <header className="anim-in">
        <p className="num text-[11px] uppercase tracking-[0.18em] text-soft">
          profilo, backup & preferenze
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Impostazioni</h1>
      </header>

      <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={save}
          className="anim-in self-start rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(27,39,34,0.06)] sm:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-uni" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Ateneo
              </label>
              <input
                id="s-uni"
                className="field"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="es. Politecnico di Milano"
              />
            </div>
            <div>
              <label htmlFor="s-course" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Corso di laurea
              </label>
              <input
                id="s-course"
                className="field"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="es. Ingegneria Informatica"
              />
            </div>
            <div>
              <label htmlFor="s-degree" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Tipo di laurea
              </label>
              <select
                id="s-degree"
                className="field"
                value={degree}
                onChange={(e) => setDegree(e.target.value as "triennale" | "magistrale")}
              >
                <option value="triennale">Triennale</option>
                <option value="magistrale">Magistrale</option>
              </select>
            </div>
            <div>
              <label htmlFor="s-cfu" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                CFU totali del piano
              </label>
              <input
                id="s-cfu"
                type="number"
                min={20}
                max={400}
                className="field num"
                value={targetCfu}
                onChange={(e) => setTargetCfu(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="s-bonus" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-soft">
                Punti bonus di partenza
              </label>
              <input
                id="s-bonus"
                type="number"
                min={0}
                max={30}
                className="field num"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-faint">
                Media relatore, tirocinio, Erasmus… dipende dal tuo ateneo.
              </p>
            </div>
            <div>
              <label htmlFor="s-target" className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-soft">
                Obiettivo di laurea
                <span className="num text-sm font-bold normal-case tracking-normal text-amber-600">
                  {targetGrade}/110
                </span>
              </label>
              <input
                id="s-target"
                type="range"
                min={66}
                max={110}
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="mt-3 w-full"
                style={{ accentColor: "var(--color-amber-500)" }}
              />
              <div className="num mt-1 flex justify-between text-[10px] text-faint">
                <span>66</span>
                <span>110 e lode</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-faint">Le modifiche influenzano medie e stime.</p>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-pine-950 shadow-sm transition hover:bg-amber-400 active:scale-95"
            >
              <Icon name="check" size={15} strokeWidth={2.5} />
              Salva impostazioni
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {/* ---------- backup & sincronizzazione ---------- */}
          <section
            className="anim-in rounded-xl border border-pine-200 bg-card p-5 shadow-[0_1px_2px_rgba(27,39,34,0.06)]"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-pine-900 text-amber-400">
                <Icon name="link" size={15} />
              </span>
              <h2 className="font-display text-base font-bold">Backup & sincronizzazione</h2>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-soft">
              I dati vivono in questo browser. Per ritrovarli sul telefono o su un altro PC,
              portali con uno di questi metodi.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {syncBtn("link", "Link condivisibile", "Copia un link con i dati incorporati", shareLink)}
              {syncBtn("copy", "Copia codice", "Codice di backup da incollare altrove", copyCode)}
              {syncBtn("download", "Esporta file", "Scarica un backup .json", exportJson)}
              {syncBtn(
                "upload",
                "Importa file",
                "Ripristina da un backup .json",
                () => fileRef.current?.click(),
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json,text/plain"
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0])}
            />

            <button
              onClick={() => {
                setShowRestore((v) => !v);
                setCodeError(null);
              }}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-[13px] font-semibold text-soft transition hover:bg-mist hover:text-ink"
            >
              Ripristina da codice
              <Icon
                name="chevron"
                size={15}
                className={`transition-transform duration-200 ${showRestore ? "rotate-180" : ""}`}
              />
            </button>
            {showRestore && (
              <div className="anim-in mt-2 space-y-2">
                <textarea
                  rows={3}
                  className={`field num resize-none text-[11px] ${codeError ? "field-error" : ""}`}
                  placeholder="Incolla qui il codice di backup…"
                  value={codeText}
                  onChange={(e) => {
                    setCodeText(e.target.value);
                    setCodeError(null);
                  }}
                />
                {codeError && (
                  <p className="text-xs font-medium text-coral-600">{codeError}</p>
                )}
                <button
                  onClick={restoreFromCode}
                  disabled={!codeText.trim()}
                  className="w-full rounded-lg bg-pine-900 px-3.5 py-2 text-[13px] font-bold text-paper transition hover:bg-pine-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Leggi il codice
                </button>
              </div>
            )}

            {pendingImport && (
              <div className="anim-pop mt-3 rounded-lg border border-amber-500/50 bg-amber-100/50 p-3.5">
                <p className="text-[13px] font-bold text-amber-900">
                  Backup pronto da {pendingImport.label}
                </p>
                <p className="num mt-1 text-xs text-amber-900/80">
                  {pendingImport.data.exams.length} esami · {pendingCfu} CFU · {pendingPassed}{" "}
                  superati — sostituirà i dati attuali.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={confirmImport}
                    className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-pine-950 transition hover:bg-amber-400 active:scale-95"
                  >
                    Sostituisci dati
                  </button>
                  <button
                    onClick={() => setPendingImport(null)}
                    className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-soft transition hover:bg-mist active:scale-95"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}

            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
              Sul telefono: apri il link dell'app e usa «Aggiungi a schermata Home» — si aprirà
              a schermo intero come un'app.
            </p>
          </section>

          {/* ---------- spiegazione ---------- */}
          <section
            className="anim-in rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(27,39,34,0.06)]"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="font-display text-base font-bold">Come nasce la stima</h2>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-snug text-soft">
              <li className="flex gap-2.5">
                <Icon name="award" size={15} className="mt-0.5 shrink-0 text-leaf-600" />
                <span>
                  <strong className="text-ink">Media ponderata</strong>: ogni voto pesa per i suoi
                  CFU (30L vale 31).
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="target" size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <span>
                  <strong className="text-ink">Voto base</strong> = media × 110/30, più i punti
                  bonus che imposti qui.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="info" size={15} className="mt-0.5 shrink-0 text-steel-600" />
                <span>
                  Ogni ateneo ha le sue regole: usa la stima come bussola, non come verità
                  assoluta.
                </span>
              </li>
            </ul>
          </section>

          {/* ---------- dati ---------- */}
          <section
            className="anim-in rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(27,39,34,0.06)]"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="font-display text-base font-bold">I tuoi dati</h2>
            <p className="mt-2 text-[13px] leading-snug text-soft">
              Tutto è salvato <strong className="text-ink">solo nel tuo browser</strong>{" "}
              (localStorage): niente account, niente cloud. Per cambiare dispositivo usa i
              backup qui sopra.
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={loadSample}
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-left text-[13px] font-semibold text-soft transition hover:bg-mist hover:text-ink active:scale-[0.98]"
              >
                <Icon name="undo" size={15} />
                Ricarica la carriera d'esempio
              </button>
              <button
                onClick={handleClear}
                className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-2.5 text-left text-[13px] font-semibold transition active:scale-[0.98] ${
                  armed
                    ? "border-coral-600 bg-coral-600 text-white"
                    : "border-coral-100 bg-coral-100/40 text-coral-700 hover:bg-coral-100"
                }`}
              >
                <Icon name="trash" size={15} />
                {armed ? "Confermi? Clicca ancora per svuotare" : "Elimina tutti gli esami"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


