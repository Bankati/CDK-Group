"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { appUrl } from "@/server/app-url";
import {
  changeCredentials,
  createResetCode,
  endSession,
  isAdmin,
  loginLocked,
  recoverWithKey,
  resetWithCode,
  signIn,
} from "@/server/auth";
import { cancelBooking, confirmBooking } from "@/server/bookings";
import { emailsEnabled } from "@/server/env";
import { sendEmail } from "@/server/notifications";
import {
  adminEmailChangedEmail,
  adminResetCodeEmail,
  testEmail,
} from "@/server/notifications/templates";
import { passwordProblem } from "@/server/passwords";
import { getNotificationEmails, setNotificationEmails } from "@/server/settings";

/** État renvoyé aux formulaires de connexion et de réinitialisation. */
export type AuthState =
  { error?: string; info?: string; step?: "code"; email?: string; done?: boolean } | undefined;

const field = (form: FormData, name: string) => String(form.get(name) ?? "");
const emailOk = (e: string) => z.email().safeParse(e.trim()).success;

const LOCKED: AuthState = {
  error:
    "Accès désactivé : définis la clé de secours ADMIN_PASSWORD sur le serveur (voir docs/ETAPE-2.md).",
};

/** Nouveau mot de passe + confirmation : renvoie l'erreur à afficher, ou null. */
function checkNewPassword(form: FormData) {
  const pw = field(form, "password");
  if (pw !== field(form, "confirm")) return "Les deux mots de passe ne sont pas identiques.";
  return passwordProblem(pw);
}

/** Connexion : email + mot de passe. */
export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  if (!emailOk(email)) return { error: "Indique ton adresse email.", email };
  const res = await signIn(email, field(form, "password"));
  if (!res.ok) return { error: res.error, email };
  refresh();
  return { done: true };
}

/** Mot de passe oublié, étape 1 : envoie un code à 6 chiffres à l'adresse du compte. */
export async function requestResetCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim();
  if (!emailOk(email)) return { error: "Indique une adresse email valide.", email };
  const res = await createResetCode(email);
  if (res && "wait" in res)
    return {
      error: `Un code vient d'être envoyé. Patiente ${res.wait} s avant d'en redemander un.`,
      step: "code",
      email,
    };
  if (res) {
    const sent = await sendEmail(adminResetCodeEmail(res.to, res.code, await appUrl()));
    if (!sent.ok && !sent.demo)
      return { error: "L'email n'a pas pu partir. Réessaie dans un instant.", email };
  }
  return {
    step: "code",
    email,
    info: emailsEnabled
      ? "Si cette adresse est celle du compte, un code à 6 chiffres vient d'y être envoyé (valable 10 minutes)."
      : "Mode démo : le code est affiché dans la console du serveur (aucun email n'est envoyé).",
  };
}

/** Mot de passe oublié, étape 2 : code reçu + nouveau mot de passe. */
export async function resetPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim();
  const code = field(form, "code").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Le code fait 6 chiffres.", step: "code", email };
  const problem = checkNewPassword(form);
  if (problem) return { error: problem, step: "code", email };
  const res = await resetWithCode(email, code, field(form, "password"));
  if (!res.ok) return { error: res.error, step: "code", email };
  refresh();
  return { done: true };
}

/** Email oublié ou première connexion : la clé de secours redéfinit email + mot de passe. */
export async function recoverAccount(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (loginLocked) return LOCKED;
  const email = field(form, "email").trim();
  if (!emailOk(email)) return { error: "Indique une adresse email valide.", email };
  const problem = checkNewPassword(form);
  if (problem) return { error: problem, email };
  const res = await recoverWithKey(field(form, "key"), email, field(form, "password"));
  if (!res.ok) return { error: res.error, email };
  if (res.previousEmail && res.previousEmail !== email.toLowerCase())
    await sendEmail(adminEmailChangedEmail(res.previousEmail, email.toLowerCase(), await appUrl()));
  refresh();
  return { done: true };
}

/** Réglages : changer l'email et/ou le mot de passe (mot de passe actuel exigé). */
export async function updateCredentials(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim();
  if (!emailOk(email)) return { error: "Indique une adresse email valide." };
  const wantsNew = field(form, "password").length > 0;
  if (wantsNew) {
    const problem = checkNewPassword(form);
    if (problem) return { error: problem };
  }
  const res = await changeCredentials(
    field(form, "current"),
    email,
    wantsNew ? field(form, "password") : null,
  );
  if (!res.ok) return { error: res.error };
  if (res.previousEmail)
    await sendEmail(adminEmailChangedEmail(res.previousEmail, email.toLowerCase(), await appUrl()));
  refresh();
  return {
    info: wantsNew
      ? "Identifiants mis à jour. Les autres appareils connectés ont été déconnectés."
      : "Adresse de connexion mise à jour.",
  };
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
  const sent = await sendEmail(testEmail(to, await appUrl()));
  refresh();
  if (sent.ok) return { ok: true, message: `Email de test envoyé à ${to.join(", ")}.` };
  if (sent.demo)
    return {
      ok: true,
      message:
        "Mode démo : l'email de test n'est pas envoyé (aucune clé Resend). Il partira dès que Resend sera configuré.",
    };
  return {
    ok: false,
    message: `L'email n'est pas parti. Resend répond : ${sent.error ?? "erreur inconnue"}`,
  };
}

export async function cancelReservation(id: string) {
  if (!(await isAdmin())) return { ok: false, message: "Session expirée, reconnecte-toi." };
  const res = await cancelBooking(id);
  refresh();
  return res;
}
