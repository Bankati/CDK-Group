import "server-only";
import { busyIntervals, monthlyRemaining, overlaps } from "@/lib/availability";
import type { Booking } from "@/lib/types";
import type { BookingRepository, InsertResult } from "./repository";
import { seedBookings } from "./seed";

/**
 * MODE DÉMO : les réservations vivent en mémoire tant que le serveur tourne.
 * Redémarrer le serveur remet les réservations fictives de départ.
 */
const store = globalThis as unknown as { __ocdBookings?: Booking[] };

function data() {
  store.__ocdBookings ??= seedBookings();
  return store.__ocdBookings;
}

export const memoryRepository: BookingRepository = {
  async list(range) {
    const all = data();
    const rows = range ? all.filter((b) => b.startsAt >= range.from && b.startsAt < range.to) : all;
    return structuredClone(rows);
  },

  async get(id) {
    const b = data().find((x) => x.id === id);
    return b ? structuredClone(b) : null;
  },

  // Vérification + insertion dans la même opération synchrone : impossible
  // que deux demandes simultanées obtiennent le même créneau.
  async insertIfFree(booking, { now, monthlyQuota }): Promise<InsertResult> {
    const all = data();
    const start = Date.parse(booking.startsAt);
    const end = start + booking.durationMinutes * 60_000;
    if (overlaps(start, end, busyIntervals(all, now))) return "slot_taken";
    if (monthlyQuota !== undefined) {
      const left = monthlyRemaining(
        booking.startsAt.slice(0, 7),
        booking.packageId,
        monthlyQuota,
        all,
        now,
      );
      if (left <= 0) return "sold_out";
    }
    all.push(structuredClone(booking));
    return "ok";
  },

  async update(id, patch) {
    const b = data().find((x) => x.id === id);
    if (!b) return null;
    Object.assign(b, patch);
    return structuredClone(b);
  },

  async savePhoto(_id, dataUrl) {
    return dataUrl;
  },
};
