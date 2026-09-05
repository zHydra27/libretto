import type { Exam, ExamStatus, Settings } from "../types";
import { gradeValue } from "../types";
import { isFutureOrToday } from "./dates";

export interface Stats {
  passed: Exam[];
  cfuPassed: number;
  cfuPlanned: number;
  weighted: number | null;
  arith: number | null;
  baseGrade: number | null;
  estimated: number | null;
  pct: number;
  counts: Record<ExamStatus, number>;
  cfuInPlay: number;
  upcoming: Exam[];
  overdue: Exam[];
  lastPassed: Exam | null;
  recentPassed: Exam[];
}

export function computeStats(exams: Exam[], settings: Settings): Stats {
  const counts: Record<ExamStatus, number> = {
    todo: 0,
    study: 0,
    booked: 0,
    passed: 0,
    failed: 0,
  };
  for (const e of exams) counts[e.status] += 1;

  const passed = exams.filter((e) => e.status === "passed");
  const cfuPassed = passed.reduce((s, e) => s + e.cfu, 0);
  const cfuPlanned = exams.reduce((s, e) => s + e.cfu, 0);
  const cfuInPlay = exams
    .filter((e) => e.status === "study" || e.status === "booked")
    .reduce((s, e) => s + e.cfu, 0);

  let weighted: number | null = null;
  let arith: number | null = null;
  if (passed.length && cfuPassed > 0) {
    const w = passed.reduce((s, e) => s + gradeValue(e) * e.cfu, 0) / cfuPassed;
    weighted = Math.round(w * 100) / 100;
    arith =
      Math.round((passed.reduce((s, e) => s + gradeValue(e), 0) / passed.length) * 100) / 100;
  }

  const baseGrade = weighted != null ? Math.round(weighted * (110 / 30) * 100) / 100 : null;
  const estimated =
    weighted != null
      ? Math.round((Math.min(110, weighted * (110 / 30)) + settings.bonus) * 10) / 10
      : null;

  const pct = settings.targetCfu > 0 ? (cfuPassed / settings.targetCfu) * 100 : 0;

  const withDate = (list: Exam[]) =>
    list.filter((e) => e.date).sort((a, b) => (a.date! < b.date! ? -1 : 1));

  const upcoming = withDate(
    exams.filter((e) => e.status === "booked" && e.date && isFutureOrToday(e.date)),
  );
  const overdue = withDate(
    exams.filter((e) => e.status === "booked" && e.date && !isFutureOrToday(e.date)),
  );

  const recentPassed = withDate(passed).reverse();
  const lastPassed = recentPassed[0] ?? null;

  return {
    passed,
    cfuPassed,
    cfuPlanned,
    weighted,
    arith,
    baseGrade,
    estimated,
    pct,
    counts,
    cfuInPlay,
    upcoming,
    overdue,
    lastPassed,
    recentPassed: recentPassed.slice(0, 3),
  };
}

export function gradeColor(v: number): string {
  if (v >= 28) return "#2e7d51";
  if (v >= 24) return "#39805f";
  if (v >= 21) return "#e39b26";
  return "#c9820f";
}

export function fmtNum(n: number | null, decimals = 1): string {
  if (n == null) return "—";
  return n.toFixed(decimals).replace(".", ",");
}
