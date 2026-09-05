import { useState } from "react";
import { clearShareHash, parseShareHash } from "../lib/backup";
import { useApp } from "../store";
import { Icon } from "./Icon";

/** Se l'URL contiene un backup (#b=...), propone di importarlo all'apertura. */
export function IncomingBackup() {
  const { importState, pushToast } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [data] = useState(() => parseShareHash());

  if (!data || dismissed) return null;

  const cfu = data.exams.reduce((s, e) => s + e.cfu, 0);
  const passed = data.exams.filter((e) => e.status === "passed").length;

  const accept = () => {
    importState(data);
    clearShareHash();
    pushToast(
      `Backup importato: ${data.exams.length} esami, ${cfu} CFU (${passed} superati)`,
    );
  };

  const decline = () => {
    clearShareHash();
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-5">
      <div className="anim-fade absolute inset-0 bg-pine-950/60 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Backup rilevato nel link"
        className="anim-pop relative w-full max-w-md rounded-xl border border-line bg-card p-6 shadow-2xl"
      >
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-pine-100 text-pine-700">
          <Icon name="link" size={20} />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
          Questo link contiene un backup
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-soft">
          Corso: <strong className="text-ink">{data.settings.course}</strong> ·{" "}
          {data.exams.length} esami · <span className="num">{cfu}</span> CFU ·{" "}
          <span className="num">{passed}</span> superati
        </p>
        <p className="mt-3 rounded-lg bg-mist px-3 py-2 text-xs leading-relaxed text-soft">
          Importandolo <strong className="text-ink">sostituirai</strong> i dati attualmente
          salvati su questo dispositivo.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={decline}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-soft transition hover:bg-mist hover:text-ink active:scale-95"
          >
            Ignora
          </button>
          <button
            onClick={accept}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-pine-950 shadow-sm transition hover:bg-amber-400 active:scale-95"
          >
            <Icon name="download" size={15} strokeWidth={2.5} />
            Importa backup
          </button>
        </div>
      </div>
    </div>
  );
}
