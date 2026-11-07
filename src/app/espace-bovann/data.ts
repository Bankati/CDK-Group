/** Préparation des données de l'Espace Bovann (fonctions pures, utilisables partout). */
import { isBlocking } from "@/lib/availability";
import { getPackage, packageName } from "@/lib/packages";
import { dateKeyOf } from "@/lib/time";
import { displayStatus, type Booking, type DisplayStatus } from "@/lib/types";

export type AdminBooking = Booking & {
  display: DisplayStatus;
  packageLabel: string;
  blocking: boolean;
};

export type Filters = { date?: string; packageId?: string; status?: string; country?: string };

export function toAdmin(b: Booking, now: number): AdminBooking {
  const pkg = getPackage(b.packageId);
  return {
    ...b,
    // En démo, les photos sont stockées en mémoire : on les sert via une petite route protégée.
    photoUrl: b.photoUrl?.startsWith("data:") ? `/espace-bovann/photo/${b.id}` : b.photoUrl,
    display: displayStatus(b, now),
    packageLabel: pkg ? packageName(pkg, b.startsAt.slice(0, 7)) : b.packageId,
    blocking: isBlocking(b, now),
  };
}

export function applyFilters<T extends AdminBooking>(rows: T[], f: Filters) {
  return rows.filter(
    (b) =>
      (!f.date || b.startsAt.startsWith(f.date)) &&
      (!f.packageId || b.packageId === f.packageId) &&
      (!f.status || b.display === f.status) &&
      (!f.country || b.country === f.country),
  );
}

/** Indicateurs du haut de page (heure de Lomé). */
export function kpis(rows: AdminBooking[], now: number) {
  const today = dateKeyOf(new Date(now));
  const d = new Date(`${today}T00:00:00Z`);
  const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000);
  const nextMonday = new Date(monday.getTime() + 7 * 86_400_000);
  const active = rows.filter((b) => b.display === "confirmed" || b.display === "pending");
  const upcoming = active
    .filter((b) => Date.parse(b.startsAt) + b.durationMinutes * 60_000 > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return {
    collected: rows.filter((b) => b.display === "confirmed").reduce((s, b) => s + b.amount, 0),
    pendingAmount: rows.filter((b) => b.display === "pending").reduce((s, b) => s + b.amount, 0),
    bookings: active.length,
    pending: rows.filter((b) => b.display === "pending").length,
    today: active.filter((b) => b.startsAt.startsWith(today)).length,
    week: active.filter(
      (b) => b.startsAt >= monday.toISOString() && b.startsAt < nextMonday.toISOString(),
    ).length,
    next: upcoming[0] ?? null,
  };
}
