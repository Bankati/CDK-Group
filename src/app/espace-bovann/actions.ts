"use server";

import { refresh } from "next/cache";
import { checkPassword, endSession, isAdmin, startSession } from "@/server/auth";
import { cancelBooking, confirmBooking } from "@/server/bookings";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // ralentit les essais au hasard
    return { error: "Mot de passe incorrect" };
  }
  await startSession();
  refresh();
  return {};
}

export async function logout() {
  await endSession();
  refresh();
}

export async function confirmReservation(id: string) {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const res = await confirmBooking(id);
  refresh();
  return res;
}

export async function cancelReservation(id: string) {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const res = await cancelBooking(id);
  refresh();
  return res;
}
