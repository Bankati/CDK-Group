"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { appUrl } from "@/server/app-url";
import { checkPassword, endSession, isAdmin, loginLocked, startSession } from "@/server/auth";
import { cancelBooking, confirmBooking } from "@/server/bookings";
import { emailsEnabled } from "@/server/env";
import { sendEmail } from "@/server/notifications";
import { testEmail } from "@/server/notifications/templates";
import { getNotificationEmails, setNotificationEmails } from "@/server/settings";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  if (loginLocked) {
    return {
      error:
        "Connexion désactivée : définis ADMIN_PASSWORD (mot de passe de l'Espace Bovann) sur le serveur.",
    };
  }
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

export type SettingsState = { ok?: boolean; message?: string; emails?: string[] } | undefined;

/** Enregistre les adresses qui reçoivent chaque nouvelle réservation (séparées par des virgules). */
export async function saveNotificationEmails(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const emails = [
    ...new Set(
      String(form.get("emails") ?? "")
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (emails.length === 0) return { ok: false, message: "Indique au moins une adresse email." };
  if (emails.length > 5) return { ok: false, message: "5 adresses maximum." };
  const bad = emails.find((e) => !z.email().safeParse(e).success);
  if (bad) return { ok: false, message: `Adresse invalide : ${bad}` };
  await setNotificationEmails(emails);
  refresh();
  return {
    ok: true,
    message: "Enregistré. Les prochaines réservations seront envoyées à ces adresses.",
    emails,
  };
}

/** Envoie un email de test aux adresses enregistrées. */
export async function sendTestNotification() {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const to = await getNotificationEmails();
  await sendEmail(testEmail(to, await appUrl()));
  refresh();
  return {
    ok: true,
    message: emailsEnabled
      ? `Email de test envoyé à ${to.join(", ")}.`
      : `Mode démo : l'email de test n'est pas envoyé (aucune clé Resend). Il partira dès que Resend sera configuré.`,
  };
}

export async function cancelReservation(id: string) {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const res = await cancelBooking(id);
  refresh();
  return res;
}
