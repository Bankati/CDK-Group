import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement côté serveur (jamais envoyées au navigateur).
 * Sans SUPABASE_* → MODE DÉMO (données en mémoire, réservations fictives).
 * Sans RESEND_API_KEY → les emails sont affichés dans l'Espace Bovann au lieu d'être envoyés.
 */
const schema = z.object({
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  RESEND_FROM: z.string().default("OCD LIVE <onboarding@resend.dev>"),
  NOTIFICATION_EMAIL: z.email().default("contact@bovanngroup.com"),
  ADMIN_PASSWORD: z.string().min(6).default("bovann2026"),
  ADMIN_SECRET: z.string().min(16).optional(),
});

const empty = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

const parsed = schema.safeParse({
  SUPABASE_URL: empty(process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: empty(process.env.SUPABASE_SERVICE_ROLE_KEY),
  RESEND_API_KEY: empty(process.env.RESEND_API_KEY),
  RESEND_FROM: empty(process.env.RESEND_FROM),
  NOTIFICATION_EMAIL: empty(process.env.NOTIFICATION_EMAIL),
  ADMIN_PASSWORD: empty(process.env.ADMIN_PASSWORD),
  ADMIN_SECRET: empty(process.env.ADMIN_SECRET),
});

if (!parsed.success) {
  console.error("❌ Variables d'environnement serveur invalides :", z.treeifyError(parsed.error));
  throw new Error("Variables d'environnement serveur invalides");
}

export const serverEnv = parsed.data;

export const isDemo = !(serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY);
export const emailsEnabled = Boolean(serverEnv.RESEND_API_KEY);
/** Vrai si aucun mot de passe n'a été défini : on affiche alors l'aide « mode démo ». */
export const usingDefaultPassword = !empty(process.env.ADMIN_PASSWORD);
