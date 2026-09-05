import { useApp, type Toast } from "../store";
import { Icon, type IconName } from "./Icon";

const KIND: Record<Toast["kind"], { icon: IconName; cls: string }> = {
  success: { icon: "check", cls: "bg-leaf-600 text-white" },
  info: { icon: "info", cls: "bg-steel-600 text-white" },
  danger: { icon: "trash", cls: "bg-coral-600 text-white" },
};

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(370px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const k = KIND[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className="toast-in pointer-events-auto relative overflow-hidden rounded-xl bg-pine-950 text-paper shadow-xl"
          >
            <div className="flex items-start gap-3 px-3.5 py-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${k.cls}`}
              >
                <Icon name={k.icon} size={13} strokeWidth={2.6} />
              </span>
              <p className="flex-1 pt-0.5 text-[13px] leading-snug">{t.msg}</p>
              {t.actionLabel && (
                <button
                  onClick={() => {
                    t.onAction?.();
                    dismissToast(t.id);
                  }}
                  className="num rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-pine-950 transition hover:bg-amber-400 active:scale-95"
                >
                  {t.actionLabel}
                </button>
              )}
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Chiudi notifica"
                className="mt-0.5 text-paper/50 transition hover:text-paper"
              >
                <Icon name="x" size={15} />
              </button>
            </div>
            <div
              className="h-0.5 bg-amber-500/80"
              style={{ animation: "life-bar 4.8s linear forwards" }}
            />
          </div>
        );
      })}
    </div>
  );
}
