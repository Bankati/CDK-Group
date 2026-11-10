import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { after } from "next/server";
import { booking as bookingRules } from "@/config/site";
import {
  availableStarts,
  busyIntervals,
  daySlotsByPackage,
  monthDayStates,
  monthlyRemaining,
  overlaps,
} from "@/lib/availability";
import { bookingInputSchema } from "@/lib/booking-schema";
import { getPackage, monthlyPackage } from "@/lib/packages";
import { addMonths, toDate } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { appUrl } from "@/server/app-url";
import { db } from "@/server/db";
import { sendEmail } from "@/server/notifications";
import { getNotificationEmails } from "@/server/settings";
import {
  adminNewBookingEmail,
  clientConfirmedEmail,
  clientPendingEmail,
} from "@/server/notifications/templates";

const monthRange = (monthKey: string) => ({
  from: `${monthKey}-01T00:00:00.000Z`,
  to: `${addMonths(monthKey, 1)}-01T00:00:00.000Z`,
});

const dayRange = (dateKey: string) => {
  const from = toDate(dateKey, "00:00");
  return { from: from.toISOString(), to: new Date(from.getTime() + 86_400_000).toISOString() };
};

function packRemaining(monthKey: string, bookings: Booking[], now: number) {
  if (!monthlyPackage?.monthlyQuota) return null;
  return monthlyRemaining(monthKey, monthlyPackage.id, monthlyPackage.monthlyQuota, bookings, now);
}

export async function getMonthAvailability(monthKey: string) {
  const now = Date.now();
  const bookings = await db.list(monthRange(monthKey));
  return {
    days: monthDayStates(monthKey, bookings, now),
    packRemaining: packRemaining(monthKey, bookings, now),
  };
}

export async function getDayAvailability(dateKey: string) {
  const now = Date.now();
  const monthKey = dateKey.slice(0, 7);
  const bookings = await db.list(monthRange(monthKey));
  const dayBookings = bookings.filter((b) => b.startsAt.startsWith(dateKey));
  return {
    slots: daySlotsByPackage(dateKey, dayBookings, now),
    packRemaining: packRemaining(monthKey, bookings, now),
  };
}

function newCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return `OCD-${Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
}

export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "slot_taken" | "sold_out" | "error"; message: string };

export async function createBooking(raw: unknown): Promise<CreateResult> {
  const parsed = bookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }
  const input = parsed.data;
  const pkg = getPackage(input.packageId)!;
  const now = Date.now();

  // L'heure choisie doit faire partie des créneaux proposés (horaires, délai, durée complète libre).
  const dayBookings = await db.list(dayRange(input.date));
  if (
    !availableStarts(
      input.date,
      pkg.durationMinutes,
      busyIntervals(dayBookings, now),
      now,
    ).includes(input.time)
  ) {
    return {
      ok: false,
      reason: "slot_taken",
      message: "Ce créneau vient d'être pris. Choisis une autre heure.",
    };
  }

  const id = randomUUID();
  const booking: Booking = {
    id,
    code: newCode(),
    createdAt: new Date(now).toISOString(),
    mode: input.mode,
    packageId: pkg.id,
    startsAt: toDate(input.date, input.time).toISOString(),
    durationMinutes: pkg.durationMinutes,
    amount: pkg.price, // prix lu dans la configuration, jamais envoyé par le navigateur
    fullName: input.fullName,
    whatsapp: input.whatsapp,
    email: input.email.toLowerCase(),
    businessName: input.businessName,
    sector: input.sector,
    products: input.products,
    tiktok: input.tiktok ? `@${input.tiktok.replace(/^@+/, "")}` : undefined,
    country: input.mode === "presentiel" ? "Togo" : input.country,
    city: input.mode === "presentiel" ? "Lomé" : input.city,
    clientTimezone: input.clientTimezone,
    status: "pending",
    holdExpiresAt: new Date(now + bookingRules.holdHours * 3_600_000).toISOString(),
  };

  try {
    const result = await db.insertIfFree(booking, { now, monthlyQuota: pkg.monthlyQuota });
    if (result === "slot_taken")
      return {
        ok: false,
        reason: "slot_taken",
        message: "Ce créneau vient d'être pris. Choisis une autre heure.",
      };
    if (result === "sold_out")
      return {
        ok: false,
        reason: "sold_out",
        message: "Toutes les places de ce pack sont parties pour ce mois.",
      };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      reason: "error",
      message: "Un problème technique est survenu. Réessaie dans un instant.",
    };
  }

  const url = await appUrl();
  after(async () => {
    let saved = booking;
    if (input.photo) {
      try {
        const photoUrl = await db.savePhoto(id, input.photo);
        saved = (await db.update(id, { photoUrl })) ?? booking;
      } catch (e) {
        console.error("Photo non enregistrée :", e);
      }
    }
    await Promise.all([
      getNotificationEmails().then((to) => sendEmail(adminNewBookingEmail(saved, to, url))),
      sendEmail(clientPendingEmail(saved, url)),
    ]);
  });

  return { ok: true, id };
}

export async function confirmBooking(id: string) {
  const b = await db.get(id);
  if (!b) return { ok: false as const, message: "Réservation introuvable" };
  if (b.status === "confirmed") return { ok: true as const };
  const now = Date.now();
  const others = (await db.list(dayRange(b.startsAt.slice(0, 10)))).filter((x) => x.id !== id);
  const start = Date.parse(b.startsAt);
  if (overlaps(start, start + b.durationMinutes * 60_000, busyIntervals(others, now))) {
    return { ok: false as const, message: "Ce créneau a été repris par une autre réservation." };
  }
  const updated = await db.update(id, {
    status: "confirmed",
    validatedAt: new Date(now).toISOString(),
  });
  if (updated) {
    const url = await appUrl();
    // Attendu (et non différé) pour que l'email apparaisse tout de suite dans l'Espace Bovann.
    await sendEmail(clientConfirmedEmail(updated, url));
  }
  return { ok: true as const };
}

export async function cancelBooking(id: string) {
  const updated = await db.update(id, { status: "cancelled" });
  return updated
    ? { ok: true as const }
    : { ok: false as const, message: "Réservation introuvable" };
}
