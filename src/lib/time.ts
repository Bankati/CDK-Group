/**
 * Lomé est en GMT toute l'année (UTC+0, pas d'heure d'été).
 * On stocke donc les heures en UTC et « heure de Lomé » = heure UTC.
 */

/** "2026-12-01" + "10:30" → Date UTC */
export function toDate(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00Z`);
}

export function dateKeyOf(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function monthKeyOf(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function timeOf(d: Date) {
  return d.toISOString().slice(11, 16);
}

export function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function daysInMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(monthKey: string, n: number) {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${y}`;
}

/** "mardi 1er décembre" (heure de Lomé) */
export function formatDayFr(d: Date, opts: { year?: boolean } = {}) {
  const day = d.getUTCDate();
  const s = `${WEEKDAYS[d.getUTCDay()]} ${day === 1 ? "1er" : day} ${MONTHS[d.getUTCMonth()]}`;
  return opts.year ? `${s} ${d.getUTCFullYear()}` : s;
}

/** "10h00" (heure de Lomé) */
export function formatHourFr(d: Date) {
  return timeOf(d).replace(":", "h");
}

/** "10h00–11h30" */
export function formatRangeFr(start: Date, durationMinutes: number) {
  return `${formatHourFr(start)}–${formatHourFr(addMinutes(start, durationMinutes))}`;
}

/** Heure dans le fuseau du client, ex. "11h00". */
export function formatHourInZone(d: Date, timeZone: string) {
  const s = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return s.replace(":", "h");
}

/** Jour dans le fuseau du client si différent du jour à Lomé. */
export function dayInZone(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}

/** Décalage (minutes) entre un fuseau et GMT à une date donnée. */
export function zoneOffsetMinutes(d: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - d.getTime()) / 60_000);
}

/** "Paris" à partir de "Europe/Paris". */
export function zoneCity(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}
