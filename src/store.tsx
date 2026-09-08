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

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage pieno o non disponibile */
    }
  }, [state]);

  /* ---------- SYNC: sessione, caricamento iniziale, realtime ---------- */
  useEffect(() => {
    console.log("🔍 [DEBUG 1] useEffect sincronizzazione avviato");
    
    if (!isSupabaseConfigured) {
      console.error("⛔ [DEBUG] Supabase NON configurato! Controllo fallito.");
      return;
    }
    console.log("✅ [DEBUG] Supabase risulta configurato");

      let channel: any = null;
    const setup = async (userId: string) => {
      console.log("🔍 [DEBUG 2] Funzione setup avviata per user:", userId);
      if (setupFor.current === userId) {
          console.log("⛔ [DEBUG] setup già eseguito per questo user, esco.");
          return;
      }
      setupFor.current = userId;
      userIdRef.current = userId;

      console.log("🔍 [DEBUG 3] Tentativo di lettura da Supabase...");
      const { data, error } = await supabase
        .from("libretto_state")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ ERRORE SUPABASE (LETTURA):", error.message, error.details);
        return; 
      }
      console.log("✅ [DEBUG 4] Lettura riuscita. Dati:", data);

      if (data) {
        const remote = data.state as AppState | null;
        if (remote && Array.isArray(remote.exams) && remote.exams.length > 0) {
          console.log("🔍 [DEBUG 5] Trovati dati remoti, applico merge.");
          const mergedState: AppState = {
            exams: remote.exams,
            settings: remote.settings || stateRef.current.settings,
          };
          skipPush.current = true;
          setState(mergedState);
        } else {
          if (stateRef.current.exams.length > 0) {
            console.log("🔍 [DEBUG 6] Cloud vuoto, ma ho dati locali. Invio upsert...");
            const { error: upsertError } = await supabase
              .from("libretto_state")
              .upsert({ user_id: userId, state: stateRef.current });
            if (upsertError) console.error("❌ ERRORE SUPABASE (SCRITTURA INIZIALE):", upsertError.message);
            else console.log("✅ [DEBUG 7] Upsert iniziale riuscito!");
          }
        }
      } else {
        console.log("🔍 [DEBUG 8] Nessuna riga trovata, creo la prima...");
        const { error: upsertError } = await supabase
          .from("libretto_state")
          .upsert({ user_id: userId, state: stateRef.current });
        if (upsertError) console.error("❌ ERRORE SUPABASE (CREAZIONE RIGA):", upsertError.message);
        else console.log("✅ [DEBUG 9] Creazione riga riuscita!");
      }

      remoteReady.current = true;
      setSyncActive(true);
      console.log("✅ [DEBUG 10] Sincronizzazione pronta e attiva.");

      channel = supabase
        .channel(`libretto-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "libretto_state", filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log("🔍 [DEBUG REALTIME] Modifica rilevata dal cloud:", payload);
            const incoming = (payload.new as { state?: AppState })?.state;
            if (!incoming || !Array.isArray(incoming.exams)) return;
            if (JSON.stringify(incoming) === JSON.stringify(stateRef.current)) return;
            skipPush.current = true;
            setState({
              exams: incoming.exams,
              settings: incoming.settings || stateRef.current.settings,
            });
          }
        )
        .subscribe();
    };

    console.log("🔍 [DEBUG 11] Controllo sessione Supabase...");
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      console.log("🔍 [DEBUG 12] Risultato getSession:", u ? `Utente: ${u.email} (ID: ${u.id})` : "NESSUN UTENTE");
      
      userIdRef.current = u?.id ?? null;
      setUserEmail(u?.email ?? null);
      
      if (u) {
        void setup(u.id);
      } else {
        console.log("⛔ [DEBUG] Nessun utente loggato, setup NON chiamato.");
      }
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null;
      console.log("🔍 [DEBUG AUTH CHANGE] Stato auth cambiato:", u ? `Utente: ${u.email}` : "Logout");
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
              if (channel) supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- SYNC: invio delle modifiche locali ---------- */
  useEffect(() => {
    console.log("🔍 [DEBUG PUSH] useEffect push attivato. State cambiato:", state);
    
    if (!isSupabaseConfigured) {
      console.log("⛔ [DEBUG PUSH] Supabase non configurato, esco.");
      return;
    }
    
    if (!remoteReady.current) {
      console.log("⛔ [DEBUG PUSH] remoteReady è false, esco.");
      return;
    }
    
    if (!userIdRef.current) {
      console.log("⛔ [DEBUG PUSH] userIdRef è null, esco.");
      return;
    }
    
    if (skipPush.current) {
      console.log("⛔ [DEBUG PUSH] skipPush è true, resetto e esco.");
      skipPush.current = false;
      return;
    }

    const userId = userIdRef.current;
    console.log("🔍 [DEBUG PUSH] Preparo invio a Supabase per user:", userId);
    
    const t = window.setTimeout(() => {
      console.log("🔍 [DEBUG PUSH] Invio upsert a Supabase...");
      supabase
        .from("libretto_state")
        .upsert({ user_id: userId, state })
        .then(({ error }) => {
          if (error) {
            console.error("❌ ERRORE SUPABASE (PUSH):", error.message, error.details);
          } else {
            console.log("✅ [DEBUG PUSH] Upsert riuscito!");
          }
        });
    }, 900);
    
    return () => {
      console.log("🔍 [DEBUG PUSH] Cleanup timeout");
      window.clearTimeout(t);
    };
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
