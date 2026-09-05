import type { AppState, Exam, ExamStatus, Settings } from "../types";

const STATUSES: ExamStatus[] = ["todo", "study", "booked", "passed", "failed"];

const genId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const num = (v: unknown, lo: number, hi: number, fb: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fb;
};

/* ---------- codifica base64 unicode-safe ---------- */

export function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}

export function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------- validazione / normalizzazione ---------- */

/** Trasforma dati arbitrari (file, codice, link) in uno stato valido, o null. */
export function coerceState(raw: unknown): AppState | null {
  if (!isObj(raw) || !Array.isArray(raw.exams)) return null;

  const exams: Exam[] = raw.exams.filter(isObj).map((e) => {
    const status: ExamStatus = STATUSES.includes(e.status as ExamStatus)
      ? (e.status as ExamStatus)
      : "todo";
    return {
      id: typeof e.id === "string" && e.id ? e.id : genId(),
      name: typeof e.name === "string" && e.name.trim() ? e.name.trim() : "Esame senza nome",
      cfu: Math.round(num(e.cfu, 1, 30, 6)),
      year: Math.round(num(e.year, 1, 5, 1)),
      semester: e.semester === 2 ? 2 : 1,
      status,
      date: typeof e.date === "string" && e.date ? e.date : undefined,
      grade:
        status === "passed"
          ? Math.round(num(e.grade, 18, 30, e.grade != null ? 18 : 0)) || undefined
          : undefined,
      lode: e.lode === true ? true : undefined,
      notes: typeof e.notes === "string" && e.notes.trim() ? e.notes.trim() : undefined,
    };
  });

  const st = isObj(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    university:
      typeof st.university === "string" && st.university.trim()
        ? st.university.trim()
        : "Il mio ateneo",
    course:
      typeof st.course === "string" && st.course.trim() ? st.course.trim() : "Il mio corso",
    degree: st.degree === "magistrale" ? "magistrale" : "triennale",
    targetCfu: Math.round(num(st.targetCfu, 20, 400, 180)),
    bonus: Math.round(num(st.bonus, 0, 30, 2)),
    targetGrade: Math.round(num(st.targetGrade, 66, 110, 105)),
  };

  return { exams, settings };
}

/* ---------- codice di backup (da copiare/incollare) ---------- */

export function stateToCode(state: AppState): string {
  return utf8ToBase64(JSON.stringify(state));
}

export function codeToState(code: string): AppState | null {
  const clean = code.trim().replace(/^libretto:/i, "");
  if (!clean) return null;
  try {
    return coerceState(JSON.parse(base64ToUtf8(clean)));
  } catch {
    return null;
  }
}

/* ---------- link condivisibile (#b=...) ---------- */

export function buildShareUrl(state: AppState): string {
  return `${location.origin}${location.pathname}#b=${stateToCode(state)}`;
}

/** Legge un eventuale backup incorporato nell'URL attuale. */
export function parseShareHash(): AppState | null {
  const h = location.hash;
  if (!h.startsWith("#b=")) return null;
  try {
    return coerceState(JSON.parse(base64ToUtf8(h.slice(3))));
  } catch {
    return null;
  }
}

export function clearShareHash(): void {
  history.replaceState(null, "", location.pathname + location.search);
}

/* ---------- appunti con fallback ---------- */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
