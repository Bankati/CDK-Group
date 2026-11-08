import "server-only";
import { emailsEnabled, serverEnv } from "@/server/env";
import type { Email } from "./templates";

/**
 * Envoi d'un email via Resend. Sans clé Resend (mode démo), l'email n'est pas
 * envoyé : il est seulement noté dans la console du serveur.
 * Phase 2 : ajouter ici SMS / WhatsApp (même principe, un canal = une fonction).
 */
export async function sendEmail(email: Email) {
  if (!emailsEnabled) {
    console.info(
      `✉️  [démo] Email non envoyé (pas de clé Resend) → ${[email.to].flat().join(", ")}
   Objet : ${email.subject}
${email.text}
`,
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
        to: Array.isArray(email.to) ? email.to : [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (e) {
    console.error("Échec d'envoi d'email :", e instanceof Error ? e.message : String(e));
  }
}
