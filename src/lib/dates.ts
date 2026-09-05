const DAY = 86_400_000;

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISO(new Date());
}

/** giorni da oggi (0 = oggi, positivo = futuro) */
export function daysUntil(iso: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((fromISO(iso).getTime() - today.getTime()) / DAY);
}

export function fmtDate(iso: string): string {
  return fromISO(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDay(iso: string): string {
  return String(fromISO(iso).getDate());
}

export function fmtMonthShort(iso: string): string {
  return fromISO(iso).toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
}

export function fmtMonthYear(iso: string): string {
  const s = fromISO(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtToday(): string {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function relDays(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "Oggi";
  if (d === 1) return "Domani";
  if (d > 1) return `tra ${d} giorni`;
  if (d === -1) return "ieri";
  return `${-d} giorni fa`;
}

export function isFutureOrToday(iso: string): boolean {
  return daysUntil(iso) >= 0;
}

export function sessionName(): string {
  const m = new Date().getMonth() + 1;
  if (m === 12 || m <= 2) return "Sessione invernale";
  if (m <= 5) return "Sessione straordinaria";
  if (m <= 7) return "Sessione estiva";
  if (m <= 9) return "Sessione autunnale";
  return "Semestre in corso";
}
