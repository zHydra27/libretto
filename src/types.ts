export type ExamStatus = "todo" | "study" | "booked" | "passed" | "failed";

export type ViewId = "dashboard" | "libretto" | "appelli" | "settings";

export interface Exam {
  id: string;
  name: string;
  cfu: number;
  year: number;
  semester: 1 | 2;
  status: ExamStatus;
  /** ISO date (yyyy-mm-dd) — data dell'appello */
  date?: string;
  /** 18–30, presente se superato */
  grade?: number;
  lode?: boolean;
  notes?: string;
}

export interface Settings {
  university: string;
  course: string;
  degree: "triennale" | "magistrale";
  targetCfu: number;
  /** punti bonus di partenza per il voto di laurea */
  bonus: number;
  /** obiettivo di voto di laurea (66–110) */
  targetGrade: number;
}

export interface AppState {
  exams: Exam[];
  settings: Settings;
}

export interface StatusMeta {
  label: string;
  dot: string;
  chip: string;
  rank: number;
}

export const STATUS_META: Record<ExamStatus, StatusMeta> = {
  todo: {
    label: "Da preparare",
    dot: "bg-faint",
    chip: "bg-mist text-soft border border-line",
    rank: 0,
  },
  study: {
    label: "In studio",
    dot: "bg-steel-600",
    chip: "bg-steel-100 text-steel-700",
    rank: 1,
  },
  booked: {
    label: "Prenotato",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900",
    rank: 2,
  },
  passed: {
    label: "Superato",
    dot: "bg-leaf-600",
    chip: "bg-leaf-100 text-leaf-700",
    rank: 3,
  },
  failed: {
    label: "Non superato",
    dot: "bg-coral-600",
    chip: "bg-coral-100 text-coral-700",
    rank: 4,
  },
};

/** Le transizioni verso "passed" passano dalla registrazione del voto. */
export const STATUS_MENU_ORDER: ExamStatus[] = ["todo", "study", "booked", "failed"];

export const gradeValue = (e: Exam): number => (e.grade ?? 0) + (e.lode ? 1 : 0);

export const fmtGrade = (e: Exam): string =>
  e.grade != null ? `${e.grade}${e.lode ? "L" : ""}` : "—";

export const SEMESTER_LABEL: Record<1 | 2, string> = {
  1: "1º semestre",
  2: "2º semestre",
};
