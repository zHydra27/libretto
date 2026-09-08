import type { Exam } from "../types";

/** Catalogo ufficiale del corso di laurea (triennale, 180 CFU). */
export interface Course {
  name: string;
  cfu: number;
  /** 1 | 2 | 3 = anno consigliato; 0 = senza anno specifico (a scelta / lingua) */
  year: 0 | 1 | 2 | 3;
  prerequisites: string[];
}

export const COURSES: Course[] = [
  // ---- 1º anno ----
  { name: "Analisi 1", cfu: 12, year: 1, prerequisites: [] },
  { name: "Algebra lineare", cfu: 6, year: 1, prerequisites: [] },
  { name: "Fondamenti di programmazione", cfu: 9, year: 1, prerequisites: [] },
  { name: "Fisica Generale", cfu: 12, year: 1, prerequisites: ["Analisi 1"] },
  { name: "Analisi 2", cfu: 6, year: 1, prerequisites: ["Analisi 1", "Algebra lineare"] },
  { name: "Basi di dati", cfu: 9, year: 1, prerequisites: ["Fondamenti di programmazione"] },
  { name: "Algoritmi e strutture dati", cfu: 6, year: 1, prerequisites: ["Fondamenti di programmazione"] },
  // ---- 2º anno ----
  { name: "Elettrotecnica", cfu: 6, year: 2, prerequisites: ["Fisica Generale"] },
  { name: "Ricerca operativa", cfu: 9, year: 2, prerequisites: ["Analisi 2"] },
  { name: "Progettazione web", cfu: 6, year: 2, prerequisites: ["Basi di dati"] },
  { name: "Economia ed organizzazione aziendale", cfu: 6, year: 2, prerequisites: [] },
  { name: "Reti logiche", cfu: 9, year: 2, prerequisites: ["Fondamenti di programmazione"] },
  { name: "Fondamenti di automatica", cfu: 9, year: 2, prerequisites: ["Fisica Generale", "Analisi 2"] },
  { name: "Calcolo numerico", cfu: 6, year: 2, prerequisites: ["Analisi 2"] },
  { name: "Calcolatori elettronici", cfu: 9, year: 2, prerequisites: ["Reti logiche"] },
  // ---- 3º anno ----
  { name: "Elettronica digitale", cfu: 9, year: 3, prerequisites: ["Elettrotecnica"] },
  { name: "Comunicazioni numeriche", cfu: 9, year: 3, prerequisites: ["Analisi 2"] },
  { name: "Reti informatiche", cfu: 9, year: 3, prerequisites: ["Calcolatori elettronici"] },
  { name: "Sistemi operativi", cfu: 9, year: 3, prerequisites: ["Calcolatori elettronici"] },
  { name: "Ingegneria del software", cfu: 6, year: 3, prerequisites: [] },
  { name: "Tesi", cfu: 3, year: 3, prerequisites: [] },
  // ---- Trasversali / a scelta (nessun anno specifico) ----
  { name: "Esame a scelta 1", cfu: 6, year: 0, prerequisites: [] },
  { name: "Esame a scelta 2", cfu: 6, year: 0, prerequisites: [] },
  { name: "Inglese", cfu: 3, year: 0, prerequisites: [] },
];

export const TOTAL_CFU = COURSES.reduce((s, c) => s + c.cfu, 0);

const norm = (s: string) => s.trim().toLowerCase();

export const courseByName = (name: string): Course | undefined =>
  COURSES.find((c) => norm(c.name) === norm(name));

/** Restituisce i nomi delle propedeuticità NON ancora superate per un corso. */
export function missingPrerequisites(courseName: string, exams: Exam[]): string[] {
  const course = courseByName(courseName);
  if (!course || course.prerequisites.length === 0) return [];
  const passed = new Set(
    exams.filter((e) => e.status === "passed").map((e) => norm(e.name)),
  );
  return course.prerequisites.filter((p) => !passed.has(norm(p)));
}
