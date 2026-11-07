import "server-only";
import { emailsEnabled, serverEnv } from "@/server/env";
import type { Email } from "./templates";

export type SentEmail = Email & { at: string; delivered: boolean; error?: string };

/**
 * Sans clé Resend, les emails ne partent pas : ils sont gardés ici
 * et affichés dans l'Espace Bovann (onglet « Emails »), pratique pour la démo.
 * Phase 2 : ajouter ici SMS / WhatsApp (même principe, un canal = une fonction).
 */
const store = globalThis as unknown as { __ocdOutbox?: SentEmail[] };
const outbox = () => (store.__ocdOutbox ??= []);

export function recentEmails() {
  return [...outbox()].reverse().slice(0, 30);
}

export async function sendEmail(email: Email) {
  const entry: SentEmail = { ...email, at: new Date().toISOString(), delivered: false };
  outbox().push(entry);
  if (outbox().length > 100) outbox().shift();

  if (!emailsEnabled) {
    console.info(
      `✉️  [démo] Email non envoyé (pas de clé Resend) → ${email.to} : ${email.subject}`,
    );
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: serverEnv.RESEND_FROM,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    entry.delivered = true;
  } catch (e) {
    entry.error = e instanceof Error ? e.message : String(e);
    console.error("Échec d'envoi d'email :", entry.error);
  }
}
