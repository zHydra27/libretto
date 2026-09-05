import type { AppState, Exam } from "../types";
import { toISO } from "../lib/dates";

const d = (days: number): string => {
  const t = new Date();
  t.setDate(t.getDate() + days);
  return toISO(t);
};

let n = 0;
const id = () => `sample-${++n}`;

export const sampleState = (): AppState => {
  n = 0;
  const e = (
    name: string,
    cfu: number,
    year: number,
    semester: 1 | 2,
    status: Exam["status"],
    extra?: Partial<Exam>,
  ): Exam => ({ id: id(), name, cfu, year, semester, status, ...extra });

  return {
    settings: {
      university: "Università di Bologna",
      course: "Informatica",
      degree: "triennale",
      targetCfu: 180,
      bonus: 2,
      targetGrade: 105,
    },
    exams: [
      e("Analisi Matematica", 12, 1, 1, "passed", { date: d(-260), grade: 27 }),
      e("Algebra Lineare e Geometria", 9, 1, 1, "passed", {
        date: d(-238),
        grade: 30,
        lode: true,
      }),
      e("Programmazione I", 12, 1, 1, "passed", { date: d(-215), grade: 28 }),
      e("Architettura degli Elaboratori", 9, 1, 2, "passed", { date: d(-170), grade: 24 }),
      e("Logica Matematica", 6, 1, 2, "failed", { date: d(-158) }),
      e("Programmazione II", 9, 1, 2, "passed", { date: d(-140), grade: 26 }),
      e("Algoritmi e Strutture Dati", 12, 2, 1, "passed", {
        date: d(-105),
        grade: 29,
        notes: "Ripetere l'esercitazione sugli alberi prima dell'orale.",
      }),
      e("Basi di Dati", 9, 2, 1, "passed", { date: d(-68), grade: 26 }),
      e("Sistemi Operativi", 9, 2, 2, "booked", { date: d(9) }),
      e("Ingegneria del Software", 9, 2, 2, "booked", { date: d(14) }),
      e("Sicurezza Informatica", 6, 3, 1, "booked", { date: d(23) }),
      e("Reti di Calcolatori", 9, 2, 2, "study", {
        notes: "A metà del programma: fermato a TCP/UDP.",
      }),
      e("Calcolo delle Probabilità", 9, 2, 2, "todo"),
      e("Machine Learning", 12, 3, 1, "todo"),
      e("Sistemi Distribuiti", 6, 3, 1, "todo"),
    ],
  };
};
