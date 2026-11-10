/**
 * Calcul des disponibilités — fonctions pures, sans base de données.
 * Un créneau n'est proposé que si TOUTE la durée du package est libre.
 */
import { packages, schedule } from "@/config/site";
import { shortestPackageMinutes } from "@/lib/packages";
import { addMinutes, addMonths, dateKeyOf, daysInMonth, toDate } from "@/lib/time";
import type { Booking } from "@/lib/types";

export type BusyInterval = { start: number; end: number };

/** Une réservation bloque le planning si elle est confirmée, ou en attente et encore dans son délai. */
export function isBlocking(b: Pick<Booking, "status" | "holdExpiresAt">, now: number) {
  return b.status === "confirmed" || (b.status === "pending" && Date.parse(b.holdExpiresAt) > now);
}

export function busyIntervals(bookings: Booking[], now: number): BusyInterval[] {
  return bookings
    .filter((b) => isBlocking(b, now))
    .map((b) => {
      const start = Date.parse(b.startsAt);
      return {
        start: start - schedule.bufferMinutes * 60_000,
        end: start + (b.durationMinutes + schedule.bufferMinutes) * 60_000,
      };
    });
}

export function overlaps(start: number, end: number, busy: BusyInterval[]) {
  return busy.some((i) => start < i.end && end > i.start);
}

/** Heures de début possibles ("HH:MM") pour une date et une durée. */
export function availableStarts(
  dateKey: string,
  durationMinutes: number,
  busy: BusyInterval[],
  now: number,
): string[] {
  if (!isBookableDay(dateKey, now)) return [];
  const open = toDate(dateKey, `${String(schedule.openHour).padStart(2, "0")}:00`);
  const close = toDate(dateKey, `${String(schedule.closeHour).padStart(2, "0")}:00`);
  const earliest = now + schedule.minLeadMinutes * 60_000;
  const result: string[] = [];
  for (
    let t = open;
    addMinutes(t, durationMinutes) <= close;
    t = addMinutes(t, schedule.slotStepMinutes)
  ) {
    const start = t.getTime();
    const end = start + durationMinutes * 60_000;
    if (start < earliest) continue;
    if (overlaps(start, end, busy)) continue;
    result.push(t.toISOString().slice(11, 16));
  }
  return result;
}

/** Dernier mois ouvert à la réservation (le calendrier en affiche `monthsAhead`). */
const lastMonth = addMonths(schedule.firstDay.slice(0, 7), schedule.monthsAhead - 1);

export function isBookableDay(dateKey: string, now: number) {
  // Une vraie date (pas de « 31 février », qui deviendrait le 3 mars).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || dateKeyOf(toDate(dateKey, "12:00")) !== dateKey)
    return false;
  if (dateKey < schedule.firstDay || dateKey.slice(0, 7) > lastMonth) return false;
  if (schedule.closedDates.includes(dateKey)) return false;
  return dateKey >= dateKeyOf(new Date(now));
}

export type DayState = "open" | "full" | "unavailable";

/** État de chaque jour d'un mois : « full » si même le plus court des packages ne rentre plus. */
export function monthDayStates(monthKey: string, bookings: Booking[], now: number) {
  const busy = busyIntervals(bookings, now);
  const states: Record<string, DayState> = {};
  for (let d = 1; d <= daysInMonth(monthKey); d++) {
    const key = `${monthKey}-${String(d).padStart(2, "0")}`;
    if (!isBookableDay(key, now)) states[key] = "unavailable";
    else
      states[key] = availableStarts(key, shortestPackageMinutes, busy, now).length
        ? "open"
        : "full";
  }
  return states;
}

/** Pour un jour : la liste des heures de début possibles par package. */
export function daySlotsByPackage(dateKey: string, bookings: Booking[], now: number) {
  const busy = busyIntervals(bookings, now);
  return Object.fromEntries(
    packages.map((p) => [p.id, availableStarts(dateKey, p.durationMinutes, busy, now)]),
  ) as Record<string, string[]>;
}

/** Places restantes du Pack du mois pour un mois donné. */
export function monthlyRemaining(
  monthKey: string,
  packageId: string,
  quota: number,
  bookings: Booking[],
  now: number,
) {
  const used = bookings.filter(
    (b) => b.packageId === packageId && b.startsAt.startsWith(monthKey) && isBlocking(b, now),
  ).length;
  return Math.max(0, quota - used);
}
