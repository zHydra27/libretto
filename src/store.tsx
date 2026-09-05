import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState, Exam, Settings } from "./types";
import { sampleState } from "./data/sample";

const KEY = "libretto.v1";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export interface Toast {
  id: string;
  msg: string;
  kind: "success" | "info" | "danger";
  actionLabel?: string;
  onAction?: () => void;
}

interface AppCtx {
  exams: Exam[];
  settings: Settings;
  toasts: Toast[];
  addExam: (e: Exam) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  importState: (s: AppState) => void;
  loadSample: () => void;
  clearAll: () => void;
  pushToast: (msg: string, opts?: Partial<Omit<Toast, "id" | "msg">>) => void;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp deve stare dentro <AppProvider>");
  return c;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as AppState;
      if (p && Array.isArray(p.exams) && p.settings && typeof p.settings === "object") {
        return p;
      }
    }
  } catch {
    /* dati corrotti: si riparte dall'esempio */
  }
  return sampleState();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage pieno o non disponibile */
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const h = timers.current.get(id);
    if (h) window.clearTimeout(h);
    timers.current.delete(id);
  }, []);

  const pushToast = useCallback(
    (msg: string, opts?: Partial<Omit<Toast, "id" | "msg">>) => {
      const id = uid();
      setToasts((t) => [...t.slice(-3), { id, msg, kind: opts?.kind ?? "success", ...opts }]);
      const h = window.setTimeout(() => dismissToast(id), 4800);
      timers.current.set(id, h);
    },
    [dismissToast],
  );

  const addExam = useCallback((e: Exam) => {
    setState((s) => ({ ...s, exams: [...s.exams, e] }));
  }, []);

  const updateExam = useCallback((id: string, patch: Partial<Exam>) => {
    setState((s) => ({
      ...s,
      exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteExam = useCallback(
    (id: string) => {
      const idx = state.exams.findIndex((e) => e.id === id);
      if (idx === -1) return;
      const removed = state.exams[idx];
      setState((s) => ({ ...s, exams: s.exams.filter((e) => e.id !== id) }));
      pushToast(`«${removed.name}» eliminato dal libretto`, {
        kind: "danger",
        actionLabel: "Annulla",
        onAction: () => {
          setState((cur) => {
            const exams = [...cur.exams];
            exams.splice(Math.min(idx, exams.length), 0, removed);
            return { ...cur, exams };
          });
          pushToast(`«${removed.name}» ripristinato`, { kind: "info" });
        },
      });
    },
    [state.exams, pushToast],
  );

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const importState = useCallback((s: AppState) => {
    setState(s);
  }, []);

  const loadSample = useCallback(() => {
    setState(sampleState());
    pushToast("Carriera di esempio caricata", { kind: "info" });
  }, [pushToast]);

  const clearAll = useCallback(() => {
    setState((s) => ({ ...s, exams: [] }));
    pushToast("Libretto svuotato: si riparte da zero", { kind: "info" });
  }, [pushToast]);

  return (
    <Ctx.Provider
      value={{
        exams: state.exams,
        settings: state.settings,
        toasts,
        addExam,
        updateExam,
        deleteExam,
        setSettings,
        importState,
        loadSample,
        clearAll,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
