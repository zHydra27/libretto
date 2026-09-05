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
import { supabase, isSupabaseConfigured } from "./lib/supabase";

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
  // --- sync / auth ---
  authReady: boolean;
  userEmail: string | null;
  syncActive: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
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

  // --- stato auth/sync ---
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncActive, setSyncActive] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const remoteReady = useRef(false);
  const skipPush = useRef(false);
  const setupFor = useRef<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Salva sempre in locale (così l'app funziona anche offline)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage pieno o non disponibile */
    }
  }, [state]);

  /* ---------- SYNC: sessione, caricamento iniziale, realtime ---------- */
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let channel: { remove: () => void } | null = null;

    const setup = async (userId: string) => {
      if (setupFor.current === userId) return;
      setupFor.current = userId;
      userIdRef.current = userId;

      const { data, error } = await supabase
        .from("libretto_state")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error) {
        const remote = data?.state as AppState | null;
        if (remote && Array.isArray(remote.exams) && remote.settings) {
          // esiste un backup cloud: vince lui
          skipPush.current = true;
          setState(remote);
        } else {
          // primo accesso: carica i dati locali nel cloud
          await supabase
            .from("libretto_state")
            .upsert({ user_id: userId, state: stateRef.current });
        }
      }

      remoteReady.current = true;
      setSyncActive(true);

      channel = supabase
        .channel(`libretto-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "libretto_state",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const incoming = (payload.new as { state?: AppState })?.state;
            if (!incoming || !Array.isArray(incoming.exams) || !incoming.settings) return;
            if (JSON.stringify(incoming) === JSON.stringify(stateRef.current)) return;
            skipPush.current = true;
            setState(incoming);
          },
        )
        .subscribe();
    };

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      userIdRef.current = u?.id ?? null;
      setUserEmail(u?.email ?? null);
      if (u) void setup(u.id);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null;
      setUserEmail(u?.email ?? null);
      if (u) {
        void setup(u.id);
      } else {
        setupFor.current = null;
        userIdRef.current = null;
        remoteReady.current = false;
        setSyncActive(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      channel?.remove();
    };
  }, []);

  /* ---------- SYNC: invio delle modifiche locali (con piccola attesa) ---------- */
  useEffect(() => {
    if (!isSupabaseConfigured || !remoteReady.current || !userIdRef.current) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    const userId = userIdRef.current;
    const t = window.setTimeout(() => {
      void supabase.from("libretto_state").upsert({ user_id: userId, state });
    }, 900);
    return () => window.clearTimeout(t);
  }, [state]);

  /* ---------- Auth ---------- */
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return null;
    return error.message.includes("Invalid login credentials")
      ? "Email o password sbagliati"
      : error.message;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /* ---------- Toasts ---------- */
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

  /* ---------- Azioni sul libretto ---------- */
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
        authReady,
        userEmail,
        syncActive,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
